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

export default function OrganizerSubmissionsSummary() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [reviewersByConference, setReviewersByConference] =
    useState<Record<string, any[]>>({});
  const [tab, setTab] = useState<"pending" | "reviewed">("pending");

  /* ---------- LOAD REVIEWERS ---------- */

  async function loadReviewers(conferenceIds: string[]) {
    if (!conferenceIds.length) return {};

    const { data, error } = await supabase
      .from("conference_registrations")
      .select(`
        user_id,
        conference_id,
        profiles ( id, name, email )
      `)
      .in("conference_id", conferenceIds)
      .eq("role", "reviewer");

    if (error || !data) return {};

    const map: Record<string, any[]> = {};

    data.forEach((r: any) => {
      if (!map[r.conference_id]) map[r.conference_id] = [];

      map[r.conference_id].push({
        id: r.user_id,
        name: r.profiles?.name || "Reviewer",
        email: r.profiles?.email,
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
    if (paper?.reviewer_id === reviewerId) return;

    await supabase
      .from("paper_submissions")
      .update({ reviewer_id: reviewerId || null })
      .eq("id", submissionId);

    loadPapers();
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) loadPapers();
    return () => {
      mounted = false;
    };
  }, [profile]);

  /* ---------- WORKFLOW FILTER ---------- */

  const pending = papers.filter(p => !p.decision_at);
  const reviewed = papers.filter(p => p.decision_at);
  const visible = tab === "pending" ? pending : reviewed;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Submissions</h1>
        <p className="text-gray-500 mt-1">
          Overview of submitted papers & review status
        </p>
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
          label="Reviewed"
          count={reviewed.length}
          active={tab === "reviewed"}
          onClick={() => setTab("reviewed")}
        />
      </div>

      <Card className="p-4 sm:p-6 space-y-4">
        {loading && (
          <p className="text-sm text-gray-500">Loading submissions…</p>
        )}

        {!loading && visible.length === 0 && (
          <p className="text-sm text-gray-500">
            No papers in this category.
          </p>
        )}

        {!loading && visible.map((p) => {
          const title = p.title || `Paper #${p.id.slice(0, 6)}`;
          const reviewers = reviewersByConference[p.conference_id] || [];
          const needsReviewer = !p.reviewer_id;

          return (
            <div
              key={p.id}
              className={`border rounded-lg p-4 transition ${
                needsReviewer ? "bg-red-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />

                  <div className="space-y-1">
                    <p className="font-medium">{title}</p>

                    <p className="text-xs text-gray-500">
                      Conference: {p.conferences?.title || "—"}
                    </p>

                    {p.author_names && (
                      <p className="text-xs text-gray-500">
                        Authors: {p.author_names}
                      </p>
                    )}

                    {p.email && (
                      <p className="text-xs text-gray-500">
                        Contact: {p.email}
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
                        <Badge className="bg-gray-100 text-gray-700">
                          Revision {p.revision_number}
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
                    className={`border rounded-md px-2 py-1 text-sm bg-white ${
                      !p.reviewer_id ? "border-red-300" : ""
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

/* ---------- WORKFLOW BADGE ---------- */

function WorkflowBadge({ paper }: { paper: any }) {
  if (paper.status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;

  if (paper.status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;

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