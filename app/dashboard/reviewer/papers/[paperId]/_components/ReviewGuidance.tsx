"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PenLine,
} from "lucide-react";

/* ─── Props ─── */
interface ReviewGuidanceProps {
  paper: any;
  reviewCount: number;
  hasComments: boolean;
}

/* ─── Component ─── */
export default function ReviewGuidance({ paper, reviewCount, hasComments }: ReviewGuidanceProps) {
  const isFinalDecision = paper.status === "accepted" || paper.status === "rejected";
  const canReview = !isFinalDecision &&
    (paper.status === "submitted" || paper.status === "under_review" || paper.status === "resubmitted");
  const isFlagged = paper.plagiarism_status === "flagged";

  let icon: React.ReactNode;
  let text: string;
  let helperText: string | null = null;
  let bgClass: string;
  let textClass: string;
  let borderClass: string;

  if (isFinalDecision) {
    icon = paper.status === "accepted"
      ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      : <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
    text = paper.status === "accepted"
      ? "This paper has been accepted — no further reviews needed."
      : "This paper has been rejected — no further reviews needed.";
    bgClass = paper.status === "accepted" ? "bg-green-50" : "bg-red-50";
    textClass = paper.status === "accepted" ? "text-green-800" : "text-red-800";
    borderClass = paper.status === "accepted" ? "border-green-200" : "border-red-200";
  } else if (paper.status === "revision_required") {
    icon = <RotateCcw className="h-4 w-4 text-orange-600 flex-shrink-0" />;
    text = "Waiting for the author to submit a revised version.";
    bgClass = "bg-orange-50";
    textClass = "text-orange-800";
    borderClass = "border-orange-200";
  } else if (paper.status === "resubmitted") {
    icon = <PenLine className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    text = `Revised paper (v${paper.revision_number}) received — please review and submit your decision.`;
    helperText = "Focus on strengths, weaknesses, and constructive suggestions";
    bgClass = "bg-blue-50";
    textClass = "text-blue-800";
    borderClass = "border-blue-200";
  } else if (canReview && hasComments) {
    icon = <PenLine className="h-4 w-4 text-amber-600 flex-shrink-0" />;
    text = "Complete your review and submit your decision.";
    helperText = "Focus on strengths, weaknesses, and constructive suggestions";
    bgClass = "bg-amber-50";
    textClass = "text-amber-800";
    borderClass = "border-amber-200";
  } else if (canReview) {
    icon = <ArrowRight className="h-4 w-4 text-indigo-600 flex-shrink-0" />;
    text = "Read the paper and submit your review.";
    helperText = "Focus on strengths, weaknesses, and constructive suggestions";
    bgClass = "bg-indigo-50";
    textClass = "text-indigo-800";
    borderClass = "border-indigo-200";
  } else {
    icon = <ArrowRight className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    text = "No review action available at this time.";
    bgClass = "bg-gray-50";
    textClass = "text-gray-700";
    borderClass = "border-gray-200";
  }

  return (
    <div className="space-y-2">
      <div className={`${bgClass} border ${borderClass} rounded-lg px-4 py-3`}>
        <div className="flex items-center gap-3">
          {icon}
          <div className="flex-1">
            <p className={`text-sm font-medium ${textClass}`}>
              {!isFinalDecision && paper.status !== "revision_required" && (
                <span className="font-semibold">Next Step: </span>
              )}
              {text}
            </p>
            {helperText && (
              <p className="text-xs text-gray-500 mt-1">{helperText}</p>
            )}
          </div>
        </div>
      </div>

      {isFlagged && !isFinalDecision && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800 font-medium">
            Similarity flagged — review carefully before submitting your decision.
          </span>
        </div>
      )}
    </div>
  );
}
