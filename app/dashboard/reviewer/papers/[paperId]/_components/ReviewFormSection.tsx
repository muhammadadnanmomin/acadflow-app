"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { History, MessageSquare, CheckCircle2, PenLine } from "lucide-react";

/* ─── Decision Badge ─── */
function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    revision_required: { label: "Revision Required", cls: "bg-orange-100 text-orange-700" },
  };
  const d = map[decision] || { label: decision, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={d.cls}>{d.label}</Badge>;
}

/* ─── Props ─── */
interface ReviewFormSectionProps {
  paper: any;
  comments: string;
  onCommentsChange: (value: string) => void;
  reviewHistory: any[];
  canReview: boolean;
  isFinalDecision: boolean;
  currentRound: number;
}

/* ─── Component ─── */
export default function ReviewFormSection({
  paper,
  comments,
  onCommentsChange,
  reviewHistory,
  canReview,
  isFinalDecision,
  currentRound,
}: ReviewFormSectionProps) {
  const isReviewable = canReview &&
    (paper.status === "submitted" || paper.status === "under_review" || paper.status === "resubmitted");

  return (
    <div className="space-y-4">
      {/* Section header */}
      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
        <PenLine className="h-4.5 w-4.5 text-blue-600" />
        ✍️ Your Review
      </h2>

      {/* Review form */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">
          {isReviewable ? `Review Comments — Round ${currentRound}` : "Review Comments"}
        </h3>

        {isReviewable ? (
          <>
            <Textarea
              placeholder="Write strengths, weaknesses, and suggestions..."
              value={comments}
              onChange={(e) => onCommentsChange(e.target.value)}
              rows={8}
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>Provide constructive feedback. Comments are required when requesting revisions.</span>
              <span className="tabular-nums">
                {comments.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-500 italic">
              {paper.status === "revision_required"
                ? "Waiting for the author to submit a revised version before you can review again."
                : isFinalDecision
                  ? "This paper has received a final decision. No further reviews can be submitted."
                  : "No review action available at this time."}
            </p>
          </div>
        )}
      </Card>

      {/* Review History */}
      {reviewHistory.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <History className="h-4 w-4" /> Previous Reviews
            </h3>
            <span className="text-xs text-gray-400">
              {reviewHistory.length} round{reviewHistory.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {reviewHistory.map((review, index) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      Round {index + 1}
                    </Badge>
                    {review.revision_number > 1 && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        v{review.revision_number}
                      </Badge>
                    )}
                    <DecisionBadge decision={review.decision} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comments && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legacy review comment */}
      {paper.review_comment && reviewHistory.length === 0 && isFinalDecision && (
        <Card className="p-5 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Previous Review
          </h3>
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{paper.review_comment}</p>
          </div>
          <div className="flex items-center justify-between">
            <Badge className="bg-gray-100 text-gray-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Review submitted — editing locked
            </Badge>
            {paper.reviewed_at && (
              <span className="text-xs text-gray-400">
                Reviewed on {new Date(paper.reviewed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
