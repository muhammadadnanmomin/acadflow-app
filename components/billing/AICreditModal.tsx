"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Zap, Brain, CheckCircle2, Loader2 } from "lucide-react";
import { PRO_SLOT_PRICE, AI_CREDIT_PACKS } from "@/lib/config/pricing";

/**
 * Credit add-on prices indexed by credit count.
 * 0 = skip, otherwise pulled from AI_CREDIT_PACKS config.
 */
const CREDIT_OPTIONS = [
  { credits: 0, price: 0, label: "No add-on", perCredit: "" },
  ...AI_CREDIT_PACKS.map((p) => ({
    credits: p.credits,
    price: p.price,
    label: p.label,
    perCredit: `₹${(p.price / p.credits).toFixed(1)}/credit`,
  })),
];

interface AICreditModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedCredits: number) => void;
  paying?: boolean;
}

/**
 * Bundle purchase modal — lets users select an optional AI credit add-on
 * before proceeding to a single combined Razorpay checkout.
 */
export default function AICreditModal({
  open,
  onClose,
  onConfirm,
  paying = false,
}: AICreditModalProps) {
  const [selected, setSelected] = useState(100); // Default to best value

  if (!open) return null;

  const creditOption = CREDIT_OPTIONS.find((o) => o.credits === selected);
  const addOnPrice = creditOption?.price ?? 0;
  const totalAmount = PRO_SLOT_PRICE + addOnPrice;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg overflow-hidden shadow-2xl border-0 animate-in fade-in zoom-in-95 duration-200">
        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            disabled={paying}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Complete Your Purchase</h2>
              <p className="text-white/80 text-sm">
                Add AI credits to supercharge your conference
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">
          {/* AI Credit Options */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold text-gray-800">
                Add AI Credits (optional)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {AI_CREDIT_PACKS.map((pack) => {
                const isSelected = selected === pack.credits;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelected(pack.credits)}
                    disabled={paying}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100/50 ring-1 ring-indigo-600/20"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {pack.id === "ai_100" && (
                      <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Best Value
                      </span>
                    )}

                    {isSelected && (
                      <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-indigo-600" />
                    )}

                    <p className="text-2xl font-bold text-gray-900">
                      +{pack.credits}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">AI Credits</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{pack.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        (₹{(pack.price / pack.credits).toFixed(1)}/credit)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Skip option */}
            <button
              onClick={() => setSelected(0)}
              disabled={paying}
              className={`w-full mt-2 py-2.5 rounded-lg text-sm transition-all ${
                selected === 0
                  ? "bg-gray-100 text-gray-800 font-medium border-2 border-gray-300"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-2 border-transparent"
              }`}
            >
              {selected === 0 && (
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1.5 text-gray-600" />
              )}
              Continue without AI credits
            </button>
          </div>

          {/* ── Order Summary ── */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order Summary
            </p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Pro Slot (1 Conference)
              </span>
              <span className="font-medium text-gray-900">
                ₹{PRO_SLOT_PRICE.toLocaleString("en-IN")}
              </span>
            </div>

            {selected > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-purple-500" />
                  {selected} AI Credits
                </span>
                <span className="font-medium text-gray-900">
                  ₹{addOnPrice.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            {selected > 0 && (
              <p className="text-[11px] text-green-600 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                You save by bundling — credits activated instantly after payment
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="space-y-2">
            <Button
              onClick={() => onConfirm(selected)}
              disabled={paying}
              className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Pay ₹{totalAmount.toLocaleString("en-IN")}
                </>
              )}
            </Button>

            <button
              onClick={onClose}
              disabled={paying}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
