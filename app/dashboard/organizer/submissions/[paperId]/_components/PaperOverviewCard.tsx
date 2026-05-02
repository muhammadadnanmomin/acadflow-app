"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";

/* ─── Sub-components ─── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Submitted", cls: "bg-gray-100 text-gray-700" },
    under_review: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
    resubmitted: { label: "Resubmitted", cls: "bg-purple-100 text-purple-700" },
    revision_required: { label: "Revision Required", cls: "bg-orange-100 text-orange-700" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    final_submitted: { label: "Final Submitted", cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] || { label: status || "Not Analyzed", cls: "bg-yellow-100 text-yellow-700" };
  return <Badge className={s.cls}>{s.label}</Badge>;
}

function SimilarityBadge({ status }: { status?: string }) {
  if (status === "passed") return <Badge className="bg-green-100 text-green-700">Passed</Badge>;
  if (status === "flagged") return <Badge className="bg-red-100 text-red-700">Flagged</Badge>;
  if (status === "checking") return <Badge className="bg-blue-100 text-blue-700">Checking</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Not Analyzed</Badge>;
}

/* ─── Props ─── */
interface PaperOverviewCardProps {
  paper: any;
}

/* ─── Component ─── */
export default function PaperOverviewCard({ paper }: PaperOverviewCardProps) {
  const title = paper.title || `Paper #${paper.id.slice(0, 8)}`;

  return (
    <Card className="p-5">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
            {paper.revision_number > 1 && (
              <Badge className="bg-purple-100 text-purple-700 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Revision v{paper.revision_number}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {paper.conferences?.title}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Paper ID</p>
          <p className="text-sm font-medium text-gray-700 mt-0.5 font-mono">{paper.id?.slice(0, 8)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
          <p className="text-sm font-medium text-gray-700 mt-0.5">{new Date(paper.created_at).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
          <div className="mt-0.5"><StatusBadge status={paper.status} /></div>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Similarity</p>
          <div className="mt-0.5"><SimilarityBadge status={paper.plagiarism_status} /></div>
        </div>
      </div>

      {/* Date row */}
      <div className="flex gap-4 flex-wrap text-xs text-gray-400 mt-3">
        {paper.reviewed_at && <span>Last reviewed: {new Date(paper.reviewed_at).toLocaleDateString()}</span>}
        {paper.decision_at && <span>Decision: {new Date(paper.decision_at).toLocaleDateString()}</span>}
        {paper.revision_number > 1 && <span>Current revision: v{paper.revision_number}</span>}
      </div>
    </Card>
  );
}

export { StatusBadge, SimilarityBadge };
