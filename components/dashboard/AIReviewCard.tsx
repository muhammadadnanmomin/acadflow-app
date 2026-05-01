"use client";

import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Brain,
  FileText,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  PenLine,
  Award,
  BarChart3,
  Wand2,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────── */
interface ReviewResult {
  summary: string;
  key_contributions: string[];
  strengths: string[];
  weaknesses: string[];
  grammar_issues: string[];
  final_decision: string;
  confidence_score: number;
}

interface AIReviewCardProps {
  submissionId: string;
  /** Callback when reviewer clicks "Use AI Decision" — receives mapped decision string */
  onUseDecision?: (decision: "accepted" | "rejected" | "revision_required", summary: string) => void;
  /** When true, hides Regenerate button (e.g., after reviewer already submitted) */
  readOnly?: boolean;
}

/* ─── Decision badge color map ─────────────────────────────── */
function decisionStyle(decision: string) {
  const d = decision.toLowerCase();
  if (d.includes("reject"))
    return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", ring: "ring-red-400/30" };
  if (d.includes("major"))
    return { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", ring: "ring-orange-400/30" };
  if (d.includes("minor"))
    return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", ring: "ring-yellow-400/30" };
  if (d.includes("accept"))
    return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", ring: "ring-green-400/30" };
  return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", ring: "ring-gray-400/30" };
}

/* ─── Confidence bar color ─────────────────────────────────── */
function confidenceColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

/* ─── Section Component ────────────────────────────────────── */
function ReviewSection({
  icon,
  emoji,
  title,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="opacity-0"
      style={{
        animation: `fadeInUp 0.5s ease-out ${delay}ms forwards`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{emoji}</span>
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          {icon}
          {title}
        </h3>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

/* ─── Bullet List ──────────────────────────────────────────── */
function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-gray-400 italic">None identified</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
          <span className="text-gray-300 mt-1 flex-shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                            */
/* ═══════════════════════════════════════════════════════════ */
export default function AIReviewCard({ submissionId, onUseDecision, readOnly }: AIReviewCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  const analyzeePaper = useCallback(
    async (forceRegenerate = false) => {
      if (cooldown) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/review-paper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, forceRegenerate }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze paper");
        }

        setResult(data.review);
        setCached(data.cached ?? false);
        setCachedAt(data.cachedAt ?? null);
        setModel(data.model ?? null);
        setProvider(data.provider ?? null);

        // Cooldown to prevent rate limit abuse (15s)
        if (!data.cached) {
          setCooldown(true);
          setTimeout(() => setCooldown(false), 15_000);
        }

        // Auto-scroll to results
        setTimeout(() => {
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 300);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [submissionId, cooldown]
  );

  /* ─── Initial State ──────────────────────────────────────── */
  if (!result && !loading && !error) {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span>🧠 AI Paper Reviewer Assistant</span>
          </h2>
          <Badge className="bg-purple-50 text-purple-600 text-[10px] tracking-wider uppercase border border-purple-200">
            AI Powered
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-purple-50/50 to-transparent rounded-lg border border-dashed border-purple-200/60">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
            Get AI-powered analysis including summary, strengths, weaknesses, and a
            recommended decision.
          </p>
          <Button
            onClick={() => analyzeePaper(false)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            Analyze Paper
          </Button>
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
            <Brain className="h-4 w-4 text-purple-600" />
            <span>🧠 AI Paper Reviewer Assistant</span>
          </h2>
          <Badge className="bg-purple-50 text-purple-600 text-[10px] tracking-wider uppercase border border-purple-200">
            AI Powered
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-purple-600 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-ping" />
          </div>
          <p className="text-sm text-gray-600 mt-5 font-medium">Analyzing paper with AI…</p>
          <p className="text-xs text-gray-400 mt-1">This may take 15–30 seconds for larger documents</p>
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
            <Brain className="h-4 w-4 text-purple-600" />
            <span>🧠 AI Paper Reviewer Assistant</span>
          </h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Analysis Failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => analyzeePaper(false)}
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
  if (!result) return null;

  const ds = decisionStyle(result.final_decision);
  const score = result.confidence_score;

  return (
    <>
      {/* Keyframes for fade-in animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Card className="p-5 space-y-5 overflow-hidden" ref={resultRef}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span>🧠 AI Paper Reviewer Assistant</span>
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-50 text-purple-600 text-[10px] tracking-wider uppercase border border-purple-200">
              AI Generated
            </Badge>
            {!readOnly && (
              <Button
                onClick={() => analyzeePaper(true)}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            )}
          </div>
        </div>

        {/* Cache indicator */}
        {cached && cachedAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Cached result from {new Date(cachedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span className="text-blue-400 ml-1">• Click Regenerate for a fresh analysis</span>
          </div>
        )}

        {/* Decision + Confidence — top highlight */}
        <div
          className="opacity-0"
          style={{ animation: "fadeInUp 0.5s ease-out 0ms forwards" }}
        >
          <div className={`rounded-lg p-4 ${ds.bg} ${ds.border} border flex flex-col sm:flex-row sm:items-center gap-4`}>
            {/* Decision */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Award className="h-3 w-3" /> 🧾 Final Decision
              </p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${ds.bg} ${ds.text} ring-2 ${ds.ring}`}>
                {result.final_decision}
              </span>
            </div>

            {/* Confidence Score */}
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> 📊 Confidence Score
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/60 rounded-full h-3 overflow-hidden border border-gray-200/50">
                  <div
                    className={`h-full rounded-full ${confidenceColor(score)} transition-all duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 tabular-nums w-10 text-right">
                  {score}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Summary */}
        <ReviewSection
          icon={<FileText className="h-3.5 w-3.5 text-blue-500" />}
          emoji="📄"
          title="Summary"
          delay={100}
        >
          <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
        </ReviewSection>

        {/* Key Contributions */}
        <ReviewSection
          icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
          emoji="💡"
          title="Key Contributions"
          delay={200}
        >
          <BulletList items={result.key_contributions} />
        </ReviewSection>

        {/* Strengths */}
        <ReviewSection
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          emoji="✅"
          title="Strengths"
          delay={300}
        >
          <BulletList items={result.strengths} />
        </ReviewSection>

        {/* Weaknesses */}
        <ReviewSection
          icon={<AlertCircle className="h-3.5 w-3.5 text-orange-500" />}
          emoji="⚠️"
          title="Weaknesses"
          delay={400}
        >
          <BulletList items={result.weaknesses} />
        </ReviewSection>

        {/* Grammar Issues */}
        <ReviewSection
          icon={<PenLine className="h-3.5 w-3.5 text-violet-500" />}
          emoji="✍️"
          title="Grammar Issues"
          delay={500}
        >
          <BulletList items={result.grammar_issues} />
        </ReviewSection>

        {/* Use AI Decision button (reviewer mode) */}
        {onUseDecision && result.final_decision && !readOnly && (
          <div
            className="opacity-0"
            style={{ animation: "fadeInUp 0.5s ease-out 550ms forwards" }}
          >
            <Button
              onClick={() => {
                const d = result.final_decision.toLowerCase();
                const mapped: "accepted" | "rejected" | "revision_required" =
                  d.includes("reject") ? "rejected"
                  : d.includes("major") || d.includes("minor") || d.includes("revision") ? "revision_required"
                  : "accepted";
                const summary = `[AI-assisted] ${result.final_decision} (${result.confidence_score}% confidence)\n\nStrengths:\n${(result.strengths || []).map(s => `- ${s}`).join("\n")}\n\nWeaknesses:\n${(result.weaknesses || []).map(w => `- ${w}`).join("\n")}`;
                onUseDecision(mapped, summary);
              }}
              variant="outline"
              size="sm"
              className="w-full gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Use AI Decision — Prefill "{result.final_decision}"
            </Button>
          </div>
        )}

        {/* Footer meta */}
        <div
          className="opacity-0 border-t border-gray-100 pt-3"
          style={{ animation: "fadeInUp 0.5s ease-out 600ms forwards" }}
        >
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              {cached ? (
                <><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" /> Using cached result ⚡</>
              ) : provider === "groq" ? (
                <><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" /> Powered by Groq AI</>
              ) : provider === "gemini" ? (
                <><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Fallback: Gemini</>
              ) : (
                <>Generated by <span className="font-medium text-gray-500">{model || "AI"}</span></>
              )}
              {model && <span className="text-gray-300">• {model}</span>}
            </span>
            <span>{new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
        </div>
      </Card>
    </>
  );
}
