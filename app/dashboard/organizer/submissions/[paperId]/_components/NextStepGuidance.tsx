"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

/* ─── Props ─── */
interface NextStepGuidanceProps {
  paper: any;
  reviewCount: number;
}

/* ─── Component ─── */
export default function NextStepGuidance({ paper, reviewCount }: NextStepGuidanceProps) {
  const isFinalDecision = paper.status === "accepted" || paper.status === "rejected";
  const hasReviewer = !!paper.reviewer_id;
  const hasReviews = reviewCount > 0;
  const isFlagged = paper.plagiarism_status === "flagged";

  // Determine state
  let icon: React.ReactNode;
  let text: string;
  let bgClass: string;
  let textClass: string;
  let borderClass: string;

  if (isFinalDecision) {
    // Success — finalized
    icon = paper.status === "accepted"
      ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      : <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
    text = paper.status === "accepted"
      ? "This paper has been accepted — further reviewing is locked."
      : "This paper has been rejected — further reviewing is locked.";
    bgClass = paper.status === "accepted" ? "bg-green-50" : "bg-red-50";
    textClass = paper.status === "accepted" ? "text-green-800" : "text-red-800";
    borderClass = paper.status === "accepted" ? "border-green-200" : "border-red-200";
  } else if (paper.status === "resubmitted") {
    // Info — resubmitted, needs re-review
    icon = <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    text = `Revised paper (v${paper.revision_number}) received — re-review or make a decision.`;
    bgClass = "bg-blue-50";
    textClass = "text-blue-800";
    borderClass = "border-blue-200";
  } else if (hasReviews && !isFinalDecision) {
    // Warning — reviews ready, needs decision
    icon = <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />;
    text = `${reviewCount} review${reviewCount > 1 ? "s" : ""} submitted — make a final decision or request revisions.`;
    bgClass = "bg-amber-50";
    textClass = "text-amber-800";
    borderClass = "border-amber-200";
  } else if (hasReviewer && !hasReviews) {
    // Info — waiting
    icon = <ArrowRight className="h-4 w-4 text-blue-600 flex-shrink-0" />;
    text = "Waiting for reviewer feedback, or run AI analysis while you wait.";
    bgClass = "bg-blue-50";
    textClass = "text-blue-800";
    borderClass = "border-blue-200";
  } else {
    // Default — no reviewer
    icon = <ArrowRight className="h-4 w-4 text-indigo-600 flex-shrink-0" />;
    text = "Assign a reviewer or analyze this paper using AI.";
    bgClass = "bg-indigo-50";
    textClass = "text-indigo-800";
    borderClass = "border-indigo-200";
  }

  return (
    <div className="space-y-2">
      {/* Main guidance */}
      <div className={`${bgClass} border ${borderClass} rounded-lg px-4 py-3 flex items-center gap-3`}>
        {icon}
        <div className="flex-1">
          <p className={`text-sm font-medium ${textClass}`}>
            {!isFinalDecision && <span className="font-semibold">Next Step: </span>}
            {text}
          </p>
        </div>
      </div>

      {/* Similarity flag warning — separate visual */}
      {isFlagged && !isFinalDecision && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800 font-medium">
            Similarity flagged — review carefully before making a decision.
          </span>
        </div>
      )}
    </div>
  );
}
