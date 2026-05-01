"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AILimitModal from "@/components/dashboard/AILimitModal";
import {
  Loader2,
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Brain,
  Flag,
  Info,
  CheckCircle2,
  BarChart3,
  FileWarning,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────── */
interface SuspiciousSection {
  text: string;
  reason: string;
}

interface StructuralAnalysis {
  score: number;
  repetition_ratio: number;
  vocabulary_diversity: number;
  avg_chunk_similarity: number;
  template_phrase_count: number;
}

interface PlagiarismResult {
  risk_score: number;
  risk_level: "Low" | "Medium" | "High";
  actionable_message: string;
  suspicious_sections: SuspiciousSection[];
  insights: string;
  writing_quality: string;
  structural_analysis: StructuralAnalysis;
  llm_score: number;
}

interface PlagiarismRiskCardProps {
  submissionId: string;
}

/* ─── Risk color helpers ───────────────────────────────────── */
function riskColors(level: string) {
  if (level === "High")
    return {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-200",
      bar: "bg-gradient-to-r from-red-400 to-red-600",
      ring: "ring-red-400/30",
      glow: "shadow-red-200/50",
      lightBg: "bg-red-50",
    };
  if (level === "Medium")
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      bar: "bg-gradient-to-r from-amber-400 to-amber-600",
      ring: "ring-amber-400/30",
      glow: "shadow-amber-200/50",
      lightBg: "bg-amber-50",
    };
  return {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    bar: "bg-gradient-to-r from-green-400 to-green-600",
    ring: "ring-green-400/30",
    glow: "shadow-green-200/50",
    lightBg: "bg-green-50",
  };
}

function riskIcon(level: string) {
  if (level === "High") return <FileWarning className="h-5 w-5 text-red-600" />;
  if (level === "Medium") return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  return <CheckCircle2 className="h-5 w-5 text-green-600" />;
}

