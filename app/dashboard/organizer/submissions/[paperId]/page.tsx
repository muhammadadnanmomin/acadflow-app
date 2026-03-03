"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import {
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Users,
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Mail,
  RotateCcw,
  CreditCard,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  MessageSquare,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerPaperReviewPage() {
  const { paperId } = useParams();
  const router = useRouter();
  const { profile } = useProfile();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<any>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [reviewer, setReviewer] = useState<any>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"accepted" | "rejected" | "revision_required" | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ authors: true, declarations: false, plagiarism: true });
  const [copied, setCopied] = useState<string | null>(null);

  // Plagiarism management
  const [plagiarismStatus, setPlagiarismStatus] = useState<string>("pending");
  const [plagiarismNote, setPlagiarismNote] = useState("");
  const [plagiarismSaving, setPlagiarismSaving] = useState(false);

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  /* ─── Data Loading ─── */
  const loadPaper = useCallback(async () => {
    if (!paperId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select("*, conferences ( title )")
      .eq("id", paperId)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPaper(data);
    setNote(data.organizer_note || "");
    setPlagiarismStatus(data.plagiarism_status || "pending");

    // Load authors
    const { data: authorRows } = await supabase
      .from("paper_authors")
      .select("*")
      .eq("submission_id", paperId)
      .order("author_order", { ascending: true });
    setAuthors(authorRows || []);

    // Load reviewer profile if assigned
    if (data.reviewer_id) {
      const { data: rev } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", data.reviewer_id)
        .single();
      setReviewer(rev);
    }

    // Load review history from reviews table
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, revision_number, decision, comments, created_at, reviewer_id")
      .eq("submission_id", paperId)
      .order("created_at", { ascending: true });

    setReviewHistory(reviews || []);

    setLoading(false);
  }, [paperId]);

  useEffect(() => {
    loadPaper();
  }, [loadPaper]);

  /* ─── Keyboard Shortcuts ─── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "v" || e.key === "V") {
        if (paper?.file_url) window.open(paper.file_url, "_blank");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [paper]);

  /* ─── Copy Email ─── */
  async function copyEmail(email: string) {
    await navigator.clipboard.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  }

  /* ─── Send Email Helper ─── */
  async function sendDecisionEmails(status: string) {
    for (const author of authors) {
      if (!author.email) continue;
      const cleanName =
        author.name && !author.name.toLowerCase().includes("author")
          ? author.name.trim()
          : "Author";
      await fetch("/api/send-decision-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: author.email,
          name: cleanName,
          conference: paper.conferences?.title,
          status,
          ...(status === "revision_required" && note.trim()
            ? { comments: note.trim() }
            : {}),
        }),
      });
    }
  }

  /* ─── Accept / Reject (final decision) ─── */
  async function updateStatus(status: "accepted" | "rejected") {
    setSubmitting(true);

    // Prevent duplicate final decisions
    const isFinal = paper.status === "accepted" || paper.status === "rejected";
    if (isFinal && paper.decision_email_sent) {
      router.push("/dashboard/organizer/submissions");
      return;
    }

    // Only update status, decision_at, decision_email_sent — NOT review_comment
    await supabase
      .from("paper_submissions")
      .update({
        status,
        decision_at: new Date().toISOString(),
      })
      .eq("id", paper.id);

    try {
      await sendDecisionEmails(status);
      await supabase
        .from("paper_submissions")
        .update({ decision_email_sent: true })
        .eq("id", paper.id);
    } catch (err) {
      console.error("Email failed:", err);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    router.push("/dashboard/organizer/submissions");
  }

  /* ─── Request Revision ─── */
  async function requestRevision() {
    setSubmitting(true);

    // Only update status — do NOT set review_comment
    await supabase
      .from("paper_submissions")
      .update({
        status: "revision_required",
        decision_at: null,
      })
      .eq("id", paper.id);

    try {
      await sendDecisionEmails("revision_required");
    } catch (err) {
      console.error("Revision email failed:", err);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    router.push("/dashboard/organizer/submissions");
  }

  /* ─── Camera-Ready Upload ─── */
  async function uploadCameraReady(file: File) {
    const path = `camera-ready/${paper.id}_${file.name}`;
    await supabase.storage.from("papers").upload(path, file, { upsert: true });
    const url = supabase.storage.from("papers").getPublicUrl(path).data.publicUrl;
    await supabase.from("paper_submissions").update({ camera_ready_url: url }).eq("id", paper.id);
    loadPaper();
  }

  /* ─── Update Plagiarism Status ─── */
  async function updatePlagiarismStatus() {
    setPlagiarismSaving(true);
    try {
      const { error } = await supabase
        .from("paper_submissions")
        .update({ plagiarism_status: plagiarismStatus })
        .eq("id", paper.id);

      if (error) throw error;

      setPaper((prev: any) => ({ ...prev, plagiarism_status: plagiarismStatus }));
      toast({ title: `Plagiarism status updated to "${plagiarismStatus}" ✅` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to update plagiarism status", description: err?.message });
    } finally {
      setPlagiarismSaving(false);
    }
  }

  /* ─── Confirm & Execute ─── */
  function executeConfirm() {
    if (!confirmAction) return;
    if (confirmAction === "revision_required") requestRevision();
    else updateStatus(confirmAction);
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

  // Multi-round locking logic
  const isFinalDecision = paper.status === "accepted" || paper.status === "rejected";
  const title = paper.title || `Paper #${paper.id.slice(0, 8)}`;
  const latestReview = reviewHistory.length > 0 ? reviewHistory[reviewHistory.length - 1] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-28">

      {/* ── Header ── */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 text-gray-500" onClick={() => router.push("/dashboard/organizer/submissions")}>
          ← Back to Submissions
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          {paper.revision_number > 1 && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Revision v{paper.revision_number}
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Conference: {paper.conferences?.title}
        </p>
      </div>

      {/* ── Action Required Banner ── */}
      {!isFinalDecision && reviewHistory.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            {paper.status === "resubmitted"
              ? `Revised paper (v${paper.revision_number}) received — awaiting reviewer re-review or your decision.`
              : `Action required — reviewer has submitted ${reviewHistory.length} review${reviewHistory.length > 1 ? "s" : ""}. Please make a decision.`}
          </span>
        </div>
      )}

      {/* ── Final Decision Banner ── */}
      {isFinalDecision && (
        <div className={`${paper.status === "accepted" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-3 flex items-center gap-2`}>
          {paper.status === "accepted"
            ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            : <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
          <span className={`text-sm font-medium ${paper.status === "accepted" ? "text-green-800" : "text-red-800"}`}>
            Final decision: {paper.status === "accepted" ? "Accepted" : "Rejected"} — further reviewing is locked.
          </span>
        </div>
      )}

      {/* ── Plagiarism Flag Banner ── */}
      {paper.plagiarism_status === "flagged" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800 font-medium">
            Plagiarism flagged — review carefully before making a decision.
          </span>
        </div>
      )}

      {/* ── Decision Summary ── */}
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
            <StepPill label="Reviewer Assigned" done={!!paper.reviewer_id} />
            <StepPill
              label={reviewHistory.length > 0 ? `Reviews Submitted (${reviewHistory.length})` : "Reviewed"}
              done={reviewHistory.length > 0 || !!paper.reviewed_at}
            />
            {(paper.status === "revision_required" || paper.status === "resubmitted" || paper.revision_number > 1) && (
              <StepPill
                label={paper.status === "resubmitted" ? `Resubmitted (v${paper.revision_number})` : "Revision Requested"}
                done={true}
                variant={paper.status === "resubmitted" ? "purple" : "orange"}
              />
            )}
            <StepPill
              label={paper.status === "rejected" ? "Rejected" : paper.status === "accepted" ? "Accepted" : "Final Decision"}
              done={isFinalDecision}
              variant={paper.status === "rejected" ? "red" : paper.status === "accepted" ? "green" : undefined}
            />
          </div>
        </div>

        {/* Date row */}
        <div className="flex gap-4 flex-wrap text-xs text-gray-400 mt-3">
          {paper.reviewed_at && <span>Last reviewed: {new Date(paper.reviewed_at).toLocaleDateString()}</span>}
          {paper.decision_at && <span>Decision: {new Date(paper.decision_at).toLocaleDateString()}</span>}
          {paper.revision_number > 1 && <span>Current revision: v{paper.revision_number}</span>}
          {reviewHistory.length > 0 && <span>Total review rounds: {reviewHistory.length}</span>}
        </div>
      </Card>

      {/* ── Reviewer Info ── */}
      {reviewer && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Assigned Reviewer
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {reviewer.name?.charAt(0)?.toUpperCase() || "R"}
            </div>
            <div>
              <p className="text-sm font-medium">{reviewer.name}</p>
              {reviewer.email && (
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500">{reviewer.email}</p>
                  <button onClick={() => copyEmail(reviewer.email)} className="text-gray-400 hover:text-gray-600" title="Copy email">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <Badge className="bg-blue-100 text-blue-700 ml-auto">Assigned</Badge>
          </div>
        </Card>
      )}

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

        {/* Camera-ready upload (organizer) */}
        {paper.status === "accepted" && (
          <div className="pt-2 border-t">
            <label className="text-blue-600 cursor-pointer hover:underline text-sm flex items-center gap-1">
              <Upload size={14} />
              {paper.camera_ready_url ? "Replace Camera Ready" : "Upload Camera Ready"}
              <input type="file" className="hidden" onChange={e => e.target.files && uploadCameraReady(e.target.files[0])} />
            </label>
            {paper.camera_ready_url && (
              <p className="text-xs text-green-600 mt-1">✓ Camera-ready version uploaded</p>
            )}
          </div>
        )}
      </Card>

      {/* ── Paper Metadata ── */}
      {(paper.presentation_type || paper.publication_type || paper.presentation_fee > 0) && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Paper Details & Payment
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {paper.presentation_type && <InfoCell label="Presentation" value={paper.presentation_type} />}
            {paper.publication_type && <InfoCell label="Publication" value={paper.publication_type} />}
            {paper.presentation_fee > 0 && (
              <InfoCell label="Fee" value={`₹${Number(paper.presentation_fee).toLocaleString("en-IN")}`} />
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Payment</p>
              <div className="mt-0.5">
                {paper.presentation_fee_paid ? (
                  <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>
                ) : paper.status === "accepted" && paper.presentation_fee > 0 ? (
                  <Badge className="bg-red-100 text-red-700">Unpaid</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500">N/A</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Authors ── */}
      <CollapsibleCard title="Authors" icon={<Users className="h-4 w-4" />} id="authors" expanded={expanded} toggle={toggle}>
        {authors.length === 0 ? (
          <p className="text-sm text-gray-500">{paper.author_names || "No author data available"}</p>
        ) : (
          <div className="space-y-2">
            {authors.map((a) => (
              <div
                key={a.id}
                className={`border rounded-md p-3 ${a.is_primary ? "bg-blue-50 border-blue-200" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {a.author_order}. {a.name}
                    {a.is_primary && (
                      <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                    )}
                  </p>
                  {a.email && (
                    <div className="flex items-center gap-1">
                      <a href={`mailto:${a.email}`} className="text-blue-600 hover:underline text-xs">{a.email}</a>
                      <button onClick={() => copyEmail(a.email)} className="text-gray-400 hover:text-gray-600" title="Copy email">
                        {copied === a.email ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  )}
                </div>
                {a.affiliation && <p className="text-xs text-gray-500 mt-1">{a.affiliation}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Corresponding author */}
        {paper.email && (
          <div className="mt-3 pt-3 border-t text-sm">
            <span className="text-gray-400">Corresponding Author:</span>{" "}
            <a href={`mailto:${paper.email}`} className="text-blue-600 hover:underline">{paper.email}</a>
            {paper.contact_number && <span className="text-gray-400 ml-3">| {paper.contact_number}</span>}
          </div>
        )}
      </CollapsibleCard>

      {/* ── Plagiarism Review Panel ── */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Plagiarism Review
        </h2>

        {/* Current status alert */}
        <div className={`rounded-md p-3 text-sm flex items-center gap-2 ${paper.plagiarism_status === "passed" ? "bg-green-50 text-green-700 border border-green-200"
          : paper.plagiarism_status === "flagged" ? "bg-red-50 text-red-700 border border-red-200"
            : paper.plagiarism_status === "checking" ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
          }`}>
          {paper.plagiarism_status === "passed" ? <CheckCircle2 className="h-4 w-4" />
            : paper.plagiarism_status === "flagged" ? <AlertTriangle className="h-4 w-4" />
              : paper.plagiarism_status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Clock className="h-4 w-4" />}
          Current Status: <strong className="ml-1">{paper.plagiarism_status || "pending"}</strong>
        </div>

        {/* Flagged warning */}
        {paper.plagiarism_status === "flagged" && (
          <div className="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-800">
            ⚠ This submission is flagged for plagiarism. Review carefully before acceptance.
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Update Status</label>
            <select
              value={plagiarismStatus}
              onChange={e => setPlagiarismStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="checking">Checking</option>
              <option value="passed">Passed</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              size="sm"
              disabled={plagiarismSaving || plagiarismStatus === paper.plagiarism_status}
              onClick={updatePlagiarismStatus}
            >
              {plagiarismSaving ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving…</>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </div>

        {/* Plagiarism notes (UI-ready for future column) */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Plagiarism Notes (optional)</label>
          <Textarea
            value={plagiarismNote}
            onChange={e => setPlagiarismNote(e.target.value)}
            placeholder="Add notes about the plagiarism review…"
            rows={2}
            className="text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Notes are stored locally and will be saved when the database column is added.</p>
        </div>
      </Card>

      {/* ── Declarations ── */}
      <CollapsibleCard title="Author Declarations" icon={<ShieldCheck className="h-4 w-4" />} id="declarations" expanded={expanded} toggle={toggle}>
        <div className="space-y-1">
          <Declaration ok={paper.declaration_original} text="Original work" />
          <Declaration ok={paper.declaration_no_plagiarism} text="No plagiarism" />
          <Declaration ok={paper.declaration_author_approval} text="Author approvals" />
        </div>
      </CollapsibleCard>

      {/* ── Review History (from reviews table) ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <History className="h-4 w-4" /> Review History
          </h2>
          {reviewHistory.length > 0 && (
            <span className="text-xs text-gray-400">
              Total Rounds: {reviewHistory.length}
              {latestReview && (
                <> | Latest: <ReviewDecisionBadge decision={latestReview.decision} /></>
              )}
            </span>
          )}
        </div>

        {reviewHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-4 text-center">
            <MessageSquare className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No review rounds submitted yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              {paper.reviewer_id
                ? "The assigned reviewer has not submitted any reviews."
                : "No reviewer has been assigned to this paper."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewHistory.map((review, index) => (
              <div key={review.id} className="border rounded-lg overflow-hidden">
                {/* Round header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold">
                      Round {index + 1}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      v{review.revision_number}
                    </Badge>
                    <ReviewDecisionBadge decision={review.decision} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {/* Comments */}
                {review.comments && (
                  <div className="px-4 py-3 border-t">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{review.comments}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy reviewer comment fallback */}
        {paper.review_comment && reviewHistory.length === 0 && (
          <div className="border-t pt-4 mt-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Legacy Reviewer Comment</p>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{paper.review_comment}</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Organizer Decision Notes ── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Organizer Decision Notes</h2>
        <p className="text-xs text-gray-400">These notes are separate from reviewer comments and are for your internal reference.</p>

        {isFinalDecision ? (
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note || "No decision notes added."}</p>
          </div>
        ) : (
          <>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add final decision notes..."
              rows={4}
            />

            {/* Quick note templates */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Accept with minor revisions",
                "Accept for poster presentation",
                "Revise and resubmit",
                "Reject – out of scope",
                "Reject – quality concerns",
              ].map(tpl => (
                <button
                  key={tpl}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                  onClick={() => setNote(prev => prev ? `${prev}\n${tpl}` : tpl)}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Email Status ── */}
      {paper.decision_email_sent && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Mail className="h-4 w-4" />
            Decision email has been sent to all authors.
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await sendDecisionEmails(paper.status);
              } catch { }
              setSubmitting(false);
            }}
          >
            Resend Email
          </Button>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">
              Confirm {confirmAction === "accepted" ? "Accept" : confirmAction === "rejected" ? "Reject" : "Request Revision"}
            </h2>

            <div className="text-sm space-y-2">
              <p><strong>Paper:</strong> {title}</p>
              {reviewHistory.length > 0 && (
                <p><strong>Review Rounds:</strong> {reviewHistory.length}</p>
              )}
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

            {reviewHistory.length === 0 && paper.review_comment === null && confirmAction !== "revision_required" && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                No reviews have been submitted for this paper yet.
              </div>
            )}

            {(confirmAction === "accepted" || confirmAction === "rejected") && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                This is a final decision and will lock further reviewing.
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
            {paper.revision_number > 1 && (
              <>
                <span className="mx-2">·</span>
                <Badge className="bg-purple-100 text-purple-700 text-xs">v{paper.revision_number}</Badge>
              </>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            {isFinalDecision ? (
              <Badge className={paper.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {paper.status === "accepted" ? "Accepted" : "Rejected"} — Locked
              </Badge>
            ) : (
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
                  disabled={submitting}
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

function ReviewDecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    revision_required: { label: "Revision Required", cls: "bg-orange-100 text-orange-700" },
  };
  const d = map[decision] || { label: decision, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={d.cls}>{d.label}</Badge>;
}

function StepPill({ label, done, variant }: { label: string; done: boolean; variant?: "green" | "red" | "orange" | "purple" }) {
  const base = done
    ? variant === "red" ? "bg-red-100 text-red-700 border-red-200"
      : variant === "green" ? "bg-green-100 text-green-700 border-green-200"
        : variant === "orange" ? "bg-orange-100 text-orange-700 border-orange-200"
          : variant === "purple" ? "bg-purple-100 text-purple-700 border-purple-200"
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