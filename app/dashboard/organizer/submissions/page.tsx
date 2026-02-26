"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Download,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Clock,
  UserCheck,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerSubmissions() {
  const { profile } = useProfile();
  const organization = useOrganization();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [conferenceList, setConferenceList] = useState<any[]>([]);
  const [selectedConference, setSelectedConference] = useState("all");

  async function loadSubmissions() {
    if (!profile || !organization) return;

    setLoading(true);

    /* Load conferences */
    const { data: conferences, error: confErr } = await supabase
      .from("conferences")
      .select("id, title")
      .eq("organizer_id", profile.id);

    if (confErr) {
      console.error(confErr);
      setLoading(false);
      return;
    }

    setConferenceList(conferences || []);
    const conferenceIds = conferences?.map((c) => c.id) || [];

    if (conferenceIds.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    /* Load submissions with conference + presentation info */
    const { data: subs, error: subErr } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        user_id,
        conference_id,
        reviewer_id,
        file_url,
        status,
        payment_status,
        presentation_type,
        publication_type,
        created_at,
        reviewed_at,
        conferences (
          title
        )
      `)
      .in("conference_id", conferenceIds)
      .order("created_at", { ascending: false });

    if (subErr) {
      console.error(subErr);
      setLoading(false);
      return;
    }

    setSubmissions(subs || []);

    /* Load authors */
    const authorIds = [...new Set(subs?.map((s) => s.user_id))];

    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", authorIds);

      const authorMap: Record<string, any> = {};
      profs?.forEach((p) => {
        authorMap[p.id] = p;
      });

      setAuthors(authorMap);
    }

    /* Load reviewers */
    const { data: reviewerRegs } = await supabase
      .from("conference_registrations")
      .select("conference_id, user_id, profiles(name)")
      .in("conference_id", conferenceIds)
      .eq("role", "reviewer");

    const reviewerMap: Record<string, any> = {};

    reviewerRegs?.forEach((r: any) => {
      if (r.user_id && !reviewerMap[r.user_id]) {
        reviewerMap[r.user_id] = {
          id: r.user_id,
          name: r.profiles?.name ?? "Reviewer",
        };
      }
    });

    setReviewers(Object.values(reviewerMap));
    setLoading(false);
  }

  useEffect(() => {
    if (profile && organization) {
      loadSubmissions();
    }
  }, [profile, organization]);

  async function assignReviewer(submissionId: string, reviewerId: string) {
    const { error } = await supabase
      .from("paper_submissions")
      .update({ reviewer_id: reviewerId })
      .eq("id", submissionId);

    if (error) {
      alert(error.message);
      return;
    }

    loadSubmissions();
  }

  async function updateStatus(id: string, status: "accepted" | "rejected") {
    const { error } = await supabase
      .from("paper_submissions")
      .update({
        status,
        reviewed_at: new Date(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadSubmissions();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Paper Submissions</h1>
        <p className="text-gray-500 mt-1">
          Review, assign reviewers, and decide acceptance
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Filter:</span>
        <select
          value={selectedConference}
          onChange={(e) => setSelectedConference(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Conferences</option>
          {conferenceList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-6">
        {loading && (
          <p className="text-sm text-gray-500">Loading submissions...</p>
        )}

        {!loading && submissions.length === 0 && (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="py-3 px-2">Paper</th>
                  <th className="py-3 px-2">Conference</th>
                  <th className="py-3 px-2">Author</th>
                  <th className="py-3 px-2">Reviewer</th>
                  <th className="py-3 px-2">Payment</th>
                  <th className="py-3 px-2">Presentation</th>
                  <th className="py-3 px-2">Publication</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Timeline</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {submissions
                  .filter(
                    (s) =>
                      selectedConference === "all" ||
                      s.conference_id === selectedConference
                  )
                  .map((s) => {
                    const author = authors[s.user_id];
                    const needsReviewer = !s.reviewer_id;

                    return (
                      <tr
                        key={s.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              Paper Submission
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-2 font-medium">
                          {s.conferences?.title || "Unknown"}
                        </td>

                        <td className="py-3 px-2 text-sm">
                          <p>{author?.name ?? "Unknown"}</p>
                          <p className="text-gray-500">{author?.email}</p>
                        </td>

                        <td className="py-3 px-2">
                          <select
                            value={s.reviewer_id ?? ""}
                            onChange={(e) =>
                              assignReviewer(s.id, e.target.value)
                            }
                            className={`border rounded px-2 py-1 text-sm ${
                              needsReviewer ? "border-red-300" : ""
                            }`}
                          >
                            <option value="">Assign reviewer</option>
                            {reviewers.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name || "Unnamed Reviewer"}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-2">
                          <PaymentBadge status={s.payment_status} />
                        </td>

                        <td className="py-3 px-2 text-sm">
                          {s.presentation_type || "—"}
                        </td>

                        <td className="py-3 px-2 text-sm">
                          {s.publication_type || "—"}
                        </td>

                        

                        <td className="py-3 px-2">
                          <StatusBadge status={s.status} />
                        </td>

                        <td className="py-3 px-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(s.created_at).toLocaleDateString()}
                          </div>
                          {s.reviewed_at && (
                            <div className="flex items-center gap-1 mt-1">
                              <UserCheck className="h-3 w-3" />
                              {new Date(
                                s.reviewed_at
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-2">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={s.file_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>

                            <Button size="sm" variant="outline" asChild>
                              <a href={s.file_url} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>

                            {s.status !== "accepted" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateStatus(s.id, "accepted")
                                }
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}

                            {s.status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateStatus(s.id, "rejected")
                                }
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
  if (status === "submitted")
    return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid")
    return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
  if (status === "failed")
    return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}