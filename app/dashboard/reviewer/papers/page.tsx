"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { FileText, Eye, PenLine } from "lucide-react";

/* ---------- PAGE ---------- */

const supabase = createClient()

export default function ReviewerPapersPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);

  /* Load assigned papers (blind-review safe) */
  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        file_url,
        status,
        created_at,
        reviewed_at
      `)
      .eq("reviewer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPapers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-3 sm:px-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Assigned Papers
        </h1>

        <p className="text-gray-500 mt-1">
          Papers assigned to you for blind review
        </p>
      </div>

      {/* Main */}
      <Card className="p-4 sm:p-6">

        {loading && (
          <p className="text-sm text-gray-500">
            Loading papers…
          </p>
        )}

        {!loading && papers.length === 0 && (
          <p className="text-sm text-gray-500">
            No papers assigned yet.
          </p>
        )}

        {!loading && papers.length > 0 && (

          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">

              <table className="w-full border-collapse">

                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="py-3 px-2">Paper</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Assigned On</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {papers.map((p, index) => (

                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      {/* Paper */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            Paper #{index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Date */}
                      <td className="py-3 px-2 text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right">
                        <ActionButtons paper={p} />
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">

              {papers.map((p, index) => (

                <Card
                  key={p.id}
                  className="p-4 space-y-3"
                >

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold">
                        Paper #{index + 1}
                      </span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <p className="text-xs text-gray-500">
                    Assigned on {new Date(p.created_at).toLocaleDateString()}
                  </p>

                  <ActionButtons paper={p} mobile />

                </Card>

              ))}

            </div>
          </>
        )}

      </Card>

    </div>
  );
}

/* ---------- ACTION BUTTONS ---------- */

function ActionButtons({
  paper,
  mobile = false,
}: {
  paper: any;
  mobile?: boolean;
}) {
  return (
    <div
      className={`flex ${mobile ? "justify-start" : "justify-end"
        } gap-2 flex-wrap`}
    >

      {paper.file_url && (
        <Button size="sm" variant="outline" asChild>
          <a
            href={paper.file_url}
            target="_blank"
            rel="noreferrer"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </a>
        </Button>
      )}

      {!paper.reviewed_at && (
        <Button size="sm" asChild>
          <Link href={`/dashboard/reviewer/reviews/${paper.id}`}>
            <PenLine className="h-4 w-4 mr-1" />
            Review
          </Link>
        </Button>
      )}

      {paper.reviewed_at && (
        <Badge className="bg-gray-100 text-gray-600">
          Review Submitted
        </Badge>
      )}

    </div>
  );
}

/* ---------- STATUS BADGE ---------- */

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

  if (status === "under_review") {
    return (
      <Badge className="bg-blue-100 text-blue-700">
        Under Review
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-700">
      Pending
    </Badge>
  );
}
