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
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerSubmissionsSummary() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [reviewersByConference, setReviewersByConference] =
    useState<Record<string, any[]>>({});
  const [tab, setTab] = useState<"pending" | "reviewed">("pending");

  // ── Filter States ──
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [plagiarismFilter, setPlagiarismFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [revisionFilter, setRevisionFilter] = useState("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  /* ---------- LOAD REVIEWERS ---------- */

  async function loadReviewers(conferenceIds: string[]) {
    if (!conferenceIds.length) return {};

    /* 1️⃣ get reviewers from registrations */
    const { data: registrations, error: regError } = await supabase
      .from("conference_registrations")
      .select("user_id, conference_id")
      .in("conference_id", conferenceIds)
      .eq("role", "reviewer");

    if (regError || !registrations) return {};

    const userIds = registrations.map(r => r.user_id);

    if (userIds.length === 0) return {};

    /* 2️⃣ fetch profile info */
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    if (profError) {
      console.error("Profile fetch error:", profError);
      return {};
    }

    /* 3️⃣ map profiles by id */
    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => {
      profileMap[p.id] = p;
    });

    /* 4️⃣ group reviewers by conference */
    const map: Record<string, any[]> = {};

    registrations.forEach(r => {
      if (!map[r.conference_id]) map[r.conference_id] = [];

      const profile = profileMap[r.user_id];

      map[r.conference_id].push({
        id: r.user_id,
        name: profile?.name || profile?.email || "Reviewer",
        email: profile?.email,
      });
    });

    return map;
  }

  /* ---------- LOAD PAPERS ---------- */

  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    try {
      const { data: conferences } = await supabase
        .from("conferences")
        .select("id")
        .eq("organizer_id", profile.id);

      const ids = conferences?.map(c => c.id) || [];

      const reviewerMap = await loadReviewers(ids);
      setReviewersByConference(reviewerMap);

      const { data, error } = await supabase
        .from("paper_submissions")
        .select(`
          id,
          conference_id,
          title,
          author_names,
          email,
          presentation_type,
          publication_type,
          revision_number,
          status,
          reviewer_id,
          review_comment,
          reviewed_at,
          decision_at,
          plagiarism_status,
          declaration_original,
          declaration_no_plagiarism,
          declaration_author_approval,
          presentation_fee_paid,
          payment_status,
          decision_email_sent,
          created_at,
          conferences ( title )
        `)
        .in("conference_id", ids)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPapers(data || []);
    } catch (err) {
      console.error("Error loading papers:", err);
      setPapers([]);
    }

    setLoading(false);
  }

  /* ---------- ASSIGN REVIEWER ---------- */

  async function assignReviewer(submissionId: string, reviewerId: string) {
    const paper = papers.find(p => p.id === submissionId);
    if (!paper) return;

    // prevent duplicate assignment
    if (String(paper.reviewer_id) === String(reviewerId)) return;

    // update reviewer
    await supabase
      .from("paper_submissions")
      .update({ reviewer_id: reviewerId || null })
      .eq("id", submissionId);

    // send email only if reviewer selected
    if (reviewerId) {
      const reviewers =
        reviewersByConference[paper.conference_id] || [];

      const reviewer = reviewers.find(
        r => String(r.id) === String(reviewerId)
      );

      console.log("Reviewer selected:", reviewer);

      try {
        await fetch("/api/send-reviewer-assigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewerId: reviewer.id,
            conference: paper.conferences?.title,
            paperTitle: paper.title || `Paper #${paper.id.slice(0, 6)}`,
          }),
        });
      } catch (err) {
        console.error("Reviewer email failed:", err);
      }
    }

    loadPapers();
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) loadPapers();
    return () => {
      mounted = false;
    };
  }, [profile]);

  /* ---------- ALL UNIQUE REVIEWERS (for filter dropdown) ---------- */

  const allReviewers = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(reviewersByConference).forEach(reviewerList => {
      reviewerList.forEach(r => {
        if (!map.has(r.id)) map.set(r.id, r.name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reviewersByConference]);

  // Unique conferences for filter dropdown
  const uniqueConferences = useMemo(() => {
    const map = new Map<string, string>();
    papers.forEach(p => {
      if (p.conference_id && p.conferences?.title) {
        map.set(p.conference_id, p.conferences.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [papers]);

  /* ---------- WORKFLOW FILTER + ADVANCED FILTERS ---------- */

  const pending = papers.filter(p => !p.decision_at);
  const completed = papers.filter(p => p.decision_at);
  const tabFiltered = tab === "pending" ? pending : completed;

  const filteredPapers = useMemo(() => {
    let result = [...tabFiltered];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.author_names || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    }

    // 2. Conference filter
    if (conferenceFilter !== "all") {
      result = result.filter(p => p.conference_id === conferenceFilter);
    }

    // 3. Status filter
    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }

    // 3. Plagiarism filter
    if (plagiarismFilter !== "all") {
      result = result.filter(p => (p.plagiarism_status || "pending") === plagiarismFilter);
    }

    // 4. Reviewer filter
    if (reviewerFilter !== "all") {
      if (reviewerFilter === "unassigned") {
        result = result.filter(p => !p.reviewer_id);
      } else {
        result = result.filter(p => p.reviewer_id === reviewerFilter);
      }
    }

    // 5. Revision filter
    if (revisionFilter !== "all") {
      if (revisionFilter === "original") {
        result = result.filter(p => !p.revision_number || p.revision_number === 1);
      } else {
        result = result.filter(p => p.revision_number > 1);
      }
    }

    // 6. Sort by created_at
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return dateSort === "newest" ? db - da : da - db;
    });

    return result;
  }, [tabFiltered, searchQuery, conferenceFilter, statusFilter, plagiarismFilter, reviewerFilter, revisionFilter, dateSort]);

  /* ---------- ACTIVE FILTER COUNT ---------- */

  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    conferenceFilter !== "all" ? 1 : 0,
    statusFilter !== "all" ? 1 : 0,
    plagiarismFilter !== "all" ? 1 : 0,
    reviewerFilter !== "all" ? 1 : 0,
    revisionFilter !== "all" ? 1 : 0,
    dateSort !== "newest" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function clearFilters() {
    setSearchQuery("");
    setConferenceFilter("all");
    setStatusFilter("all");
    setPlagiarismFilter("all");
    setReviewerFilter("all");
    setRevisionFilter("all");
    setDateSort("newest");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submissions</h1>
          <p className="text-gray-500 mt-1">
            Overview of submitted papers & review status
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
      <div className="flex gap-3">
        <TabButton
          label="Pending Decision"
          count={pending.length}
          active={tab === "pending"}
          onClick={() => setTab("pending")}
        />
        <TabButton
          label="Completed"
          count={completed.length}
          active={tab === "reviewed"}
          onClick={() => setTab("reviewed")}
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
            placeholder="Search by title, author, or email…"
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
            <label className="text-xs text-gray-500">Conference</label>
            <FilterSelect
              label="Conference"
              value={conferenceFilter}
              onChange={setConferenceFilter}
              options={[
                { value: "all", label: "All Conferences" },
                ...uniqueConferences.map(c => ({ value: c.id, label: c.title })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Status</label>
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "submitted", label: "Submitted" },
                { value: "under_review", label: "Under Review" },
                { value: "revision_required", label: "Revision Required" },
                { value: "resubmitted", label: "Resubmitted" },
                { value: "accepted", label: "Accepted" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Plagiarism</label>
            <FilterSelect
              label="Plagiarism"
              value={plagiarismFilter}
              onChange={setPlagiarismFilter}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "checking", label: "Checking" },
                { value: "passed", label: "Passed" },
                { value: "flagged", label: "Flagged" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Reviewer</label>
            <FilterSelect
              label="Reviewer"
              value={reviewerFilter}
              onChange={setReviewerFilter}
              options={[
                { value: "all", label: "All Reviewers" },
                { value: "unassigned", label: "Unassigned" },
                ...allReviewers.map(r => ({ value: r.id, label: r.name })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Revision</label>
            <FilterSelect
              label="Revision"
              value={revisionFilter}
              onChange={setRevisionFilter}
              options={[
                { value: "all", label: "All" },
                { value: "original", label: "Original (v1)" },
                { value: "revised", label: "Revised (v2+)" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sort By</label>
            <FilterSelect
              label="Sort"
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
            Showing {filteredPapers.length} of {tabFiltered.length} submission{tabFiltered.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`}
          </p>
        )}
      </Card>

      {/* ── Submissions List ── */}
      <Card className="p-4 sm:p-6 space-y-4">
        {loading && (
          <p className="text-sm text-gray-500">Loading submissions…</p>
        )}

        {!loading && filteredPapers.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {activeFilterCount > 0
                ? "No submissions match current filters."
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
          const reviewers = reviewersByConference[p.conference_id] || [];
          const needsReviewer = !p.reviewer_id;

          return (
            <div
              key={p.id}
              className={`border rounded-lg p-4 transition ${needsReviewer ? "bg-red-50" : "hover:bg-gray-50"
                }`}
            >
              <div className="flex justify-between gap-3">
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />

                  <div className="space-y-1">
                    <p className="font-medium">
                      <HighlightMatch text={title} query={searchQuery} />
                    </p>

                    <p className="text-xs text-gray-500">
                      Conference: {p.conferences?.title || "—"}
                    </p>

                    {p.author_names && (
                      <p className="text-xs text-gray-500">
                        Authors: <HighlightMatch text={p.author_names} query={searchQuery} />
                      </p>
                    )}

                    {p.email && (
                      <p className="text-xs text-gray-500">
                        Contact: <HighlightMatch text={p.email} query={searchQuery} />
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Submitted{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                      <WorkflowBadge paper={p} />

                      <Badge className={
                        p.plagiarism_status === "passed"
                          ? "bg-green-100 text-green-700"
                          : p.plagiarism_status === "flagged"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }>
                        Plagiarism: {p.plagiarism_status || "pending"}
                      </Badge>

                      {needsReviewer && (
                        <Badge className="bg-red-100 text-red-700">
                          No Reviewer
                        </Badge>
                      )}

                      {p.review_comment && (
                        <Badge className="bg-purple-100 text-purple-700">
                          Comment Added
                        </Badge>
                      )}

                      {p.presentation_fee_paid && (
                        <Badge className="bg-green-100 text-green-700">
                          Presentation Paid
                        </Badge>
                      )}

                      {p.payment_status === "pending" && (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          Payment Pending
                        </Badge>
                      )}

                      {p.revision_number > 1 && (
                        <Badge className="bg-purple-100 text-purple-700">
                          <RotateCcw className="h-3 w-3 mr-0.5" />
                          Revision v{p.revision_number}
                        </Badge>
                      )}

                      {p.decision_email_sent && (
                        <Badge className="bg-green-100 text-green-700">
                          Email Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <select
                    value={p.reviewer_id || ""}
                    onChange={(e) =>
                      assignReviewer(p.id, e.target.value)
                    }
                    className={`border rounded-md px-2 py-1 text-sm bg-white ${!p.reviewer_id ? "border-red-300" : ""
                      }`}
                  >
                    <option value="">Assign reviewer</option>

                    {reviewers.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <Button size="sm" asChild>
                    <Link href={`/dashboard/organizer/submissions/${p.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3 flex flex-wrap gap-4">
                {p.presentation_type && (
                  <span>Presentation: {p.presentation_type}</span>
                )}
                {p.publication_type && (
                  <span>Publication: {p.publication_type}</span>
                )}
                {p.decision_at && (
                  <span>
                    Decision:{" "}
                    {new Date(p.decision_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ═══════════════════════════ SUB-COMPONENTS ═══════════════════════════ */

/* ---------- WORKFLOW BADGE ---------- */

function WorkflowBadge({ paper }: { paper: any }) {
  if (paper.status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;

  if (paper.status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;

  if (paper.status === "resubmitted")
    return <Badge className="bg-purple-100 text-purple-700">Resubmitted</Badge>;

  if (paper.status === "revision_required")
    return <Badge className="bg-orange-100 text-orange-700">Revision Required</Badge>;

  if (paper.reviewed_at)
    return (
      <Badge className="bg-yellow-100 text-yellow-700">
        Awaiting Decision
      </Badge>
    );

  if (paper.reviewer_id)
    return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;

  return <Badge className="bg-gray-100 text-gray-700">Submitted</Badge>;
}

/* ---------- TAB BUTTON ---------- */

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
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

/* ---------- FILTER SELECT ---------- */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
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
      title={label}
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