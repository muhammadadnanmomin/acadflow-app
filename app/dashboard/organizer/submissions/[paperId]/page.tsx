"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import {
  CheckCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

import { useAICreditPurchase } from "@/lib/hooks/useAICreditPurchase";

// ─── Section Components ─── //
import PaperOverviewCard, { StatusBadge } from "./_components/PaperOverviewCard";
import ProgressTracker from "./_components/ProgressTracker";
import NextStepGuidance from "./_components/NextStepGuidance";
import AIAssistantSection from "./_components/AIAssistantSection";
import ReviewerSection from "./_components/ReviewerSection";
import PaperFilesCard from "./_components/PaperFilesCard";
import AuthorsSection from "./_components/AuthorsSection";
import DecisionNotesSection from "./_components/DecisionNotesSection";
import SimilarityReviewPanel from "./_components/SimilarityReviewPanel";
import EmailStatusBar from "./_components/EmailStatusBar";

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
  const [copied, setCopied] = useState<string | null>(null);

  // Plagiarism management
  const [plagiarismStatus, setPlagiarismStatus] = useState<string>("pending");
  const [plagiarismNote, setPlagiarismNote] = useState("");
  const [plagiarismSaving, setPlagiarismSaving] = useState(false);

  // AI credit purchase integration
  useAICreditPurchase({
    conferenceId: paper?.conference_id ?? null,
    userId: profile?.id ?? null,
    userName: profile?.name ?? undefined,
    userEmail: profile?.email ?? undefined,
  });

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
      toast({ title: `Similarity status updated to "${plagiarismStatus}" ✅` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to update similarity status", description: err?.message });
    } finally {
      setPlagiarismSaving(false);
    }
  }

  /* ─── Smart Assign Handlers ─── */
  async function handleSmartAssign(reviewerId: string) {
    if (String(paper.reviewer_id) === String(reviewerId)) {
      toast({ title: "This reviewer is already assigned", variant: "destructive" });
      return;
    }

    const { error: updateErr } = await supabase
      .from("paper_submissions")
      .update({ reviewer_id: reviewerId })
      .eq("id", paper.id);

    if (updateErr) {
      toast({ title: "Assignment failed", description: updateErr.message, variant: "destructive" });
      return;
    }

    try {
      await fetch("/api/send-reviewer-assigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId,
          conference: paper.conferences?.title,
          paperTitle: paper.title || `Paper #${paper.id.slice(0, 8)}`,
        }),
      });
    } catch (emailErr) {
      console.error("Reviewer assignment email failed:", emailErr);
    }

    toast({ title: "Reviewer assigned ✅", description: "Notification email sent." });
    loadPaper();
  }

  async function handleSmartAssignAll(reviewerIds: string[]) {
    const topId = reviewerIds.find((id) => String(id) !== String(paper.reviewer_id));
    if (!topId) {
      toast({ title: "Top reviewer is already assigned", variant: "destructive" });
      return;
    }

    const { error: updateErr } = await supabase
      .from("paper_submissions")
      .update({ reviewer_id: topId })
      .eq("id", paper.id);

    if (updateErr) {
      toast({ title: "Assignment failed", description: updateErr.message, variant: "destructive" });
      return;
    }

    try {
      await fetch("/api/send-reviewer-assigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerId: topId,
          conference: paper.conferences?.title,
          paperTitle: paper.title || `Paper #${paper.id.slice(0, 8)}`,
        }),
      });
    } catch (emailErr) {
      console.error("Reviewer assignment email failed:", emailErr);
    }

    toast({ title: "Best reviewer assigned ✅", description: "Notification email sent." });
    loadPaper();
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

  const isFinalDecision = paper.status === "accepted" || paper.status === "rejected";
  const title = paper.title || `Paper #${paper.id.slice(0, 8)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-28">

      {/* ── Back Button ── */}
      <Button variant="ghost" size="sm" className="mb-2 text-gray-500" onClick={() => router.push("/dashboard/organizer/submissions")}>
        ← Back to Submissions
      </Button>

      {/* ── 1. Paper Overview ── */}
      <PaperOverviewCard paper={paper} />

      {/* ── 2. Progress Tracker ── */}
      <ProgressTracker paper={paper} reviewCount={reviewHistory.length} />

      {/* ── 3. Next Step Guidance ── */}
      <NextStepGuidance paper={paper} reviewCount={reviewHistory.length} />

      {/* ── 4. AI Assistant Section ── */}
      <div className="bg-gradient-to-br from-purple-50/30 via-indigo-50/20 to-transparent border border-purple-100/60 rounded-xl p-5">
        <AIAssistantSection
          paperId={paperId as string}
          paper={paper}
          onSmartAssign={handleSmartAssign}
          onSmartAssignAll={handleSmartAssignAll}
        />
      </div>

      {/* ── 5. Reviewer Section ── */}
      <ReviewerSection
        reviewer={reviewer}
        reviewHistory={reviewHistory}
        paper={paper}
        onCopyEmail={copyEmail}
        copiedEmail={copied}
      />

      {/* ── 6. Paper Files ── */}
      <PaperFilesCard paper={paper} onUploadCameraReady={uploadCameraReady} />

      {/* ── 7. Authors ── */}
      <AuthorsSection
        authors={authors}
        paper={paper}
        onCopyEmail={copyEmail}
        copiedEmail={copied}
      />

      {/* ── 8. Decision & Notes ── */}
      <DecisionNotesSection
        paper={paper}
        note={note}
        onNoteChange={setNote}
        isFinalDecision={isFinalDecision}
      />

      {/* ── 8b. Similarity Review (separate card) ── */}
      <SimilarityReviewPanel
        paper={paper}
        plagiarismStatus={plagiarismStatus}
        onStatusChange={setPlagiarismStatus}
        onSave={updatePlagiarismStatus}
        saving={plagiarismSaving}
        plagiarismNote={plagiarismNote}
        onNoteChange={setPlagiarismNote}
      />

      {/* ── 8c. Email Status ── */}
      <EmailStatusBar
        paper={paper}
        submitting={submitting}
        onResend={async () => {
          setSubmitting(true);
          try { await sendDecisionEmails(paper.status); } catch {}
          setSubmitting(false);
        }}
      />

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
                Similarity is flagged for this paper.
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
                <Button variant="destructive" size="sm" disabled={submitting} onClick={() => setConfirmAction("rejected")}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button variant="outline" size="sm" disabled={submitting}
                  className="border-orange-300 text-orange-700 hover:bg-orange-400"
                  onClick={() => setConfirmAction("revision_required")}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Revision
                </Button>
                <Button size="sm" disabled={submitting} onClick={() => setConfirmAction("accepted")}>
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