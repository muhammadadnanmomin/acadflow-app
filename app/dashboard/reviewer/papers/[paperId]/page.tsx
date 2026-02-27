"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";

/* ---------- PAGE ---------- */

export default function ReviewerReviewPage() {
  const { paperId } = useParams();
  const router = useRouter();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient()

  /* Load saved draft comments */
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

      if (!profile) return;
      const { data, error } = await supabase
        .from("paper_submissions")
        .select(`
          id,
          file_url,
          status,
          reviewer_id,
          reviewed_at,
          created_at
        `)
        .eq("id", paperId)
        .eq("reviewer_id", profile.id)
        .maybeSingle();

      if (error || !data) {
        setError("You are not allowed to review this paper.");
        setLoading(false);
        return;
      }

      if (data.reviewed_at) {
        setError("You have already submitted a review for this paper.");
        setLoading(false);
        return;
      }

      setPaper(data);
      setLoading(false);
    }

    loadPaper();
  }, [profile, paperId]);

  /* Auto-save draft */
  useEffect(() => {
    if (paperId) {
      localStorage.setItem(`review-draft-${paperId}`, comments);
    }
  }, [comments, paperId]);

  /* Submit review */
  async function submitReview(decision: "accepted" | "rejected") {
    if (!comments.trim()) {
      setError("Please write review comments before submitting.");
      return;
    }

    const confirmDecision = confirm(
      `Are you sure you want to ${decision.toUpperCase()} this paper?\nThis action cannot be changed.`
    );

    if (!confirmDecision) return;

    setSubmitting(true);
    setError(null);

    const { error } = await supabase
      .from("paper_submissions")
      .update({
        status: decision,
        review_comments: comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paper.id)
      .eq("reviewer_id", profile!.id);

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    localStorage.removeItem(`review-draft-${paperId}`);
    router.push("/dashboard/reviewer/papers");
  }

  /* ---------- STATES ---------- */

  if (loading) {
    return <p className="p-10 text-sm text-gray-500">Loading paper…</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8">
        <Card className="p-6 text-center space-y-3">
          <h1 className="text-xl font-semibold">Review Error</h1>
          <p className="text-sm text-gray-500">{error}</p>

          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/reviewer/papers")}
          >
            Back to Papers
          </Button>
        </Card>
      </div>
    );
  }

  const wordCount = comments.trim().split(/\s+/).filter(Boolean).length;

  /* ---------- UI ---------- */

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Review Paper</h1>
        <p className="text-gray-500 text-sm mt-1">
          Please review the paper carefully and submit your decision.
        </p>
      </div>

      {/* Paper Info */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Paper #{paper.id.slice(0, 8)}
          </span>
          <Badge className="bg-blue-100 text-blue-700">
            Under Review
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          Submitted on {new Date(paper.created_at).toLocaleDateString()}
        </div>

        {paper.file_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={paper.file_url} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4 mr-1" />
              View Paper PDF
            </a>
          </Button>
        )}
      </Card>

      {/* Review Box */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Review Comments</h2>

        <Textarea
          placeholder="Write your detailed review comments here..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={8}
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Tip: include strengths, weaknesses & suggestions</span>
          <span>{wordCount} words</span>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

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
      </Card>

    </div>
  );
}