"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { EARLY_ADOPTER_SLOT_PRICE } from "@/lib/config/pricing";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    /** Custom title override */
    title?: string;
    /** Custom description override */
    description?: string;
    organizationId: string;
    userId: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UpgradeModal({
    open,
    onClose,
    title = "Buy Conference Slot",
    description = "Purchase an additional conference slot to create and manage more academic events on AcadFlow.",
    organizationId,
    userId,
}: UpgradeModalProps) {
    const [loading, setLoading] = useState(false);

    const SLOT_BENEFITS = [
        "Unlocks one additional conference",
        "Unlimited paper submissions",
        "Full organizer dashboard access",
        "Priority support",
    ];

    /* -------------------------------------------------------------- */
    /*  Razorpay checkout                                              */
    /* -------------------------------------------------------------- */
    async function handleUpgrade() {
        setLoading(true);

        try {
            /* 1. Create Razorpay order */
            const res = await fetch("/api/billing/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organizationId, userId }),
            });

            if (!res.ok) {
                throw new Error("Failed to create order");
            }

            const order = await res.json();

            /* 2. Load Razorpay script if not loaded */
            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Razorpay script failed"));
                    document.body.appendChild(script);
                });
            }

            /* 3. Open Razorpay checkout */
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "AcadFlow",
                description: "Conference Slot — Early Adopter",
                order_id: order.id,
                handler: async (response: any) => {
                    /* 4. Verify payment */
                    const verifyRes = await fetch("/api/billing/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: order.id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            organizationId,
                        }),
                    });

                    if (verifyRes.ok) {
                        window.location.reload();
                    }
                },
                theme: { color: "#4f46e5" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Upgrade error:", err);
        } finally {
            setLoading(false);
        }
    }

    /* -------------------------------------------------------------- */
    /*  Render                                                         */
    /* -------------------------------------------------------------- */
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                        </div>
                        <DialogTitle className="text-xl">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* Slot benefits */}
                <div className="rounded-lg border bg-indigo-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">
                            Early Adopter
                        </Badge>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900">
                                ₹{EARLY_ADOPTER_SLOT_PRICE.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm text-gray-500"> / slot</span>
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {SLOT_BENEFITS.map((benefit) => (
                            <li key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                                <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Maybe Later
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing…
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Buy Slot — ₹{EARLY_ADOPTER_SLOT_PRICE.toLocaleString("en-IN")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
