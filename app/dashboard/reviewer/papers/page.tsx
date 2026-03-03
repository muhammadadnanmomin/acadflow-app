"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { FileText, Eye, Clock, RotateCcw, AlertTriangle } from "lucide-react";

const supabase = createClient();

export default function ReviewerPapersPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [tab, setTab] = useState<"action" | "waiting" | "completed">("action");

  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        title,
        status,
        created_at,
        reviewed_at,
        revision_number,
        conferences ( title )
      `)
      .eq("reviewer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Paper load error:", error);
      setPapers([]);
      setLoading(false);
      return;
    }

    setPapers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  // Multi-round filtering
  const actionRequired = papers.filter(p =>
    ["submitted", "under_review", "resubmitted"].includes(p.status)
  );
  const waiting = papers.filter(p => p.status === "revision_required");
  const completed = papers.filter(p =>
    ["accepted", "rejected"].includes(p.status)
  );

  const visiblePapers =
    tab === "action" ? actionRequired :
      tab === "waiting" ? waiting :
        completed;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Assigned Papers</h1>
        <p className="text-gray-500 mt-1">
          Manage your review workload
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap">
        <TabButton
          active={tab === "action"}
          onClick={() => setTab("action")}
          label="Action Required"
          count={actionRequired.length}
        />
        <TabButton
          active={tab === "waiting"}
          onClick={() => setTab("waiting")}
          label="Awaiting Revision"
          count={waiting.length}
        />
        <TabButton
          active={tab === "completed"}
          onClick={() => setTab("completed")}
          label="Completed"
          count={completed.length}
        />
      </div>

      <Card className="p-4 sm:p-6 space-y-4">

        {loading && (
          <p className="text-sm text-gray-500">Loading papers…</p>
        )}

        {!loading && visiblePapers.length === 0 && (
          <p className="text-sm text-gray-500">
            No papers in this category.
          </p>
        )}

        {!loading && visiblePapers.map((p) => {
          const title = p.title || `Paper #${p.id.slice(0, 6)}`;
          const isResubmitted = p.status === "resubmitted";

          return (
            <div
              key={p.id}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4 transition ${isResubmitted ? "bg-purple-50 border-purple-200"
                  : tab === "action" ? "bg-yellow-50"
                    : "hover:bg-gray-50"
                }`}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{title}</p>
                    {p.revision_number > 1 && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        <RotateCcw className="h-3 w-3 mr-0.5" />
                        v{p.revision_number}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Conference: {p.conferences?.title || "—"}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Submitted {new Date(p.created_at).toLocaleDateString()}
                  </div>

                  {p.reviewed_at && (
                    <p className="text-xs text-gray-500">
                      Last reviewed{" "}
                      {new Date(p.reviewed_at).toLocaleDateString()}
                    </p>
                  )}

                  <div className="mt-1">
                    <StatusBadge status={p.status} />
                  </div>

                  {isResubmitted && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-purple-700">
                      <AlertTriangle className="h-3 w-3" />
                      Revised paper ready for re-review
                    </div>
                  )}
                </div>
              </div>

              <Button size="sm" asChild>
                <Link href={`/dashboard/reviewer/papers/${p.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  {tab === "action" ? "Review" : "View"}
                </Link>
              </Button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ---------- TAB BUTTON ---------- */

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50"
        }`}
    >
      {label} ({count})
    </button>
  );
}

/* ---------- STATUS BADGE ---------- */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Pending Review", cls: "bg-yellow-100 text-yellow-700" },
    under_review: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
    resubmitted: { label: "Resubmitted — Re-review", cls: "bg-purple-100 text-purple-700" },
    revision_required: { label: "Revision Requested", cls: "bg-orange-100 text-orange-700" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] || { label: status || "Pending", cls: "bg-gray-100 text-gray-700" };
  return <Badge className={s.cls}>{s.label}</Badge>;
}