"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { FileText, Eye, Clock } from "lucide-react";

const supabase = createClient();

export default function ReviewerPapersPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [tab, setTab] = useState<"pending" | "reviewed">("pending");

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

  const pending = papers.filter(p => !p.reviewed_at);
  const reviewed = papers.filter(p => p.reviewed_at);

  const visiblePapers = tab === "pending" ? pending : reviewed;

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
      <div className="flex gap-3">
        <TabButton
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label="Pending"
          count={pending.length}
        />
        <TabButton
          active={tab === "reviewed"}
          onClick={() => setTab("reviewed")}
          label="Reviewed"
          count={reviewed.length}
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
          const needsReview = !p.reviewed_at;
          const title = p.title || `Paper #${p.id.slice(0, 6)}`;

          return (
            <div
              key={p.id}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4 transition ${
                needsReview ? "bg-yellow-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />

                <div>
                  <p className="font-medium">{title}</p>

                  <p className="text-xs text-gray-500">
                    Conference: {p.conferences?.title || "—"}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Submitted {new Date(p.created_at).toLocaleDateString()}
                  </div>

                  {p.reviewed_at && (
                    <p className="text-xs text-gray-500">
                      Reviewed on{" "}
                      {new Date(p.reviewed_at).toLocaleDateString()}
                    </p>
                  )}

                  <div className="mt-1">
                    <StatusBadge status={p.status} reviewed={p.reviewed_at} />
                  </div>
                </div>
              </div>

              <Button size="sm" asChild>
                <Link href={`/dashboard/reviewer/papers/${p.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
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
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
        active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      {label} ({count})
    </button>
  );
}

/* ---------- STATUS BADGE ---------- */

function StatusBadge({
  status,
  reviewed,
}: {
  status: string;
  reviewed: string | null;
}) {
  if (status === "accepted") {
    return (
      <Badge className="bg-green-100 text-green-700">
        Accepted
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge className="bg-red-100 text-red-700">
        Rejected
      </Badge>
    );
  }

  if (!reviewed) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700">
        Pending Review
      </Badge>
    );
  }

  return (
    <Badge className="bg-blue-100 text-blue-700">
      Reviewed
    </Badge>
  );
}