"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Copy,
  CheckCircle2,
  MessageSquare,
  History,
  Users,
} from "lucide-react";

/* ─── Review Decision Badge ─── */
function ReviewDecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    revision_required: { label: "Revision Required", cls: "bg-orange-100 text-orange-700" },
  };
  const d = map[decision] || { label: decision, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={d.cls}>{d.label}</Badge>;
}

/* ─── Props ─── */
interface ReviewerSectionProps {
  reviewer: any;
  reviewHistory: any[];
  paper: any;
  onCopyEmail: (email: string) => void;
  copiedEmail: string | null;
}

/* ─── Component ─── */
export default function ReviewerSection({
  reviewer,
  reviewHistory,
  paper,
  onCopyEmail,
  copiedEmail,
}: ReviewerSectionProps) {
  const latestReview = reviewHistory.length > 0 ? reviewHistory[reviewHistory.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Users className="h-4.5 w-4.5 text-blue-600" />
        <h2 className="text-base font-bold text-gray-900">Assigned Reviewer</h2>
      </div>

      {/* Reviewer info card */}
      <Card className="p-5">
        {reviewer ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {reviewer.name?.charAt(0)?.toUpperCase() || "R"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{reviewer.name}</p>
              {reviewer.email && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-gray-500">{reviewer.email}</p>
                  <button
                    onClick={() => onCopyEmail(reviewer.email)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy email"
                  >
                    {copiedEmail === reviewer.email
                      ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                      : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>
            <Badge className="bg-blue-100 text-blue-700">Assigned</Badge>
          </div>
        ) : (
          <div className="text-center py-4">
            <Eye className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviewer assigned yet</p>
            <p className="text-xs text-gray-400 mt-1">Use AI Reviewer Suggestions to find the best match</p>
          </div>
        )}
      </Card>

      {/* Review History */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <History className="h-4 w-4" /> Review History
          </h3>
          {reviewHistory.length > 0 && (
            <span className="text-xs text-gray-400">
              {reviewHistory.length} round{reviewHistory.length > 1 ? "s" : ""}
              {latestReview && (
                <> · Latest: <ReviewDecisionBadge decision={latestReview.decision} /></>
              )}
            </span>
          )}
        </div>

        {reviewHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-4 text-center">
            <MessageSquare className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviews submitted yet</p>
            <p className="text-xs text-gray-400 mt-1">
              {paper.reviewer_id
                ? "The assigned reviewer has not submitted any reviews."
                : "No reviewer has been assigned to this paper."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewHistory.map((review, index) => (
              <div key={review.id} className="border rounded-lg overflow-hidden">
                {/* Round header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold">
                      Round {index + 1}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      v{review.revision_number}
                    </Badge>
                    <ReviewDecisionBadge decision={review.decision} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {/* Comments */}
                {review.comments && (
                  <div className="px-4 py-3 border-t">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{review.comments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy reviewer comment fallback */}
        {paper.review_comment && reviewHistory.length === 0 && (
          <div className="border-t pt-4 mt-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Legacy Reviewer Comment</p>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{paper.review_comment}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
