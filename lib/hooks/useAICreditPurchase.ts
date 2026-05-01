"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseAICreditPurchaseOptions {
  conferenceId: string | null;
  userId: string | null;
  userName?: string;
  userEmail?: string;
}

/**
 * Hook that handles the full Razorpay checkout flow for AI credit add-on packs.
 *
 * Flow:
 * 1. Creates a Razorpay order via /api/ai-credits/create-order
 * 2. Opens Razorpay checkout
 * 3. Verifies payment via /api/ai-credits/verify
 * 4. Dispatches ai-usage-update event so the AIUsageBanner updates
 *
 * Listens for `ai-purchase-credits` CustomEvent (fired by AILimitModal buttons).
 */
export function useAICreditPurchase({
  conferenceId,
  userId,
  userName,
  userEmail,
}: UseAICreditPurchaseOptions) {
  const [purchasing, setPurchasing] = useState(false);

  const purchasePack = useCallback(
    async (packId: string) => {
      if (!conferenceId || !userId) {
        toast({
          variant: "destructive",
          title: "Cannot purchase credits",
          description: "Conference or user information missing.",
        });
        return;
      }

      setPurchasing(true);

      try {
        /* 1. Create order */
        const orderRes = await fetch("/api/ai-credits/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conferenceId, packId, userId }),
        });

        if (!orderRes.ok) {
          const err = await orderRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create order");
        }

        const order = await orderRes.json();

        /* 2. Load Razorpay script if needed */
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay"));
            document.body.appendChild(script);
          });
        }

        /* 3. Open Razorpay checkout */
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "AcadFlow",
          description: `AI Credits — ${order.pack?.label || packId}`,
          order_id: order.id,
          prefill: {
            email: userEmail || "",
            name: userName || "",
          },
          handler: async (response: any) => {
            /* 4. Verify payment */
            try {
              const verifyRes = await fetch("/api/ai-credits/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: order.id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  conferenceId,
                  packId,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                /* 5. Update UI */
                toast({
                  title: "🎉 Credits Added!",
                  description: `${verifyData.credits_added} AI credits have been added to your conference.`,
                });

                // Broadcast usage update to AIUsageBanner + cards
                if (verifyData.usage) {
                  window.dispatchEvent(
                    new CustomEvent("ai-usage-update", {
                      detail: verifyData.usage,
                    })
                  );
                }

                // Clear the limit-reached state on all cards
                window.dispatchEvent(new CustomEvent("ai-limit-cleared"));
              } else {
                toast({
                  variant: "destructive",
                  title: "Verification failed",
                  description:
                    "Payment could not be verified. Credits will be added automatically. Contact support if not reflected within 5 minutes.",
                });
              }
            } catch {
              toast({
                variant: "destructive",
                title: "Verification error",
                description:
                  "An error occurred during verification. Your payment is safe — credits will be added via webhook.",
              });
            }
          },
          modal: {
            ondismiss: () => {
              setPurchasing(false);
            },
          },
          theme: { color: "#7c3aed" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err: any) {
        console.error("AI credit purchase error:", err);
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: err.message || "Could not initiate payment. Please try again.",
        });
      } finally {
        setPurchasing(false);
      }
    },
    [conferenceId, userId, userName, userEmail]
  );

  // Listen for purchase events from AILimitModal
  useEffect(() => {
    function handlePurchaseEvent(e: CustomEvent<{ packId: string }>) {
      purchasePack(e.detail.packId);
    }

    window.addEventListener(
      "ai-purchase-credits",
      handlePurchaseEvent as EventListener
    );
    return () =>
      window.removeEventListener(
        "ai-purchase-credits",
        handlePurchaseEvent as EventListener
      );
  }, [purchasePack]);

  return { purchasing, purchasePack };
}
