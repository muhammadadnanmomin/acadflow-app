"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import {
  Eye,
  Download,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from "lucide-react";

export default function ReviewerReviewPage() {
  const { paperId } = useParams();
  const router = useRouter();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    authors: true,
    declarations: false,
  });
  const [confirmAction, setConfirmAction] = useState<"accepted" | "rejected" | "revision_required" | null>(null);

  const supabase = createClient();

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  /* Load draft */
  useEffect(() => {
    if (paperId) {
      const saved = localStorage.getItem(`review-draft-${paperId}`);
      if (saved) setComments(saved);
    }
  }, [paperId]);

  /* Load paper */
  useEffect(() => {
    async function loadPaper() {
      if (!profile || !paperId) return;

      setLoading(true);

      const { data } = await supabase
        .from("paper_submissions")
        .select(`
          id,
          title,
          file_url,
          camera_ready_url,
          status,
          plagiarism_status,
          review_comment,
          reviewer_id,
          reviewed_at,
          created_at,
          revision_number,
          declaration_original,
          declaration_no_plagiarism,
          declaration_author_approval,
          conferences ( title )
        `)
        .eq("id", paperId)
        .eq("reviewer_id", profile.id)
        .maybeSingle();

      if (!data) {
        router.push("/dashboard/reviewer/papers");
        return;
      }

      setPaper(data);

      if (data.review_comment) {
        setComments(data.review_comment);
      }

      // load authors (optional for blind review — remove if double blind)
      const { data: authorRows } = await supabase
        .from("paper_authors")
        .select("name, affiliation, author_order, is_primary")
        .eq("submission_id", paperId)
        .order("author_order", { ascending: true });

      setAuthors(authorRows || []);

      setLoading(false);
    }

    loadPaper();
  }, [profile, paperId]);

  /* autosave draft */
  useEffect(() => {
    if (paperId) {
      localStorage.setItem(`review-draft-${paperId}`, comments);
    }
  }, [comments, paperId]);

  async function submitReview(decision: "accepted" | "rejected") {
    if (!comments.trim()) {
      alert("Please write review comments.");
      return;
    }

    setSubmitting(true);

    await supabase
      .from("paper_submissions")
      .update({
        status: decision,
        review_comment: comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paper.id)
      .eq("reviewer_id", profile!.id);

    localStorage.removeItem(`review-draft-${paperId}`);
    router.push("/dashboard/reviewer/papers");
  }

  /* ─── Request Revision ─── */
  async function requestRevision() {
    if (!comments.trim()) {
      alert("Please write review comments.");
      return;
    }

    setSubmitting(true);

    await supabase
      .from("paper_submissions")
      .update({
        status: "revision_required",
        review_comment: comments,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paper.id)
      .eq("reviewer_id", profile!.id);

    localStorage.removeItem(`review-draft-${paperId}`);
    router.push("/dashboard/reviewer/papers");
  }

  /* ─── Confirm & Execute ─── */
  function executeConfirm() {
    if (!confirmAction) return;
    if (confirmAction === "revision_required") requestRevision();
    else submitReview(confirmAction);
    setConfirmAction(null);
  }

  /* ═════════ RENDER ═════════ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500 text-sm">Loading paper…</span>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-gray-500">Paper not found.</p>
      </div>
    );
  }

  const reviewed = !!paper.reviewed_at;
  const title = paper.title || `Paper #${paper.id.slice(0, 6)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-28">

      {/* ── Header ── */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 text-gray-500" onClick={() => router.push("/dashboard/reviewer/papers")}>
          ← Back to Papers
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
        {paper.conferences?.title && (
          <p className="text-gray-500 text-sm mt-1">
            Conference: {paper.conferences.title}
          </p>
        )}
      </div>

      {/* ── Action Required Banner ── */}
      {!reviewed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800 font-medium">Action required — this paper is awaiting your review.</span>
        </div>
      )}

      {/* ── Plagiarism Flag Banner ── */}
      {paper.plagiarism_status === "flagged" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800 font-medium">
            Similarity flagged — review carefully before submitting your decision.
          </span>
        </div>
      )}

      {/* ── Decision Summary Card ── */}
      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <InfoCell label="Paper ID" value={paper.id?.slice(0, 8)} mono />
          <InfoCell label="Submitted" value={new Date(paper.created_at).toLocaleDateString()} />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
            <div className="mt-0.5"><StatusBadge status={paper.status} /></div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Plagiarism</p>
            <div className="mt-0.5"><PlagiarismBadge status={paper.plagiarism_status} /></div>
          </div>
        </div>

        {/* Workflow Stepper */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <StepPill label="Submitted" done={!!paper.created_at} />
            <StepPill label="Assigned" done={!!paper.reviewer_id} />
            <StepPill label="Reviewed" done={reviewed} />
            <StepPill
              label={paper.status === "rejected" ? "Rejected" : paper.status === "accepted" ? "Accepted" : "Decision"}
              done={!!paper.decision_at || paper.status === "accepted" || paper.status === "rejected"}
              variant={paper.status === "rejected" ? "red" : paper.status === "accepted" ? "green" : undefined}
            />
          </div>
        </div>

        {/* Date row */}
        <div className="flex gap-4 flex-wrap text-xs text-gray-400 mt-3">
          {paper.reviewed_at && <span>Reviewed: {new Date(paper.reviewed_at).toLocaleDateString()}</span>}
          {paper.revision_number > 1 && <span>Revision v{paper.revision_number}</span>}
        </div>
      </Card>

      {/* ── Paper Files ── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Paper Files
        </h2>

        <div className="flex flex-wrap gap-2">
          {paper.file_url && (
            <>
              <Button size="sm" variant="outline" asChild>
                <a href={paper.file_url} target="_blank">
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Paper
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={paper.file_url} download>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </a>
              </Button>
            </>
          )}
          {paper.camera_ready_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={paper.camera_ready_url} target="_blank">
                <Download className="h-3.5 w-3.5 mr-1" /> Camera Ready
              </a>
            </Button>
          )}
        </div>

        {paper.revision_number > 1 && (
          <p className="text-xs text-gray-400">Currently viewing revision v{paper.revision_number}</p>
        )}
      </Card>

      {/* ── Authors ── */}
      <CollapsibleCard title="Authors" icon={<Users className="h-4 w-4" />} id="authors" expanded={expanded} toggle={toggle}>
        {authors.length === 0 ? (
          <p className="text-sm text-gray-500">No author data available</p>
        ) : (
          <div className="space-y-2">
            {authors.map((a, i) => (
              <div
                key={i}
                className={`border rounded-md p-3 ${a.is_primary ? "bg-blue-50 border-blue-200" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {a.author_order}. {a.name}
                    {a.is_primary && (
                      <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                    )}
                  </p>
                </div>
                {a.affiliation && <p className="text-xs text-gray-500 mt-1">{a.affiliation}</p>}
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>

      {/* ── Declarations ── */}
      <CollapsibleCard title="Author Declarations" icon={<ShieldCheck className="h-4 w-4" />} id="declarations" expanded={expanded} toggle={toggle}>
        <div className="space-y-1">
          <Declaration ok={paper.declaration_original} text="Original work" />
          <Declaration ok={paper.declaration_no_plagiarism} text="No plagiarism" />
          <Declaration ok={paper.declaration_author_approval} text="Author approvals" />
        </div>
      </CollapsibleCard>

      {/* ── Review Comments ── */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Reviewer Comments</h2>

        {reviewed ? (
          <>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{paper.review_comment}</p>
            </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-gray-100 text-gray-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Review submitted — editing locked
              </Badge>
              <span className="text-xs text-gray-400">
                Reviewed on {new Date(paper.reviewed_at).toLocaleDateString()}
              </span>
            </div>
          </>
        ) : (
          <>
            <Textarea
              placeholder="Write strengths, weaknesses, and suggestions..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={8}
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>Include strengths &amp; suggestions</span>
              <span>
                {comments.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          </>
        )}
      </Card>

      {/* ── Confirmation Modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">
              Confirm {confirmAction === "accepted" ? "Accept" : confirmAction === "rejected" ? "Reject" : "Request Revision"}
            </h2>

            <div className="text-sm space-y-2">
              <p><strong>Paper:</strong> {title}</p>
              <p><strong>Action:</strong>{" "}
                <StatusBadge status={confirmAction} />
              </p>
            </div>

            {paper.plagiarism_status === "flagged" && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Plagiarism is flagged for this paper.
              </div>
            )}

            {!reviewed && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                This decision will be sent to the conference organizer.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                disabled={submitting}
                variant={confirmAction === "rejected" ? "destructive" : "default"}
                onClick={executeConfirm}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Sticky Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t shadow-lg z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500 hidden sm:block">
            <span className="font-medium text-gray-700">{title}</span>
            <span className="mx-2">·</span>
            <StatusBadge status={paper.status} />
          </div>

          <div className="flex gap-2 ml-auto">
            {!reviewed ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setConfirmAction("rejected")}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={submitting || !comments.trim()}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => setConfirmAction("revision_required")}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Revision
                </Button>

                <Button
                  size="sm"
                  disabled={submitting}
                  onClick={() => setConfirmAction("accepted")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Accept
                </Button>
              </>
            ) : (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Review Submitted
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ SUB-COMPONENTS ═══════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Submitted", cls: "bg-gray-100 text-gray-700" },
    under_review: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
    resubmitted: { label: "Resubmitted", cls: "bg-purple-100 text-purple-700" },
    revision_required: { label: "Revision Required", cls: "bg-orange-100 text-orange-700" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    final_submitted: { label: "Final Submitted", cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] || { label: status || "Pending", cls: "bg-yellow-100 text-yellow-700" };
  return <Badge className={s.cls}>{s.label}</Badge>;
}

function PlagiarismBadge({ status }: { status?: string }) {
  if (status === "passed") return <Badge className="bg-green-100 text-green-700">Passed</Badge>;
  if (status === "flagged") return <Badge className="bg-red-100 text-red-700">Flagged</Badge>;
  if (status === "checking") return <Badge className="bg-blue-100 text-blue-700">Checking</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}

function StepPill({ label, done, variant }: { label: string; done: boolean; variant?: "green" | "red" }) {
  const base = done
    ? variant === "red" ? "bg-red-100 text-red-700 border-red-200"
      : variant === "green" ? "bg-green-100 text-green-700 border-green-200"
        : "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${base}`}>
      {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium text-gray-700 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Declaration({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`text-sm ${ok ? "text-green-600" : "text-red-600"}`}>
      {ok ? "✔" : "✖"} {text}
    </p>
  );
}

function CollapsibleCard({
  title,
  icon,
  children,
  id,
  expanded,
  toggle,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  id: string;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  const isOpen = expanded[id] ?? true;
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
        onClick={() => toggle(id)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {isOpen && <div className="px-5 py-4 border-t">{children}</div>}
    </Card>
  );
}