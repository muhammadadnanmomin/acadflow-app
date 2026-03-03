"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  FileText,
  Eye,
  Clock,
  RotateCcw,
  AlertTriangle,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";

const supabase = createClient();

export default function ReviewerPapersPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [tab, setTab] = useState<"action" | "waiting" | "completed">("action");

  // ── Filter States ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [revisionFilter, setRevisionFilter] = useState("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

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

  // Multi-round tab filtering
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

  // Unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const set = new Set<string>();
    papers.forEach(p => {
      const t = p.conferences?.title;
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [papers]);

  // ── Filtered + sorted results ──
  const filteredPapers = useMemo(() => {
    let result = [...visiblePapers];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.conferences?.title || "").toLowerCase().includes(q)
      );
    }

    // 2. Status
    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }

    // 3. Conference
    if (conferenceFilter !== "all") {
      result = result.filter(p => p.conferences?.title === conferenceFilter);
    }

    // 4. Revision
    if (revisionFilter !== "all") {
      if (revisionFilter === "original") {
        result = result.filter(p => !p.revision_number || p.revision_number === 1);
      } else {
        result = result.filter(p => p.revision_number > 1);
      }
    }

    // 5. Sort
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

    return result;
  }, [visiblePapers, searchQuery, statusFilter, conferenceFilter, revisionFilter, dateSort]);

  // Active filter count
  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    statusFilter !== "all" ? 1 : 0,
    conferenceFilter !== "all" ? 1 : 0,
    revisionFilter !== "all" ? 1 : 0,
    dateSort !== "newest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setConferenceFilter("all");
    setRevisionFilter("all");
    setDateSort("newest");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assigned Papers</h1>
          <p className="text-gray-500 mt-1">
            Manage your review workload
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
          </Badge>
        )}
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

      {/* ── Filter Panel ── */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title or conference…"
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Status</label>
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "submitted", label: "Pending Review" },
                { value: "under_review", label: "Under Review" },
                { value: "resubmitted", label: "Resubmitted" },
                { value: "revision_required", label: "Revision Requested" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Conference</label>
            <FilterSelect
              value={conferenceFilter}
              onChange={setConferenceFilter}
              options={[
                { value: "all", label: "All Conferences" },
                ...uniqueConferences.map(c => ({ value: c, label: c })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Revision</label>
            <FilterSelect
              value={revisionFilter}
              onChange={setRevisionFilter}
              options={[
                { value: "all", label: "All" },
                { value: "original", label: "First Submission" },
                { value: "revised", label: "Revisions Only" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sort By</label>
            <FilterSelect
              value={dateSort}
              onChange={(v) => setDateSort(v as "newest" | "oldest")}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
              ]}
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-gray-400">
            Showing {filteredPapers.length} of {visiblePapers.length} paper{visiblePapers.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`}
          </p>
        )}
      </Card>

      {/* ── Papers List ── */}
      <Card className="p-4 sm:p-6 space-y-4">

        {loading && (
          <p className="text-sm text-gray-500">Loading papers…</p>
        )}

        {!loading && filteredPapers.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {activeFilterCount > 0
                ? "No papers match current filters."
                : "No papers in this category."}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {!loading && filteredPapers.map((p) => {
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
                    <p className="font-medium">
                      <HighlightMatch text={title} query={searchQuery} />
                    </p>
                    {p.revision_number > 1 && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        <RotateCcw className="h-3 w-3 mr-0.5" />
                        v{p.revision_number}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Conference: <HighlightMatch text={p.conferences?.title || "—"} query={searchQuery} />
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

/* ═══════════════════════════ SUB-COMPONENTS ═══════════════════════════ */

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

/* ---------- FILTER SELECT ---------- */

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== "all" && value !== "newest";
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border rounded-md px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${isActive ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200"
        }`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ---------- HIGHLIGHT MATCH ---------- */

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{match}</mark>
      {after}
    </>
  );
}