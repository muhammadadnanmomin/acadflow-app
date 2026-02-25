"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ReviewerReviewsPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});

  const supabase = createClient()

  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        file_url,
        status,
        review_comment,
        created_at,
        conferences ( title )
      `)
      .eq("reviewer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load reviews error:", error);
      setLoading(false);
      return;
    }

    setPapers(data || []);

    const map: Record<string, string> = {};

    data?.forEach((p: any) => {
      map[p.id] = p.review_comment || "";
    });

    setComments(map);

    setLoading(false);
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  async function submitReview(
    paperId: string,
    decision: "accepted" | "rejected"
  ) {
    if (!comments[paperId]?.trim()) {
      alert("Please write review comments first");
      return;
    }

    const { error } = await supabase
      .from("paper_submissions")
      .update({
        status: decision,
        review_comment: comments[paperId],
        reviewed_at: new Date(),
      })
      .eq("id", paperId)
      .eq("reviewer_id", profile?.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Review submitted");

    loadPapers();
  }

  return (
    <div className="space-y-8 max-w-6xl">

      <div>
        <h1 className="text-3xl font-bold">My Reviews</h1>
        <p className="text-gray-500 mt-1">
          Review and evaluate assigned papers
        </p>
      </div>

      <Card className="p-6">

        {loading && (
          <p className="text-sm text-gray-500">
            Loading reviews...
          </p>
        )}

        {!loading && papers.length === 0 && (
          <p className="text-sm text-gray-500">
            No papers assigned for review.
          </p>
        )}

        {!loading && papers.length > 0 && (
          <div className="space-y-5">

            {papers.map((p, index) => {

              const isReviewed =
                p.status === "accepted" ||
                p.status === "rejected";

              return (

                <div
                  key={p.id}
                  className="border rounded-lg p-5 space-y-4"
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold">
                        Paper #{index + 1}
                      </span>
                    </div>

                    <StatusBadge status={p.status} />

                  </div>

                  <div className="text-sm text-gray-500">
                    <p>
                      Conference: {p.conferences?.title}
                    </p>
                    <p>
                      Assigned: {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {p.file_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={p.file_url} target="_blank">
                        View Paper
                      </a>
                    </Button>
                  )}

                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Review Comments
                    </label>

                    <Textarea
                      placeholder="Write detailed feedback for the author..."
                      value={comments[p.id] || ""}
                      disabled={isReviewed}
                      onChange={(e) =>
                        setComments({
                          ...comments,
                          [p.id]: e.target.value,
                        })
                      }
                    />
                  </div>

                  {!isReviewed && (
                    <div className="flex justify-end gap-3 pt-2">

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          submitReview(p.id, "rejected")
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>

                      <Button
                        size="sm"
                        onClick={() =>
                          submitReview(p.id, "accepted")
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>

                    </div>
                  )}

                  {isReviewed && (
                    <p className="text-sm text-green-600 font-medium">
                      Review submitted ✓
                    </p>
                  )}

                </div>

              );
            })}

          </div>
        )}

      </Card>

    </div>
  );
}

function StatusBadge({ status }: { status: string }) {

  if (status === "accepted") {
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
  }

  if (status === "rejected") {
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
  }

  if (status === "Submitted" || status === "under_review") {
    return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;
  }

  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}