/* ─── Animated Section ─────────────────────────────────────── */
function FadeInSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="opacity-0"
      style={{
        animation: `plagiarismFadeInUp 0.5s ease-out ${delay}ms forwards`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Full Report Modal ────────────────────────────────────── */
function FullReportModal({
  result,
  model,
  onClose,
}: {
  result: PlagiarismResult;
  model: string | null;
  onClose: () => void;
}) {
  const rc = riskColors(result.risk_level);
  const sa = result.structural_analysis;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-600" />
            Full Similarity Report
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Score Overview */}
        <div className={`rounded-lg p-4 ${rc.lightBg} ${rc.border} border`}>
          <div className="flex items-center gap-3 mb-3">
            {riskIcon(result.risk_level)}
            <div>
              <p className="font-semibold text-gray-800">
                Risk Score: {result.risk_score}/100 — {result.risk_level} Risk
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{result.actionable_message}</p>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white/60 rounded-md p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Structural Score</p>
              <p className="text-lg font-bold text-gray-700">{sa.score}/100</p>
            </div>
            <div className="bg-white/60 rounded-md p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">AI Semantic Score</p>
              <p className="text-lg font-bold text-gray-700">{result.llm_score}/100</p>
            </div>
          </div>
        </div>

        {/* Structural Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            📊 Structural Analysis Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Repetition Ratio"
              value={`${Math.round(sa.repetition_ratio * 100)}%`}
              description="Trigram patterns appearing 3+ times"
            />
            <MetricCard
              label="Vocabulary Diversity"
              value={`${Math.round(sa.vocabulary_diversity * 100)}%`}
              description="Normalized type-token ratio"
            />
            <MetricCard
              label="Chunk Similarity"
              value={`${Math.round(sa.avg_chunk_similarity * 100)}%`}
              description="Average inter-section similarity"
            />
            <MetricCard
              label="Template Phrases"
              value={`${sa.template_phrase_count}`}
              description="Common academic template matches"
            />
          </div>
        </div>

        {/* Suspicious Sections */}
        {result.suspicious_sections.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-500" />
              🚩 Flagged Sections
            </h3>
            <div className="space-y-2">
              {result.suspicious_sections.map((section, i) => (
                <div
                  key={i}
                  className="border border-red-100 bg-red-50/50 rounded-lg p-3"
                >
                  <p className="text-sm text-gray-700 italic border-l-2 border-red-300 pl-3">
                    &ldquo;{section.text}&rdquo;
                  </p>
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    {section.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            🧠 AI Insights
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{result.insights}</p>
          {result.writing_quality && (
            <p className="text-sm text-gray-500 mt-2 italic">{result.writing_quality}</p>
          )}
        </div>

        {/* Disclaimer + Meta */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="h-3 w-3" />
            AI-based similarity detection. Not a definitive plagiarism check. Results are
            indicative and should be reviewed by a human.
          </p>
          <p className="text-xs text-gray-400">
            Model: {model || "AI"} | Hybrid scoring: 50% structural + 50% semantic
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Metric Card (for full report) ────────────────────────── */
function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-gray-700 mt-0.5">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                            */
/* ═══════════════════════════════════════════════════════════ */
export default function PlagiarismRiskCard({ submissionId }: PlagiarismRiskCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownMsg, setCooldownMsg] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [limitUsage, setLimitUsage] = useState<{ used: number; total: number } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Listen for limit events from other AI cards
  useEffect(() => {
    function handleLimitEvent(e: CustomEvent<{ used: number; total: number }>) {
      setLimitReached(true);
      setLimitUsage(e.detail);
    }
    function handleLimitCleared() {
      setLimitReached(false);
      setLimitUsage(null);
      setShowLimitModal(false);
    }
    window.addEventListener("ai-limit-reached", handleLimitEvent as EventListener);
    window.addEventListener("ai-limit-cleared", handleLimitCleared);
    return () => {
      window.removeEventListener("ai-limit-reached", handleLimitEvent as EventListener);
      window.removeEventListener("ai-limit-cleared", handleLimitCleared);
    };
  }, []);

  const analyzeSimilarity = useCallback(
    async (forceRegenerate = false) => {
      if (cooldown && forceRegenerate) return;
      setLoading(true);
      setError(null);
      setCooldownMsg(null);

      try {
        const res = await fetch("/api/plagiarism-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, forceRegenerate }),
        });

        const data = await res.json();

        // Server-side cooldown
        if (data.cooldown) {
          setCooldownMsg(data.message || "Please wait before re-analyzing.");
          setCooldown(true);
          setTimeout(() => { setCooldown(false); setCooldownMsg(null); }, (data.waitSeconds || 15) * 1000);
          return;
        }

        if (!res.ok && !data.success) {
          // Detect AI limit reached
          if (data.error === "AI_LIMIT_REACHED") {
            setLimitReached(true);
            setLimitUsage(data.usage ?? null);
            setShowLimitModal(true);
            // Notify other AI cards on the page
            window.dispatchEvent(
              new CustomEvent("ai-limit-reached", { detail: data.usage })
            );
            return;
          }
          throw new Error(data.error || "Failed to analyze paper");
        }

        setResult(data.result);
        setCached(data.cached ?? false);
        setCachedAt(data.cachedAt ?? null);
        setModel(data.model ?? null);
        setSource(data.source ?? null);
        setFallback(data.fallback ?? false);

        // Broadcast usage update so AIUsageBanner stays in sync
        if (data.usage) {
          window.dispatchEvent(
            new CustomEvent("ai-usage-update", { detail: data.usage })
          );
        }

        if (!data.cached) {
          setCooldown(true);
          setTimeout(() => setCooldown(false), 15_000);
        }

        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>🔍 AI Plagiarism Risk Detector</span>
          </h2>
          <Badge className="bg-indigo-50 text-indigo-600 text-[10px] tracking-wider uppercase border border-indigo-200">
            AI Powered
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-indigo-50/50 to-transparent rounded-lg border border-dashed border-indigo-200/60">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-indigo-600" />
          </div>

          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Plagiarism: <span className="text-amber-600">Pending</span>
            </p>
            <p className="text-xs text-gray-500 max-w-xs">
              Analyze similarity patterns, repetitive phrasing, and generic content using AI-powered detection.
            </p>
          </div>

          <Button
            onClick={() => limitReached ? setShowLimitModal(true) : analyzeSimilarity(false)}
            className={limitReached
              ? "bg-gray-400 hover:bg-gray-400 text-white gap-2 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white gap-2"}
            size="sm"
            disabled={limitReached}
          >
            <Search className="h-4 w-4" />
            {limitReached ? "Credits Exhausted" : "Analyze Similarity"}
          </Button>

          <p className="text-[10px] text-gray-400 mt-3 text-center max-w-[280px]">
            AI-based similarity detection. Not a definitive plagiarism check.
          </p>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            ⚡ Uses 1 AI credit
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
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>🔍 AI Plagiarism Risk Detector</span>
          </h2>
          <Badge className="bg-indigo-50 text-indigo-600 text-[10px] tracking-wider uppercase border border-indigo-200">
            Analyzing
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-indigo-300/40 animate-ping" />
          </div>
          <p className="text-sm text-gray-600 mt-5 font-medium">
            Analyzing similarity patterns…
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Running structural analysis + AI semantic detection
          </p>
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
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>🔍 AI Plagiarism Risk Detector</span>
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
            onClick={() => analyzeSimilarity(false)}
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

  const rc = riskColors(result.risk_level);

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes plagiarismFadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes plagiarismBarGrow {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
      `}</style>

      <Card className="p-5 space-y-5 overflow-hidden" ref={resultRef}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>🔍 AI Plagiarism Risk Detector</span>
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-50 text-indigo-600 text-[10px] tracking-wider uppercase border border-indigo-200">
              AI Generated
            </Badge>
            <Button
              onClick={() => analyzeSimilarity(true)}
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              disabled={loading || cooldown}
            >
              <RefreshCw className="h-3 w-3" />
              {cooldown ? "Wait…" : "Re-analyze"}
            </Button>
          </div>
        </div>

        {/* Cache indicator */}
        {cached && cachedAt && (
          <FadeInSection>
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cached result from{" "}
              {new Date(cachedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              <span className="text-blue-400 ml-1">
                • Click Re-analyze for a fresh analysis
              </span>
            </div>
          </FadeInSection>
        )}

        {/* ── Risk Score + Progress Bar ────────────────────── */}
        <FadeInSection delay={0}>
          <div className={`rounded-lg p-4 ${rc.lightBg} ${rc.border} border`}>
            <div className="flex items-center gap-2 mb-3">
              {riskIcon(result.risk_level)}
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  📊 Risk Score
                </p>
              </div>
              <Badge className={`${rc.bg} ${rc.text} ring-2 ${rc.ring} font-semibold`}>
                {result.risk_level} Risk
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/60 rounded-full h-4 overflow-hidden border border-gray-200/50 shadow-inner">
                <div
                  className={`h-full rounded-full ${rc.bar} shadow-sm`}
                  style={{
                    width: `${result.risk_score}%`,
                    transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <span className="text-lg font-bold text-gray-700 tabular-nums w-14 text-right">
                {result.risk_score}%
              </span>
            </div>

            {/* Score breakdown mini */}
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>
                Structural: <strong>{result.structural_analysis.score}</strong>/100
              </span>
              <span>
                Semantic: <strong>{result.llm_score}</strong>/100
              </span>
            </div>
          </div>
        </FadeInSection>

        {/* ── Actionable Message ───────────────────────────── */}
        <FadeInSection delay={150}>
          <div className={`rounded-md p-3 text-sm ${rc.lightBg} ${rc.border} border flex items-start gap-2`}>
            <Info className={`h-4 w-4 flex-shrink-0 mt-0.5 ${rc.text}`} />
            <p className={`${rc.text} font-medium`}>{result.actionable_message}</p>
          </div>
        </FadeInSection>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* ── Suspicious Sections ──────────────────────────── */}
        {result.suspicious_sections.length > 0 && (
          <FadeInSection delay={300}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🚩</span>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-red-500" />
                  Suspicious Sections
                </h3>
                <Badge className="bg-gray-100 text-gray-500 text-[10px]">
                  {result.suspicious_sections.length}
                </Badge>
              </div>

              <div className="space-y-2.5 pl-7">
                {result.suspicious_sections.map((section, i) => (
                  <div
                    key={i}
                    className="border border-red-100 bg-red-50/30 rounded-lg p-3 opacity-0"
                    style={{
                      animation: `plagiarismFadeInUp 0.4s ease-out ${350 + i * 80}ms forwards`,
                    }}
                  >
                    <p className="text-sm text-gray-700 italic border-l-2 border-red-300 pl-3 leading-relaxed">
                      &ldquo;{section.text}&rdquo;
                    </p>
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      {section.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        )}

        {/* ── AI Insights ──────────────────────────────────── */}
        <FadeInSection delay={500}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🧠</span>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-purple-500" />
                AI Insights
              </h3>
            </div>
            <div className="pl-7">
              <p className="text-sm text-gray-600 leading-relaxed">{result.insights}</p>
              {result.writing_quality && (
                <p className="text-sm text-gray-500 mt-2 italic">{result.writing_quality}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                This section shows similarity patterns often found in reused or templated content.
              </p>
            </div>
          </div>
        </FadeInSection>

        {/* ── Actions ──────────────────────────────────────── */}
        <FadeInSection delay={600}>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={() => analyzeSimilarity(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={loading || cooldown}
            >
              <RefreshCw className="h-3 w-3" />
              {cooldown ? "Wait…" : "Re-analyze"}
            </Button>
            <Button
              onClick={() => setShowFullReport(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Eye className="h-3 w-3" />
              View Full Report
            </Button>
          </div>
        </FadeInSection>

        {/* ── Footer ───────────────────────────────────────── */}
        <FadeInSection delay={700}>
          <div className="border-t border-gray-100 pt-3 space-y-1">
            {/* Fallback banner */}
            {fallback && (
              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                ⚠️ Structural analysis only — AI providers unavailable
              </div>
            )}

            {/* Cooldown message */}
            {cooldownMsg && (
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-600 flex items-center gap-1.5 mb-2">
                ⏳ {cooldownMsg}
              </div>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              AI-based similarity detection. Not a definitive plagiarism check.
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                {source === "cache" ? (
                  <><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" /> Using cached result ⚡</>
                ) : source === "fallback" ? (
                  <><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Structural fallback</>
                ) : source === "groq" ? (
                  <><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" /> Powered by Groq AI</>
                ) : source === "gemini" ? (
                  <><span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" /> Powered by Gemini</>
                ) : source === "ollama" ? (
                  <><span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" /> Local AI (Ollama)</>
                ) : (
                  <>Generated by <span className="font-medium text-gray-500">{model || "AI"}</span></>
                )}
                <span className="text-gray-300">•</span>
                {fallback ? "100% structural" : "Hybrid scoring (50% structural + 50% semantic)"}
              </span>
              <span>
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </FadeInSection>
      </Card>

      {/* Full Report Modal */}
      {showFullReport && (
        <FullReportModal
          result={result}
          model={model}
          onClose={() => setShowFullReport(false)}
        />
      )}

      {/* AI Limit Modal */}
      {showLimitModal && (
        <AILimitModal
          onClose={() => setShowLimitModal(false)}
          used={limitUsage?.used}
          total={limitUsage?.total}
        />
      )}
    </>
  );
}
