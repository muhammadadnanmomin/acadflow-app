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
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle
} from "lucide-react";

export default function ReviewerReviewPage() {
  const { paperId } = useParams();
  const router = useRouter();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  /* Load draft */
  useEffect(() => {
    if (paperId) {
      const saved = localStorage.getItem(`review-draft-${paperId}`);
      if (saved) setComments(saved);
    }
  }, [paperId]);

  /* Load paper */
  useEffect(() => {
    async function loadPaper() {
      if (!profile || !paperId) return;

      setLoading(true);

      const { data } = await supabase
        .from("paper_submissions")
        .select(`
          id,
          title,
          file_url,
          camera_ready_url,
          status,
          plagiarism_status,
          review_comment,
          reviewer_id,
          reviewed_at,
          created_at,
          revision_number
        `)
        .eq("id", paperId)
        .eq("reviewer_id", profile.id)
        .maybeSingle();

      if (!data) {
        router.push("/dashboard/reviewer/papers");
        return;
      }

      setPaper(data);

      if (data.review_comment) {
        setComments(data.review_comment);
      }

      // load authors (optional for blind review — remove if double blind)
      const { data: authorRows } = await supabase
        .from("paper_authors")
        .select("name, affiliation, author_order, is_primary")
        .eq("submission_id", paperId)
        .order("author_order", { ascending: true });

      setAuthors(authorRows || []);

      setLoading(false);
    }

    loadPaper();
  }, [profile, paperId]);

  /* autosave draft */
  useEffect(() => {
    if (paperId) {
      localStorage.setItem(`review-draft-${paperId}`, comments);
    }
  }, [comments, paperId]);

  async function submitReview(decision: "accepted" | "rejected") {
    if (!comments.trim()) {
      alert("Please write review comments.");
      return;
    }

    const confirmDecision = confirm(
      `Submit review as ${decision.toUpperCase()}?`
    );
    if (!confirmDecision) return;

    setSubmitting(true);

    await supabase
      .from("paper_submissions")
      .update({
        status: decision,
        review_comment: comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paper.id)
      .eq("reviewer_id", profile!.id);

    localStorage.removeItem(`review-draft-${paperId}`);
    router.push("/dashboard/reviewer/papers");
  }

  if (loading) {
    return <p className="p-10 text-sm text-gray-500">Loading paper…</p>;
  }

  const reviewed = !!paper.reviewed_at;
  const title = paper.title || `Paper #${paper.id.slice(0, 6)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Evaluate and submit your review decision
        </p>
      </div>

      {/* PAPER STATUS */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <WorkflowBadge paper={paper} />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          Submitted {new Date(paper.created_at).toLocaleDateString()}
        </div>

        {paper.revision_number > 1 && (
          <Badge className="bg-gray-100 text-gray-700">
            Revision {paper.revision_number}
          </Badge>
        )}

        {/* plagiarism */}
        <Badge className={
          paper.plagiarism_status === "passed"
            ? "bg-green-100 text-green-700"
            : paper.plagiarism_status === "flagged"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700"
        }>
          Plagiarism: {paper.plagiarism_status}
        </Badge>

        {paper.plagiarism_status === "flagged" && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle size={16} />
            Similarity flagged — review carefully
          </div>
        )}

        {/* file actions */}
        <div className="flex gap-3 flex-wrap">

          {paper.file_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={paper.file_url} target="_blank">
                <Eye className="h-4 w-4 mr-1" />
                View Paper
              </a>
            </Button>
          )}

          {paper.file_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={paper.file_url} download>
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          )}

          {paper.camera_ready_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={paper.camera_ready_url} target="_blank">
                Camera Ready
              </a>
            </Button>
          )}
        </div>

        {reviewed && (
          <p className="text-xs text-gray-500">
            Reviewed on {new Date(paper.reviewed_at).toLocaleDateString()}
          </p>
        )}
      </Card>

      {/* AUTHORS (optional for blind review) */}
      {authors.length > 0 && (
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText size={16} /> Authors
          </h2>

          {authors.map((a, i) => (
            <div key={i} className="text-sm border rounded p-2">
              {a.name}
              {a.is_primary && (
                <span className="ml-2 text-xs text-blue-600">
                  (Primary)
                </span>
              )}
              <div className="text-xs text-gray-500">{a.affiliation}</div>
            </div>
          ))}
        </Card>
      )}

      {/* REVIEW COMMENTS */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Reviewer Notes</h2>

        <Textarea
          placeholder="Write strengths, weaknesses, and suggestions..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={8}
          disabled={reviewed}
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Include strengths & suggestions</span>
          <span>
            {comments.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        {!reviewed && (
          <div className="flex justify-end gap-3">
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={() => submitReview("rejected")}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>

            <Button
              disabled={submitting}
              onClick={() => submitReview("accepted")}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        )}

        {reviewed && (
          <Badge className="bg-gray-100 text-gray-700">
            Review submitted — editing locked
          </Badge>
        )}
      </Card>
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
        Review Complete
      </Badge>
    );

  return (
    <Badge className="bg-blue-100 text-blue-700">
      Under Review
    </Badge>
  );
}