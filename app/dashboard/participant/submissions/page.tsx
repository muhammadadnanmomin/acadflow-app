"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import {
  Upload,
  FileText,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
} from "lucide-react";

export default function ParticipantSubmissionsPage() {
  const { profile } = useProfile();
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    const { data: regs } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        conference_id,
        conferences ( title, submission_deadline )
      `)
      .eq("user_id", profile.id)
      .eq("role", "author");

    setRegistrations(regs || []);

    const confIds = regs?.map(r => r.conference_id) || [];

    const { data: subs } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        conference_id,
        file_url,
        status,
        created_at,
        reviewer_id,
        payment_status
      `)
      .eq("user_id", profile.id)
      .in("conference_id", confIds);

    const map: Record<string, any> = {};
    subs?.forEach(s => {
      map[s.conference_id] = s;
    });

    setSubmissions(map);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  async function uploadPaper(confId: string) {
    const file = files[confId];

    if (!file) {
      toast({ variant: "destructive", title: "Select a PDF file first" });
      return;
    }

    setUploading(confId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const path = `${session.user.id}/${confId}/${Date.now()}_${file.name}`;

    await supabase.storage.from("papers").upload(path, file, { upsert: true });

    const url = supabase.storage.from("papers").getPublicUrl(path).data.publicUrl;

    await supabase.from("paper_submissions").upsert({
      user_id: session.user.id,
      conference_id: confId,
      file_url: url,
      status: "submitted",
    });

    toast({ title: "Paper uploaded successfully ✅" });

    setUploading(null);
    loadData();
  }

  return (
    <div className="space-y-8 max-w-6xl">

      <div>
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <p className="text-gray-500 mt-1">
          Upload and track your paper submissions
        </p>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && registrations.map(reg => {
        const submission = submissions[reg.conference_id];
        const deadline = reg.conferences?.submission_deadline;

        const deadlinePassed =
          deadline && new Date(deadline) < new Date();

        const isAccepted = submission?.status === "accepted";
        const isRejected = submission?.status === "rejected";
        const isUnderReview = submission?.status === "submitted";

        const locked =
          deadlinePassed || isAccepted || isRejected;

        return (
          <Card key={reg.id} className="p-5 space-y-4">

            {/* Header */}
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">
                  {reg.conferences?.title}
                </span>
              </div>
              {submission && <StatusBadge status={submission.status} />}
            </div>

            {deadline && (
              <div className="text-sm text-gray-500">
                Submission Deadline: {deadline}
              </div>
            )}

            {/* Upload */}
            {!submission && !deadlinePassed && (
              <div className="flex gap-3">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setFiles(prev => ({
                      ...prev,
                      [reg.conference_id]: e.target.files?.[0] || null,
                    }))
                  }
                />
                <Button
                  disabled={uploading === reg.conference_id}
                  onClick={() => uploadPaper(reg.conference_id)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>
            )}

            {deadlinePassed && !submission && (
              <StatusNote icon={<Lock className="h-4 w-4" />} text="Submission deadline has passed." />
            )}

            {/* Submission Details */}
            {submission && (
              <div className="space-y-2 text-sm">

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  Submitted: {new Date(submission.created_at).toLocaleString()}
                </div>

                {submission.reviewer_id && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <UserCheck className="h-4 w-4" />
                    Reviewer Assigned
                  </div>
                )}

                {isUnderReview && (
                  <StatusNote
                    icon={<AlertCircle className="h-4 w-4" />}
                    text="Your paper is under review."
                  />
                )}

                {isAccepted && (
                  <>
                    <StatusNote
                      icon={<CheckCircle className="h-4 w-4" />}
                      text="Congratulations! Your paper is accepted."
                    />

                    {submission.payment_status !== "paid" && (
                      <Button
                        className="mt-2"
                        onClick={() => router.push("/dashboard/participant/payments")}
                      >
                        Proceed to Payment
                      </Button>
                    )}

                    {submission.payment_status === "paid" && (
                      <StatusNote
                        icon={<CheckCircle className="h-4 w-4" />}
                        text="Payment completed. Await presentation schedule."
                      />
                    )}
                  </>
                )}

                {isRejected && (
                  <StatusNote
                    icon={<XCircle className="h-4 w-4" />}
                    text="Your paper was not accepted."
                  />
                )}

                {/* Re-upload allowed only before review & deadline */}
                {!locked && (
                  <div className="flex gap-3 pt-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setFiles(prev => ({
                          ...prev,
                          [reg.conference_id]: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={uploading === reg.conference_id}
                      onClick={() => uploadPaper(reg.conference_id)}
                    >
                      Re-upload
                    </Button>
                  </div>
                )}

                {locked && !isAccepted && !isRejected && (
                  <StatusNote
                    icon={<Lock className="h-4 w-4" />}
                    text="Re-upload is locked."
                  />
                )}

              </div>
            )}

          </Card>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
  if (status === "submitted")
    return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}

function StatusNote({ icon, text }: any) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      {icon}
      {text}
    </div>
  );
}