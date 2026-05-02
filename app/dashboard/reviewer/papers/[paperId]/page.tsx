"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { useAICreditPurchase } from "@/lib/hooks/useAICreditPurchase";

// ─── Section Components ─── //
import ReviewerPaperOverview, { StatusBadge } from "./_components/ReviewerPaperOverview";
import ReviewProgressTracker from "./_components/ReviewProgressTracker";
import ReviewGuidance from "./_components/ReviewGuidance";
import ReviewerAIAssistant from "./_components/ReviewerAIAssistant";
import ReviewerPaperFiles from "./_components/ReviewerPaperFiles";
import ReviewFormSection from "./_components/ReviewFormSection";
import ReviewerAuthorsSection from "./_components/ReviewerAuthorsSection";

const supabase = createClient();

export default function ReviewerReviewPage() {
  const { paperId } = useParams();
  const router = useRouter();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"accepted" | "rejected" | "revision_required" | null>(null);

  // AI credit purchase integration
  useAICreditPurchase({
    conferenceId: paper?.conference_id ?? null,
    userId: profile?.id ?? null,
    userName: profile?.name ?? undefined,
    userEmail: profile?.email ?? undefined,
  });

  /* Load draft */
  useEffect(() => {
    if (paperId) {
      const saved = localStorage.getItem(`review-draft-${paperId}`);
      if (saved) setComments(saved);
    }
  }, [paperId]);

  /* Load paper + review history */
  const loadPaper = useCallback(async () => {
    if (!profile?.id || !paperId) return;

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
        revision_number,
        declaration_original,
        declaration_no_plagiarism,
        declaration_author_approval,
        conferences ( title ),
        conference_id
      `)
      .eq("id", paperId)
      .eq("reviewer_id", profile.id)
      .maybeSingle();

    if (!data) {
      router.push("/dashboard/reviewer/papers");
      return;
    }

    setPaper(data);

    // Load review history from reviews table
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, revision_number, decision, comments, created_at")
      .eq("submission_id", paperId)
      .eq("reviewer_id", profile.id)
      .order("created_at", { ascending: true });

    setReviewHistory(reviews || []);

    // load authors
    const { data: authorRows } = await supabase
      .from("paper_authors")
      .select("name, affiliation, author_order, is_primary")
      .eq("submission_id", paperId)
      .order("author_order", { ascending: true });

    setAuthors(authorRows || []);

    setLoading(false);
  }, [profile?.id, paperId, router]);

  useEffect(() => {
    loadPaper();
  }, [loadPaper]);

  /* autosave draft */
  useEffect(() => {
    if (paperId) {
      localStorage.setItem(`review-draft-${paperId}`, comments);
    }
  }, [comments, paperId]);

  /* ─── Notify Organizer Helper ─── */
  async function notifyOrganizer(decision: string) {
    try {
      await fetch("/api/send-reviewer-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: paper.id,
          reviewerName: profile?.name || "Reviewer",
          decision,
        }),
      });
    } catch (err) {
      console.error("Reviewer decision email failed:", err);
    }
  }

  /* ─── Submit Review (multi-round) ─── */
  async function submitReview(decision: "accepted" | "rejected" | "revision_required") {
    if (!comments.trim()) {
      alert("Please write review comments.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insert review record into reviews table
      const { error: insertError } = await supabase
        .from("reviews")
        .insert({
          submission_id: paper.id,
          reviewer_id: profile!.id,
          revision_number: paper.revision_number || 1,
          decision,
          comments: comments.trim(),
        });

      if (insertError) {
        console.error("Failed to insert review:", insertError);
        alert("Failed to submit review. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2. Update paper_submissions status + reviewed_at
      await supabase
        .from("paper_submissions")
        .update({
          status: decision,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", paper.id)
        .eq("reviewer_id", profile!.id);

      // 3. Notify organizer
      notifyOrganizer(decision);

      // 4. Clear draft
      localStorage.removeItem(`review-draft-${paperId}`);
      router.push("/dashboard/reviewer/papers");
    } catch (err) {
      console.error("Review submission error:", err);
      alert("An error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  /* ─── Confirm & Execute ─── */
  function executeConfirm() {
    if (!confirmAction) return;
    submitReview(confirmAction);
    setConfirmAction(null);
  }

  /* ═════════ RENDER ═════════ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500 text-sm">Loading paper…</span>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-gray-500">Paper not found.</p>
      </div>
    );
  }

  const isFinalDecision = paper.status === "accepted" || paper.status === "rejected";
  const canReview = !isFinalDecision;
  const title = paper.title || `Paper #${paper.id.slice(0, 6)}`;
  const currentRound = reviewHistory.length + 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-28">

      {/* ── Back Button ── */}
      <Button variant="ghost" size="sm" className="mb-2 text-gray-500" onClick={() => router.push("/dashboard/reviewer/papers")}>
        ← Back to Papers
      </Button>

      {/* ── 1. Paper Overview ── */}
      <ReviewerPaperOverview paper={paper} />

      {/* ── 2. Progress Tracker ── */}
      <ReviewProgressTracker paper={paper} reviewCount={reviewHistory.length} />

      {/* ── 3. Review Guidance ── */}
      <ReviewGuidance
        paper={paper}
        reviewCount={reviewHistory.length}
        hasComments={!!comments.trim()}
      />

      {/* ── 4. AI Assistant ── */}
      <div className="bg-gradient-to-br from-purple-50/30 via-indigo-50/20 to-transparent border border-purple-100/60 rounded-xl p-5">
        <ReviewerAIAssistant
          paperId={paperId as string}
          paper={paper}
          isFinalDecision={isFinalDecision}
          canReview={canReview && (paper.status === "submitted" || paper.status === "under_review" || paper.status === "resubmitted")}
          onUseDecision={(decision, summary) => {
            setComments(summary);
            setConfirmAction(decision);
          }}
        />
      </div>

      {/* ── 5. Paper Files ── */}
      <ReviewerPaperFiles paper={paper} />

      {/* ── 6. Review Form ── */}
      <ReviewFormSection
        paper={paper}
        comments={comments}
        onCommentsChange={setComments}
        reviewHistory={reviewHistory}
        canReview={canReview}
        isFinalDecision={isFinalDecision}
        currentRound={currentRound}
      />

      {/* ── 7. Authors ── */}
      <ReviewerAuthorsSection authors={authors} paper={paper} />

      {/* ── Confirmation Modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">
              Confirm {confirmAction === "accepted" ? "Accept" : confirmAction === "rejected" ? "Reject" : "Request Revision"}
            </h2>

            <div className="text-sm space-y-2">
              <p><strong>Paper:</strong> {title}</p>
              <p><strong>Round:</strong> {currentRound}</p>
              <p><strong>Action:</strong>{" "}
                <StatusBadge status={confirmAction} />
              </p>
            </div>

            {paper.plagiarism_status === "flagged" && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Similarity is flagged for this paper.
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              This decision will be sent to the conference organizer.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                disabled={submitting}
                variant={confirmAction === "rejected" ? "destructive" : "default"}
                onClick={executeConfirm}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Sticky Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t shadow-lg z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500 hidden sm:block">
            <span className="font-medium text-gray-700">{title}</span>
            <span className="mx-2">·</span>
            <StatusBadge status={paper.status} />
            {paper.revision_number > 1 && (
              <>
                <span className="mx-2">·</span>
                <Badge className="bg-purple-100 text-purple-700 text-xs">v{paper.revision_number}</Badge>
              </>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            {canReview && (paper.status === "submitted" || paper.status === "under_review" || paper.status === "resubmitted") ? (
              <>
                <Button variant="destructive" size="sm" disabled={submitting} onClick={() => setConfirmAction("rejected")}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button variant="outline" size="sm" disabled={submitting || !comments.trim()}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => setConfirmAction("revision_required")}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Revision
                </Button>
                <Button size="sm" disabled={submitting} onClick={() => setConfirmAction("accepted")}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Accept
                </Button>
              </>
            ) : isFinalDecision ? (
              <Badge className={paper.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {paper.status === "accepted" ? "Accepted" : "Rejected"} — Locked
              </Badge>
            ) : paper.status === "revision_required" ? (
              <Badge className="bg-orange-100 text-orange-700">
                <RotateCcw className="h-3 w-3 mr-1" />
                Awaiting Author Revision
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700">
                <Clock className="h-3 w-3 mr-1" />
                Waiting
              </Badge>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}