"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useOrganization } from "@/lib/organizations/useOrganization";

const supabase = createClient()

import {
  Download,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Clock,
  UserCheck
} from "lucide-react";

export default function OrganizerSubmissions() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [reviewers, setReviewers] = useState<any[]>([]);
  const organization = useOrganization();

  async function loadSubmissions() {
    if (!profile || !organization) return;

    setLoading(true);

    const { data: conferences, error: confErr } = await supabase
      .from("conferences")
      .select("id")
      .eq("organizer_id", profile.id);

    if (confErr) {
      console.error(confErr);
      setLoading(false);
      return;
    }

    const conferenceIds = conferences?.map(c => c.id) || [];

    if (conferenceIds.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const { data: subs, error: subErr } = await supabase
      .from("paper_submissions")
      .select(`
      id,
      user_id,
      conference_id,
      reviewer_id,
      file_url,
      status,
      created_at,
      reviewed_at
    `)
      .in("conference_id", conferenceIds)
      .order("created_at", { ascending: false });

    if (subErr) {
      console.error(subErr);
      setLoading(false);
      return;
    }

    setSubmissions(subs || []);

    const authorIds = [...new Set(subs?.map((s) => s.user_id))];

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", authorIds);

    const authorMap: Record<string, any> = {};
    profs?.forEach((p) => {
      authorMap[p.id] = p;
    });

    setAuthors(authorMap);

    const { data: revs } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "reviewer");

    setReviewers(revs || []);
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

      <Card className="p-6">

        {loading && <p className="text-sm text-gray-500">Loading submissions...</p>}

        {!loading && submissions.length === 0 && (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        )}

        {!loading && submissions.length > 0 && (
          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="py-3 px-2">Paper</th>
                  <th className="py-3 px-2">Author</th>
                  <th className="py-3 px-2">Reviewer</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Timeline</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>

                {submissions.map((s) => {
                  const author = authors[s.user_id];
                  const needsReviewer = !s.reviewer_id;

                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">

                      {/* Paper */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Paper Submission</span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-2 text-sm">
                        <p>{author?.name ?? "Unknown"}</p>
                        <p className="text-gray-500">{author?.email}</p>
                      </td>

                      {/* Reviewer */}
                      <td className="py-3 px-2">
                        <select
                          value={s.reviewer_id ?? ""}
                          onChange={(e) => assignReviewer(s.id, e.target.value)}
                          className={`border rounded px-2 py-1 text-sm ${needsReviewer ? "border-red-300" : ""}`}
                        >
                          <option value="">Assign reviewer</option>
                          {reviewers.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">
                        <StatusBadge status={s.status} />
                      </td>

                      {/* Timeline */}
                      <td className="py-3 px-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(s.created_at).toLocaleDateString()}
                        </div>
                        {s.reviewed_at && (
                          <div className="flex items-center gap-1 mt-1">
                            <UserCheck className="h-3 w-3" />
                            {new Date(s.reviewed_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-2">

                          {/* Open paper */}
                          <Button size="sm" variant="outline" asChild>
                            <a href={s.file_url} target="_blank" rel="noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>

                          {/* Download */}
                          <Button size="sm" variant="outline" asChild>
                            <a href={s.file_url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>

                          {s.status !== "accepted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(s.id, "accepted")}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          {s.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(s.id, "rejected")}
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