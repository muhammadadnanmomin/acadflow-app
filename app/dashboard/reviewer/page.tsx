"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

import {
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ReviewerDashboard() {
  const { profile } = useProfile();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);
  const [activePaper, setActivePaper] = useState<string | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [score, setScore] = useState<number>(0);

  /* Load assigned papers */
  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("paper_submissions")
        .select(`
          id,
          title,
          file_url,
          status,
          review_comment,
          review_score,
          created_at,
          conferences ( title )
        `)
        .eq("reviewer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Paper load error:", error);
        setPapers([]);
        return;
      }

      setPapers(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  /* Submit review */
  async function submitReview(
    paperId: string,
    decision: "accepted" | "rejected"
  ) {
    if (!reviewText || score === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete review",
        description: "Please add score and comments",
      });
      return;
    }

    const { error } = await supabase
      .from("paper_submissions")
      .update({
        status: decision,
        review_comment: reviewText, // ✅ fixed
        review_score: score,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paperId)
      .eq("reviewer_id", profile?.id); // extra safety

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit review",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Review submitted",
      description: "Thank you for your review",
    });

    setReviewText("");
    setScore(0);
    setActivePaper(null);

    loadPapers();
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-3 sm:px-6">

      <div>
        <h1 className="text-3xl font-bold">
          Reviewer Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Review assigned papers (blind review)
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard title="Assigned" value={papers.length} />
        <StatCard
          title="Pending"
          value={papers.filter(p => p.status === "under_review").length}
        />
        <StatCard
          title="Reviewed"
          value={papers.filter(
            p => p.status === "accepted" || p.status === "rejected"
          ).length}
        />
      </div>

      <Card className="p-4 sm:p-6">

        {loading && (
          <p className="text-sm text-gray-500">
            Loading papers...
          </p>
        )}

        {!loading && papers.length === 0 && (
          <p className="text-sm text-gray-500">
            No assigned papers.
          </p>
        )}

        {!loading && papers.length > 0 && (
          <div className="space-y-4">
            {papers.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold">
                      Paper #{p.id.slice(0, 6)}
                    </span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="text-sm text-gray-500">
                  Conference: {p.conferences?.title}
                </div>

                <div className="flex flex-wrap gap-3">
                  {p.file_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={p.file_url} target="_blank">
                        View Paper
                      </a>
                    </Button>
                  )}

                  {p.status === "under_review" && (
                    <Button
                      size="sm"
                      onClick={() => setActivePaper(p.id)}
                    >
                      Write Review
                    </Button>
                  )}
                </div>

                {activePaper === p.id && p.status === "under_review" && (
                  <div className="space-y-3 bg-muted/40 p-4 rounded-lg">
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="Score (1–5)"
                      value={score || ""}
                      onChange={(e) => setScore(Number(e.target.value))}
                    />

                    <Textarea
                      placeholder="Write your review comments..."
                      value={reviewText}
                      onChange={(e) =>
                        setReviewText(e.target.value)
                      }
                    />

                    <div className="flex justify-end gap-3 flex-wrap">
                      <Button
                        variant="destructive"
                        size="sm"
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
                  </div>
                )}

                {p.status !== "under_review" && (
                  <p className="text-xs text-gray-500">
                    Review submitted. Editing locked.
                  </p>
                )}

              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* Stat Card */
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}

/* Status Badge */
function StatusBadge({ status }: { status: string }) {
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

  return (
    <Badge className="bg-blue-100 text-blue-700">
      Under Review
    </Badge>
  );
}
