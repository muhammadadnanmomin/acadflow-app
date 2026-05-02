"use client";

import { Brain, Users, Search, Sparkles } from "lucide-react";
import AIReviewCard from "@/components/dashboard/AIReviewCard";
import PlagiarismRiskCard from "@/components/dashboard/PlagiarismRiskCard";
import AIUsageBanner from "@/components/dashboard/AIUsageBanner";
import SmartAssignCard from "@/components/dashboard/SmartAssignCard";

/* ─── Sub-label wrapper for each AI feature ─── */
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
      {/* Sub-label */}
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
      {/* AI Card content */}
      {children}
    </div>
  );
}

/* ─── Props ─── */
interface AIAssistantSectionProps {
  paperId: string;
  paper: any;
  onSmartAssign: (reviewerId: string) => Promise<void>;
  onSmartAssignAll: (reviewerIds: string[]) => Promise<void>;
}

/* ─── Component ─── */
export default function AIAssistantSection({
  paperId,
  paper,
  onSmartAssign,
  onSmartAssignAll,
}: AIAssistantSectionProps) {
  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">AI Assistant</h2>
          <p className="text-xs text-gray-500">Intelligent tools to assist your review process</p>
        </div>
      </div>

      {/* AI Usage — compact inline */}
      {paper.conference_id && (
        <AIUsageBanner conferenceId={paper.conference_id} />
      )}

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 1. Reviewer Suggestions */}
      <AIFeatureBlock
        icon={<Users className="h-4 w-4 text-indigo-600" />}
        label="Reviewer Suggestions"
        description="Automatically match papers with the most relevant reviewers"
      >
        <SmartAssignCard
          submissionId={paperId}
          currentReviewerId={paper.reviewer_id}
          onAssign={onSmartAssign}
          onAssignAll={onSmartAssignAll}
        />
      </AIFeatureBlock>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 2. Paper Analysis */}
      <AIFeatureBlock
        icon={<Sparkles className="h-4 w-4 text-purple-600" />}
        label="Paper Analysis"
        description="Get summary, strengths, weaknesses, and a suggested decision"
      >
        <AIReviewCard submissionId={paperId} />
      </AIFeatureBlock>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 3. Similarity Check */}
      <AIFeatureBlock
        icon={<Search className="h-4 w-4 text-indigo-600" />}
        label="Similarity Check"
        description="Detect similarity patterns and repeated phrasing"
        note="Recommended before final decision"
      >
        <PlagiarismRiskCard submissionId={paperId} />
      </AIFeatureBlock>
    </div>
  );
}
