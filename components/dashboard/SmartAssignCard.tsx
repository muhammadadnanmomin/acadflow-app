"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  UserCheck,
  Users,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Zap,
  Crown,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────── */
interface RecommendedReviewer {
  reviewer_id: string;
  score: number;
  reason: string;
  reviewer_name: string;
  reviewer_email: string;
  current_workload: number;
}

interface SmartAssignCardProps {
  submissionId: string;
  /** Called when user clicks "Assign" on a single reviewer */
  onAssign: (reviewerId: string) => Promise<void>;
  /** Called for "Assign All" — receives array of reviewer IDs (top 3) */
  onAssignAll?: (reviewerIds: string[]) => Promise<void>;
  /** Currently assigned reviewer ID (to highlight/disable) */
  currentReviewerId?: string | null;
}

/* ─── Score color helpers ──────────────────────────────────── */
function scoreColor(score: number) {
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" };
  if (score >= 60) return { bar: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" };
  if (score >= 40) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200" };
  return { bar: "bg-red-400", text: "text-red-700", bg: "bg-red-50", ring: "ring-red-200" };
}

function rankBadge(index: number) {
  if (index === 0)
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <Crown className="h-2.5 w-2.5" /> #1
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      #{index + 1}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                            */
/* ═══════════════════════════════════════════════════════════ */
export default function SmartAssignCard({
  submissionId,
  onAssign,
  onAssignAll,
  currentReviewerId,
}: SmartAssignCardProps) {
  const [loading, setLoading] = useState(false);
  const [reviewers, setReviewers] = useState<RecommendedReviewer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assigningAll, setAssigningAll] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  const resultRef = useRef<HTMLDivElement>(null);

  /* ─── Fetch Suggestions ──────────────────────────────────── */
  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    setReviewers([]);
    setAssignedIds(new Set());

    try {
      const res = await fetch("/api/ai/smart-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();

      if (!res.ok && !data.success) {
        if (data.error === "AI_LIMIT_REACHED") {
          setError(`AI analysis limit reached (${data.usage?.used ?? "?"}/${data.usage?.total ?? "?"} used). Upgrade to continue.`);
          return;
        }
        throw new Error(data.error || "Failed to get suggestions");
      }

      if (!data.success) {
        throw new Error(data.error || "No suggestions returned");
      }

      setReviewers(data.reviewers || []);
      setModel(data.model ?? null);
      setSource(data.source ?? null);
      setFallback(data.fallback ?? false);

      // Broadcast usage update
      if (data.usage) {
        window.dispatchEvent(
          new CustomEvent("ai-usage-update", { detail: data.usage })
        );
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Check if reviewer is a duplicate ────────────────────── */
  function isDuplicate(reviewerId: string): boolean {
    return (
      String(currentReviewerId) === String(reviewerId) ||
      assignedIds.has(reviewerId)
    );
  }

  /* ─── Assign Single ──────────────────────────────────────── */
  async function handleAssign(reviewerId: string) {
    // Prevent duplicate assignment
    if (isDuplicate(reviewerId)) return;
    // Prevent concurrent assignments
    if (assigning || assigningAll) return;

    setAssigning(reviewerId);
    try {
      await onAssign(reviewerId);
      setAssignedIds((prev) => new Set(prev).add(reviewerId));
    } catch (err) {
      console.error("Assignment failed:", err);
    } finally {
      setAssigning(null);
    }
  }

  /* ─── Assign All ─────────────────────────────────────────── */
  async function handleAssignAll() {
    if (!onAssignAll || reviewers.length === 0) return;
    // Prevent concurrent assignments
    if (assigning || assigningAll) return;

    // Filter out already-assigned and current reviewer
    const eligibleIds = reviewers
      .slice(0, 3)
      .map((r) => r.reviewer_id)
      .filter((id) => !isDuplicate(id));

    if (eligibleIds.length === 0) return;

    setAssigningAll(true);
    try {
      await onAssignAll(eligibleIds);
      setAssignedIds((prev) => {
        const next = new Set(prev);
        eligibleIds.forEach((id) => next.add(id));
        return next;
      });
    } catch (err) {
      console.error("Assign all failed:", err);
    } finally {
      setAssigningAll(false);
    }
  }

  // Compute whether all top candidates are already assigned
  const allTopAssigned = reviewers
    .slice(0, 3)
    .every((r) => isDuplicate(r.reviewer_id));

  /* ─── Initial State ──────────────────────────────────────── */
  if (reviewers.length === 0 && !loading && !error) {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>🤖 AI Reviewer Suggestions</span>
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-indigo-50/50 to-transparent rounded-lg border border-dashed border-indigo-200/60">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1 text-center max-w-xs">
            Automatically match papers with the most relevant reviewers
          </p>
          <p className="text-xs text-gray-400 mb-4 text-center max-w-xs">
            Analyzes paper content and matches it with reviewer expertise and past assignments
          </p>
          <Button
            onClick={fetchSuggestions}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            ⚡ Smart Assign Reviewers
          </Button>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Uses 1 AI analysis
          </p>
        </div>
      </Card>
    );
  }

  /* ─── Loading State ──────────────────────────────────────── */
  if (loading) {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>🤖 AI Reviewer Suggestions</span>
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-300/40 animate-ping" />
          </div>
          <p className="text-sm text-gray-600 mt-5 font-medium">Finding best reviewers…</p>
          <p className="text-xs text-gray-400 mt-1">Analyzing paper content &amp; reviewer expertise</p>
        </div>
      </Card>
    );
  }

  /* ─── Error State ────────────────────────────────────────── */
  if (error) {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>🤖 AI Reviewer Suggestions</span>
          </h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Suggestion Failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={fetchSuggestions}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  /* ─── Result State ───────────────────────────────────────── */
  return (
    <>
      {/* Keyframes for fade-in animation */}
      <style>{`
        @keyframes smartFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Card className="p-5 space-y-4 overflow-hidden" ref={resultRef}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>🤖 AI Reviewer Suggestions</span>
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-50 text-indigo-600 text-[10px] tracking-wider uppercase border border-indigo-200">
              {reviewers.length} Match{reviewers.length !== 1 ? "es" : ""}
            </Badge>
            <Button
              onClick={fetchSuggestions}
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              disabled={loading}
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Fallback warning */}
        {fallback && (
          <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            AI temporarily unavailable — showing keyword-based suggestions.
          </div>
        )}

        {/* Reviewer List */}
        <div className="space-y-3">
          {reviewers.map((r, index) => {
            const sc = scoreColor(r.score);
            const isCurrentReviewer = currentReviewerId === r.reviewer_id;
            const isAssigned = assignedIds.has(r.reviewer_id);
            const isAssigningThis = assigning === r.reviewer_id;

            return (
              <div
                key={r.reviewer_id}
                className="opacity-0 border rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                style={{
                  animation: `smartFadeIn 0.4s ease-out ${index * 100}ms forwards`,
                  borderColor: isCurrentReviewer ? "#93c5fd" : undefined,
                  backgroundColor: isCurrentReviewer ? "#eff6ff" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Avatar + Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {r.reviewer_name?.charAt(0)?.toUpperCase() || "R"}
                      </div>
                      <div className="absolute -top-1 -right-1">
                        {rankBadge(index)}
                      </div>
                    </div>

                    {/* Name + Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {r.reviewer_name}
                        </p>
                        {isCurrentReviewer && (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                            Currently Assigned
                          </Badge>
                        )}
                      </div>

                      {r.reviewer_email && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{r.reviewer_email}</p>
                      )}

                      {/* Score Bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${sc.bar} transition-all duration-700 ease-out`}
                            style={{ width: `${r.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums w-9 text-right ${sc.text}`}>
                          {r.score}%
                        </span>
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        {r.reason}
                      </p>

                      {/* Workload indicator */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          📋 {r.current_workload} paper{r.current_workload !== 1 ? "s" : ""} assigned
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text} font-medium`}>
                          {r.score >= 80 ? "Excellent match" : r.score >= 60 ? "Good match" : r.score >= 40 ? "Moderate match" : "Low match"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Assign button */}
                  <div className="flex-shrink-0 pt-1">
                    {isAssigned || isCurrentReviewer ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className={`gap-1.5 ${
                          isCurrentReviewer && !isAssigned
                            ? "border-blue-200 text-blue-700 bg-blue-50"
                            : "border-green-200 text-green-700 bg-green-50"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isCurrentReviewer && !isAssigned ? "Current" : "Assigned"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAssign(r.reviewer_id)}
                        disabled={!!assigning || assigningAll}
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isAssigningThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assign All Button */}
        {onAssignAll && reviewers.length > 1 && !allTopAssigned && (
          <div
            className="opacity-0 pt-1"
            style={{ animation: `smartFadeIn 0.4s ease-out ${reviewers.length * 100 + 100}ms forwards` }}
          >
            <Button
              onClick={handleAssignAll}
              disabled={assigningAll || !!assigning || allTopAssigned}
              variant="outline"
              className="w-full gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              {assigningAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {assigningAll
                ? "Assigning..."
                : `Assign Best Reviewer`}
            </Button>
          </div>
        )}

        {/* Footer meta */}
        <div
          className="opacity-0 border-t border-gray-100 pt-3"
          style={{ animation: `smartFadeIn 0.4s ease-out ${reviewers.length * 100 + 200}ms forwards` }}
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              {source === "fallback" ? (
                <><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Keyword-based matching</>
              ) : source === "groq" ? (
                <><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" /> AI-powered via Groq</>
              ) : source === "gemini" ? (
                <><span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" /> AI-powered via Gemini</>
              ) : (
                <>Matched by <span className="font-medium text-gray-500">{model || "AI"}</span></>
              )}
              {model && source !== "fallback" && <span className="text-gray-300">• {model}</span>}
            </span>
            <span>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}
