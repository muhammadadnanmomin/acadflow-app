"use client";

import { CheckCircle2, Clock } from "lucide-react";

/* ─── StepPill ─── */
function StepPill({
  label,
  done,
  active,
  variant,
}: {
  label: string;
  done: boolean;
  active?: boolean;
  variant?: "green" | "red" | "orange" | "purple";
}) {
  const base = done
    ? variant === "red" ? "bg-red-100 text-red-700 border-red-200"
      : variant === "green" ? "bg-green-100 text-green-700 border-green-200"
        : variant === "orange" ? "bg-orange-100 text-orange-700 border-orange-200"
          : variant === "purple" ? "bg-purple-100 text-purple-700 border-purple-200"
            : "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${base} ${active ? "ring-2 ring-blue-300 ring-offset-1" : ""}`}>
      {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
}

/* ─── Connector ─── */
function StepConnector({ done }: { done: boolean }) {
  return (
    <div className={`hidden sm:block w-6 h-0.5 ${done ? "bg-blue-300" : "bg-gray-200"} rounded-full`} />
  );
}

/* ─── Props ─── */
interface ReviewProgressTrackerProps {
  paper: any;
  reviewCount: number;
}

/* ─── Component ─── */
export default function ReviewProgressTracker({ paper, reviewCount }: ReviewProgressTrackerProps) {
  const isFinalDecision = paper.status === "accepted" || paper.status === "rejected";
  const hasReviews = reviewCount > 0;
  const isReviewing = !isFinalDecision && !hasReviews && paper.status !== "revision_required";

  return (
    <div className="flex items-center flex-wrap gap-2 px-1 py-3">
      <StepPill label="Submitted" done={!!paper.created_at} />
      <StepConnector done={!!paper.reviewer_id} />
      <StepPill label="Assigned to You" done={!!paper.reviewer_id} />
      <StepConnector done={hasReviews || isReviewing} />
      <StepPill
        label={hasReviews ? `Reviewed (${reviewCount})` : "Reviewing"}
        done={hasReviews}
        active={isReviewing}
      />
      {paper.revision_number > 1 && (
        <>
          <StepConnector done={true} />
          <StepPill
            label={`Revision v${paper.revision_number}`}
            done={true}
            variant="orange"
          />
        </>
      )}
      <StepConnector done={isFinalDecision} />
      <StepPill
        label={paper.status === "rejected" ? "Rejected" : paper.status === "accepted" ? "Accepted" : "Decision"}
        done={isFinalDecision}
        variant={paper.status === "rejected" ? "red" : paper.status === "accepted" ? "green" : undefined}
      />
    </div>
  );
}
