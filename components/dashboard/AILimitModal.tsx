"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, Crown, X } from "lucide-react";

interface AILimitModalProps {
  onClose: () => void;
  used?: number;
  total?: number;
}

/**
 * Premium modal shown when AI analyses are exhausted.
 * Drives users to purchase add-ons or upgrade their plan.
 */
export default function AILimitModal({ onClose, used, total }: AILimitModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md overflow-hidden shadow-2xl border-0">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 px-6 py-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Limit Reached</h2>
              <p className="text-white/80 text-sm">Analyses exhausted</p>
            </div>
          </div>

          {used !== undefined && total !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-white/80">Usage</span>
                <span className="font-bold">{used} / {total}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: "100%" }} />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            You&apos;ve used all AI analyses for this conference. Purchase
            additional analyses or upgrade your plan to continue using AI-powered
            paper reviews and similarity detection.
          </p>

          {/* Credit packs */}
          <div className="space-y-2">
            <Button
              onClick={() => {
                // TODO: Integrate with Razorpay checkout for ai_100 pack
                window.dispatchEvent(
                  new CustomEvent("ai-purchase-credits", { detail: { packId: "ai_100" } })
                );
                onClose();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 h-11 shadow-lg shadow-purple-200/50"
            >
              <Sparkles className="h-4 w-4" />
              Buy 100 Analyses — ₹499
            </Button>

            <Button
              onClick={() => {
                window.location.href = "/dashboard/organizer/billing";
              }}
              variant="outline"
              className="w-full gap-2 h-10 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro — 100 Analyses Included
            </Button>
          </div>

          {/* Small pack option */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("ai-purchase-credits", { detail: { packId: "ai_50" } })
              );
              onClose();
            }}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Or buy 50 analyses for ₹299 →
          </button>
        </div>
      </Card>
    </div>
  );
}
