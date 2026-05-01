"use client";

import { useEffect, useState } from "react";
import { Brain, Zap } from "lucide-react";

interface AIUsageBannerProps {
  conferenceId: string;
}

/**
 * Displays AI credit usage with an animated progress bar.
 * Fetches usage from the API or accepts usage from AI card responses.
 */
export default function AIUsageBanner({ conferenceId }: AIUsageBannerProps) {
  const [used, setUsed] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conferenceId) return;

    async function fetchUsage() {
      try {
        const res = await fetch("/api/ai-credits/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conferenceId }),
        });
        const data = await res.json();
        if (data.usage) {
          setUsed(data.usage.used);
          setTotal(data.usage.total);
        }
      } catch {
        // Silently fail — banner just won't show
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();

    // Listen for usage updates from AI card responses
    function handleUsageUpdate(e: CustomEvent<{ used: number; total: number }>) {
      setUsed(e.detail.used);
      setTotal(e.detail.total);
    }

    window.addEventListener("ai-usage-update", handleUsageUpdate as EventListener);
    return () => window.removeEventListener("ai-usage-update", handleUsageUpdate as EventListener);
  }, [conferenceId]);

  if (loading || used === null || total === null) return null;

  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const remaining = total - used;

  // Color thresholds: green <70%, yellow 70-90%, red >90%
  const barColor =
    percentage > 90
      ? "bg-gradient-to-r from-red-400 to-red-600"
      : percentage > 70
        ? "bg-gradient-to-r from-amber-400 to-amber-500"
        : "bg-gradient-to-r from-emerald-400 to-emerald-600";

  const textColor =
    percentage > 90
      ? "text-red-700"
      : percentage > 70
        ? "text-amber-700"
        : "text-emerald-700";

  const bgColor =
    percentage > 90
      ? "bg-red-50 border-red-200"
      : percentage > 70
        ? "bg-amber-50 border-amber-200"
        : "bg-emerald-50 border-emerald-200";

  const glowColor =
    percentage > 90
      ? "shadow-red-200/40"
      : percentage > 70
        ? "shadow-amber-200/40"
        : "shadow-emerald-200/40";

  return (
    <div
      className={`rounded-xl border p-4 ${bgColor} shadow-sm ${glowColor} transition-all duration-500`}
      id="ai-usage-banner"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${percentage > 90 ? "bg-red-100" : percentage > 70 ? "bg-amber-100" : "bg-emerald-100"}`}>
            <Brain className={`h-4 w-4 ${textColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              🧠 AI Usage
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold tabular-nums ${textColor}`}>
            {used} / {total}
          </span>
          {remaining <= 2 && remaining > 0 && (
            <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full animate-pulse">
              {remaining} left
            </span>
          )}
          {remaining === 0 && (
            <span className="text-[10px] font-medium text-red-700 bg-red-200 px-1.5 py-0.5 rounded-full">
              Exhausted
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden border border-gray-200/50 shadow-inner">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-gray-500 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          {remaining > 0
            ? `${remaining} analysis${remaining !== 1 ? "es" : ""} remaining`
            : "Purchase add-on credits to continue"}
        </p>
        <p className="text-[11px] text-gray-400">{percentage}% used</p>
      </div>
    </div>
  );
}
