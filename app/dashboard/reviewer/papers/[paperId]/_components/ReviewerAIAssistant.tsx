"use client";

import { Brain, Sparkles, Search } from "lucide-react";
import AIReviewCard from "@/components/dashboard/AIReviewCard";
import PlagiarismRiskCard from "@/components/dashboard/PlagiarismRiskCard";
import AIUsageBanner from "@/components/dashboard/AIUsageBanner";

/* ─── Sub-label wrapper ─── */
function AIFeatureBlock({
  icon,
  label,
  description,
  note,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          {note && (
            <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
              💡 {note}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Props ─── */
interface ReviewerAIAssistantProps {
  paperId: string;
  paper: any;
  isFinalDecision: boolean;
  canReview: boolean;
  onUseDecision?: (decision: "accepted" | "rejected" | "revision_required", summary: string) => void;
}

/* ─── Component ─── */
export default function ReviewerAIAssistant({
  paperId,
  paper,
  isFinalDecision,
  canReview,
  onUseDecision,
}: ReviewerAIAssistantProps) {
  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">AI Assistant</h2>
          <p className="text-xs text-gray-500">AI-powered tools to help you write better reviews</p>
        </div>
      </div>

      {/* AI Usage — compact inline */}
      {paper.conference_id && (
        <AIUsageBanner conferenceId={paper.conference_id} />
      )}

      <div className="border-t border-gray-100" />

      {/* 1. Paper Analysis */}
      <AIFeatureBlock
        icon={<Sparkles className="h-4 w-4 text-purple-600" />}
        label="Paper Analysis"
        description="Get summary, strengths, weaknesses, and decision support"
      >
        <AIReviewCard
          submissionId={paperId}
          readOnly={isFinalDecision}
          onUseDecision={canReview ? onUseDecision : undefined}
        />
      </AIFeatureBlock>

      <div className="border-t border-gray-100" />

      {/* 2. Similarity Check */}
      <AIFeatureBlock
        icon={<Search className="h-4 w-4 text-indigo-600" />}
        label="Similarity Check"
        description="Detect similarity patterns and repeated phrasing"
        note="Recommended before submitting your review"
      >
        <PlagiarismRiskCard submissionId={paperId} />
      </AIFeatureBlock>
    </div>
  );
}
