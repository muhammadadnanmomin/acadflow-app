"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { Upload, FileText } from "lucide-react";

const supabase = createClient()

export default function ParticipantSubmissionsPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    // 1️⃣ Load author registrations (with deadline)
    const { data: regs, error: regErr } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        conference_id,
        conferences ( title, submission_deadline )
      `)
      .eq("user_id", profile.id)
      .eq("role", "author");

    if (regErr) {
      console.error(regErr);
      setLoading(false);
      return;
    }

    if (!regs || regs.length === 0) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    setRegistrations(regs);

    // 2️⃣ Load submissions separately
    const confIds = regs.map((r) => r.conference_id);

    const { data: subs, error: subErr } = await supabase
      .from("paper_submissions")
      .select("id, conference_id, file_url, status, created_at, reviewed_at")
      .eq("user_id", profile.id)
      .in("conference_id", confIds);

    if (subErr) {
      console.error(subErr);
      setLoading(false);
      return;
    }

    // 3️⃣ Map submissions by conference_id
    const map: Record<string, any> = {};
    subs?.forEach((s) => {
      map[s.conference_id] = s;
    });

    setSubmissions(map);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  async function submitPaper(confId: string) {
    const file = files[confId];
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    setSubmitting(confId);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Session expired");
      setSubmitting(null);
      return;
    }

    const path = `${session.user.id}/${confId}/${Date.now()}_${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("papers")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      alert(uploadErr.message);
      setSubmitting(null);
      return;
    }

    const url = supabase.storage
      .from("papers")
      .getPublicUrl(path).data.publicUrl;

    const { error } = await supabase
      .from("paper_submissions")
      .upsert({
        user_id: session.user.id,
        conference_id: confId,
        file_url: url,
        status: "submitted",
      });

    if (error) {
      alert(error.message);
    } else {
      alert("Paper submitted successfully");
      loadData();
    }

    setSubmitting(null);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <h1 className="text-3xl font-bold">My Submissions</h1>

      {loading && <p>Loading...</p>}

      {!loading && registrations.length === 0 && (
        <p>You are not registered as an author.</p>
      )}

      {!loading &&
        registrations.map((r) => {
          const submission = submissions[r.conference_id];

          const deadlinePassed =
            r.conferences?.submission_deadline &&
            new Date() > new Date(r.conferences.submission_deadline);

          const reviewLocked = Boolean(submission?.reviewed_at);

          return (
            <Card key={r.id} className="p-5 space-y-4">
              {/* Header */}
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">
                    {r.conferences?.title}
                  </span>
                </div>

                {submission && (
                  <StatusBadge status={submission.status} />
                )}
              </div>

              {/* Uploaded file */}
              {submission?.file_url && (
                <a
                  href={submission.file_url}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  View Uploaded Paper
                </a>
              )}

              {/* Review lock */}
              {reviewLocked && (
                <p className="text-xs text-gray-500">
                  Review completed. Upload locked.
                </p>
              )}

              {/* Deadline lock */}
              {deadlinePassed && (
                <p className="text-sm text-red-600">
                  Submission deadline has passed.
                </p>
              )}

              {/* Upload */}
              <div className="flex gap-3">
                <Input
                  type="file"
                  accept=".pdf"
                  disabled={reviewLocked || deadlinePassed}
                  onChange={(e) =>
                    setFiles({
                      ...files,
                      [r.conference_id]:
                        e.target.files?.[0] || null,
                    })
                  }
                />

                <Button
                  disabled={
                    submitting === r.conference_id ||
                    reviewLocked ||
                    deadlinePassed
                  }
                  onClick={() => submitPaper(r.conference_id)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {submitting === r.conference_id
                    ? "Uploading..."
                    : submission
                      ? "Re-upload"
                      : "Upload"}
                </Button>
              </div>
            </Card>
          );
        })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge className="bg-green-100">Accepted</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100">Rejected</Badge>;
  if (status === "submitted")
    return <Badge className="bg-blue-100">Submitted</Badge>;
  return <Badge>Pending</Badge>;
}
