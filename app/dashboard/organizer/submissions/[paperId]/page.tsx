"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Users,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerPaperReviewPage() {
  const { paperId } = useParams();
  const router = useRouter();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadPaper() {
    if (!paperId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        *,
        conferences ( title )
      `)
      .eq("id", paperId)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPaper(data);
    setNote(data.review_comment || "");

    // ✅ Load authors list
    const { data: authorRows } = await supabase
      .from("paper_authors")
      .select("*")
      .eq("submission_id", paperId)
      .order("author_order", { ascending: true });

    setAuthors(authorRows || []);

    setLoading(false);
  }

  useEffect(() => {
    loadPaper();
  }, [paperId]);

async function updateStatus(status: "accepted" | "rejected") {
  setSubmitting(true);

  // prevent duplicate decision
  if (paper.status === status && paper.decision_email_sent) {
    router.push("/dashboard/organizer/submissions");
    return;
  }

  // 1️⃣ Update DB
  await supabase
    .from("paper_submissions")
    .update({
      status,
      decision_at: new Date().toISOString(),
      review_comment: note,
    })
    .eq("id", paper.id);

  try {
    // 2️⃣ send email to ALL authors
    for (const author of authors) {
      if (!author.email) continue;

      const cleanName =
        author.name &&
        !author.name.toLowerCase().includes("author")
          ? author.name.trim()
          : "Author";

      const res = await fetch("/api/send-decision-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: author.email,
          name: cleanName,
          conference: paper.conferences?.title,
          status,
        }),
      });

      if (!res.ok) {
        console.error("Email API error");
      }
    }

    // 3️⃣ mark email sent
    await supabase
      .from("paper_submissions")
      .update({ decision_email_sent: true })
      .eq("id", paper.id);

  } catch (err) {
    console.error("Email failed:", err);
  }

  // small delay ensures requests complete
  await new Promise(resolve => setTimeout(resolve, 300));

  // 4️⃣ redirect
  router.push("/dashboard/organizer/submissions");
}

  async function uploadCameraReady(file: File) {
    const path = `camera-ready/${paper.id}_${file.name}`;

    await supabase.storage.from("papers").upload(path, file, {
      upsert: true,
    });

    const url = supabase.storage
      .from("papers")
      .getPublicUrl(path).data.publicUrl;

    await supabase
      .from("paper_submissions")
      .update({ camera_ready_url: url })
      .eq("id", paper.id);

    loadPaper();
  }

  if (loading) {
    return <p className="p-10 text-sm text-gray-500">Loading paper…</p>;
  }

  if (!paper) {
    return <p className="p-10 text-sm text-gray-500">Paper not found.</p>;
  }

  const title = paper.title || `Paper #${paper.id.slice(0, 8)}`;
  const primaryAuthor = authors.find(a => a.is_primary);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Conference: {paper.conferences?.title}
        </p>
      </div>

      {/* WORKFLOW STATUS */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <WorkflowBadge paper={paper} />

          <Badge className={
            paper.plagiarism_status === "passed"
              ? "bg-green-100 text-green-700"
              : paper.plagiarism_status === "flagged"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }>
            Plagiarism: {paper.plagiarism_status || "pending"}
          </Badge>

          {paper.reviewer_id && (
            <Badge className="bg-blue-100 text-blue-700">
              Reviewer Assigned
            </Badge>
          )}

          {paper.presentation_fee_paid && (
            <Badge className="bg-green-100 text-green-700">
              Presentation Paid
            </Badge>
          )}

{paper.decision_email_sent && (
  <Badge className="bg-green-100 text-green-700">
    Email Sent
  </Badge>
)}
        </div>

        <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
          <span>
            Submitted: {new Date(paper.created_at).toLocaleDateString()}
          </span>

          {paper.reviewed_at && (
            <span>
              Reviewer finished: {new Date(paper.reviewed_at).toLocaleDateString()}
            </span>
          )}

          {paper.decision_at && (
            <span>
              Decision: {new Date(paper.decision_at).toLocaleDateString()}
            </span>
          )}

          {paper.revision_number > 1 && (
            <span>Revision: {paper.revision_number}</span>
          )}
        </div>
      </Card>

      {/* AUTHORS */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users size={16} /> Authors
        </h2>

        {authors.length === 0 && (
          <p className="text-sm text-gray-500">
            {paper.author_names || "No author data available"}
          </p>
        )}

        {authors.map((a, i) => (
          <div
            key={a.id}
            className={`border rounded-md p-3 ${a.is_primary ? "bg-blue-50 border-blue-200" : ""
              }`}
          >
            <p className="font-medium text-sm">
              {a.author_order}. {a.name}
              {a.is_primary && (
                <span className="ml-2 text-xs text-blue-600">
                  (Primary Author)
                </span>
              )}
            </p>

            <p className="text-xs text-gray-600">{a.affiliation}</p>
            <p className="text-xs text-gray-500">{a.email}</p>
          </div>
        ))}
      </Card>

      {/* DECLARATIONS */}
      <Card className="p-5 space-y-2">
        <h2 className="font-semibold">Declarations</h2>

        <Declaration ok={paper.declaration_original} text="Original work" />
        <Declaration ok={paper.declaration_no_plagiarism} text="No plagiarism" />
        <Declaration ok={paper.declaration_author_approval} text="Author approvals" />
      </Card>

      {/* FILE */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Paper File</h2>

        {paper.file_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={paper.file_url} target="_blank">
              <Eye className="h-4 w-4 mr-1" />
              View Paper
            </a>
          </Button>
        )}

        {paper.camera_ready_url && (
          <p className="text-sm text-green-600">
            Camera-ready version uploaded
          </p>
        )}

        <label className="text-blue-600 cursor-pointer hover:underline text-sm flex items-center gap-1">
          <Upload size={14} />
          Upload Camera Ready
          <input
            type="file"
            className="hidden"
            onChange={(e) =>
              e.target.files &&
              uploadCameraReady(e.target.files[0])
            }
          />
        </label>
      </Card>

      {/* REVIEWER COMMENT */}
      {paper.review_comment && (
        <Card className="p-5 space-y-2">
          <h2 className="font-semibold">Reviewer Comment</h2>
          <p className="text-sm text-gray-700">{paper.review_comment}</p>
        </Card>
      )}

      {/* ORGANIZER NOTE */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Organizer Final Remarks</h2>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add final decision notes..."
        />
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <Button
          variant="destructive"
          disabled={submitting}
          onClick={() => updateStatus("rejected")}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Reject
        </Button>

        <Button
          disabled={submitting}
          onClick={() => updateStatus("accepted")}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Accept
        </Button>
      </div>
    </div>
  );
}

/* ---------- WORKFLOW BADGE ---------- */

function WorkflowBadge({ paper }: { paper: any }) {
  if (paper.status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;

  if (paper.status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;

  if (paper.reviewed_at)
    return (
      <Badge className="bg-yellow-100 text-yellow-700">
        Awaiting Decision
      </Badge>
    );

  if (paper.reviewer_id)
    return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;

  return <Badge className="bg-gray-100 text-gray-700">Submitted</Badge>;
}

function Declaration({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`text-sm ${ok ? "text-green-600" : "text-red-600"}`}>
      {ok ? "✔" : "✖"} {text}
    </p>
  );
}