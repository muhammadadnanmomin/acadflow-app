"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";
import {
    PRO_SLOT_PRICE,
    PLAN_LABELS,
    normalizePlanType,
    type PlanType,
} from "@/lib/config/pricing";
import { generateReceipt, type ReceiptData } from "@/lib/billing/generateReceipt";
import PaymentSuccessModal from "@/components/payments/PaymentSuccessModal";
import { toast } from "@/components/ui/use-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    Sparkles,
    Loader2,
    Crown,
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function BillingUpgradePage() {
    const router = useRouter();
    const { profile, loading: profileLoading } = useProfile();
    const { organization, loading: orgLoading } = useOrganization();

    const [paying, setPaying] = useState(false);
    const [alreadyPaid, setAlreadyPaid] = useState(false);
    const [successData, setSuccessData] = useState<ReceiptData | null>(null);

    useEffect(() => {
        if (normalizePlanType(organization?.plan_type) === "institutional") {
            setAlreadyPaid(true);
        }
    }, [organization]);

    /* Redirect if no organization */
    useEffect(() => {
        if (!profileLoading && !orgLoading && !organization) {
            router.replace("/dashboard/onboarding/organization");
        }
    }, [profileLoading, orgLoading, organization, router]);

    const SLOT_BENEFITS = [
        "Unlimited paper submissions per conference",
        "Unlocks one additional conference slot",
        "Full conference management workflow",
        "Advanced reviewer management",
        "Submission reports and analytics",
        "Bulk email communication",
        "Priority support",
    ];

    /* ---------------------------------------------------------------- */
    /*  Razorpay Checkout                                                */
    /* ---------------------------------------------------------------- */
    async function handlePayment() {
        if (!profile || !organization) return;

        setPaying(true);

        try {
            /* 1. Create order */
            const res = await fetch("/api/billing/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId: organization.id,
                    userId: profile.id,
                }),
            });

            if (!res.ok) throw new Error("Failed to create order");

            const order = await res.json();

            /* 2. Load Razorpay script */
            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Razorpay script failed"));
                    document.body.appendChild(script);
                });
            }

            /* 3. Open checkout */
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "AcadFlow",
                description: "Conference Slot — Pro Plan",
                order_id: order.id,
                prefill: {
                    email: profile.email || "",
                    name: profile.name || "",
                },
                handler: async (response: any) => {
                    /* 4. Verify */
                    const verifyRes = await fetch("/api/billing/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: order.id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            organizationId: organization.id,
                        }),
                    });

                    if (verifyRes.ok) {
                        /* 5. Build receipt data */
                        const receipt: ReceiptData = {
                            paymentId: response.razorpay_payment_id,
                            orderId: order.id,
                            amount: PRO_SLOT_PRICE,
                            description: "Conference Slot — Pro Plan",
                            payerName: profile.name || "Organizer",
                            payerEmail: profile.email || undefined,
                            paidAt: new Date().toISOString(),
                        };

                        /* 6. Auto-download receipt */
                        generateReceipt(receipt);

                        /* 7. Show success modal */
                        setSuccessData(receipt);
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Payment verification failed",
                            description:
                                "Your payment could not be verified. Please contact support at acadflow.platform@gmail.gmail.com",
                        });
                    }
                },
                theme: { color: "#4f46e5" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment error:", err);
        } finally {
            setPaying(false);
        }
    }

    /* ---------------------------------------------------------------- */
    /*  Loading                                                          */
    /* ---------------------------------------------------------------- */
    if (profileLoading || orgLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    /* ---------------------------------------------------------------- */
    /*  Already upgraded                                                 */
    /* ---------------------------------------------------------------- */
    if (alreadyPaid) {
        const planLabel = PLAN_LABELS[normalizePlanType(organization.plan_type)];
        return (
            <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <ShieldCheck className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                    You&apos;re on the {planLabel} Plan
                </h1>
                <p className="text-gray-600">
                    Your organization already has access to all {planLabel} features.
                    No further upgrade is needed.
                </p>
                <Button onClick={() => router.push("/dashboard/organizer")} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    /* ---------------------------------------------------------------- */
    /*  Upgrade page                                                     */
    /* ---------------------------------------------------------------- */
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">

            {/* Back link */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <Crown className="h-6 w-6 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Buy Conference Slot
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                    Purchase an additional conference slot to create and manage
                    more academic events on AcadFlow.
                </p>
            </div>

            {/* Pro plan card */}
            <Card className="p-8 border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 text-sm px-3 py-1">
                            Pro
                        </Badge>
                        <span className="text-sm text-gray-500">One-time per conference slot</span>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-bold text-gray-900">
                            ₹{PRO_SLOT_PRICE.toLocaleString("en-IN")}
                        </span>
                        <span className="text-gray-500 ml-1">/ slot</span>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <p className="text-sm font-medium text-gray-700 mb-4">
                        Everything in Free, plus:
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {SLOT_BENEFITS.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2.5 text-sm text-gray-600">
                                <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <Button
                    onClick={handlePayment}
                    disabled={paying}
                    className="mt-8 w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 gap-2"
                >
                    {paying ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing…
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5" />
                            Pay ₹{PRO_SLOT_PRICE.toLocaleString("en-IN")} & Buy Slot
                        </>
                    )}
                </Button>

            </Card>

            {/* Trust signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secured by Razorpay
                </span>
                <span>•</span>
                <span>Instant activation after payment</span>
                <span>•</span>
                <span>No recurring charges</span>
            </div>

            {/* Payment Success Modal */}
            {successData && (
                <PaymentSuccessModal
                    open={true}
                    onClose={() => {
                        setSuccessData(null);
                        router.push("/dashboard/organizer");
                    }}
                    receipt={successData}
                    continueLabel="Continue to Dashboard"
                    onContinue={() => {
                        setSuccessData(null);
                        router.push("/dashboard/organizer");
                    }}
                />
            )}
        </div>
    );
}
