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
    AI_CREDIT_PACKS,
    getAICreditPack,
} from "@/lib/config/pricing";
import { generateReceipt, type ReceiptData } from "@/lib/billing/generateReceipt";
import PaymentSuccessModal from "@/components/payments/PaymentSuccessModal";
import AICreditModal from "@/components/billing/AICreditModal";
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
    Download,
    Receipt,
    CreditCard,
    Clock,
    Zap,
    Package,
} from "lucide-react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SlotPurchase {
    id: string;
    payment_id: string;
    order_id: string;
    amount: number;
    description: string;
    created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function OrganizerBillingPage() {
    const router = useRouter();
    const { profile, loading: profileLoading } = useProfile();
    const { organization, loading: orgLoading } = useOrganization();

    const [paying, setPaying] = useState(false);
    const [alreadyPaid, setAlreadyPaid] = useState(false);
    const [successData, setSuccessData] = useState<ReceiptData | null>(null);

    /* Billing history */
    const [purchases, setPurchases] = useState<SlotPurchase[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    /* AI state (for credit purchase card) */
    const [aiConferences, setAiConferences] = useState<{ id: string; title: string }[]>([]);
    const [selectedConference, setSelectedConference] = useState<string | null>(null);
    const [buyingCredits, setBuyingCredits] = useState(false);
    const [openBundleModal, setOpenBundleModal] = useState(false);

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

    /* Load billing history */
    useEffect(() => {
        async function loadHistory() {
            if (!organization?.id) return;
            setHistoryLoading(true);

            const { data } = await supabase
                .from("organizer_slot_purchases")
                .select("*")
                .eq("organization_id", organization.id)
                .order("created_at", { ascending: false });

            setPurchases(data || []);
            setHistoryLoading(false);
        }

        loadHistory();
    }, [organization?.id]);

    /* Load conferences for AI credit purchase card */
    useEffect(() => {
        async function loadConferences() {
            if (!organization?.id) return;

            const { data: confs } = await supabase
                .from("conferences")
                .select("id, title")
                .eq("organization_id", organization.id)
                .order("created_at", { ascending: false });

            const conferences = confs || [];
            setAiConferences(conferences);

            if (conferences.length > 0) {
                setSelectedConference(conferences[0].id);
            }
        }

        loadConferences();
    }, [organization?.id]);



    const SLOT_BENEFITS = [
        "Unlimited paper submissions per conference",
        "Unlocks one additional conference slot",
        "100 AI-powered analyses included",
        "Full conference management workflow",
        "Advanced reviewer management",
        "Submission reports and analytics",
        "Bulk email communication",
        "Priority support",
    ];

    /* ---------------------------------------------------------------- */
    /*  Razorpay Checkout                                                */
    /* ---------------------------------------------------------------- */
    async function handlePayment(selectedCredits: number = 0) {
        if (!profile || !organization) return;

        setOpenBundleModal(false);
        setPaying(true);

        // Calculate add-on price
        const addOnPrice = selectedCredits === 50 ? 299 : selectedCredits === 100 ? 499 : 0;
        const totalAmount = PRO_SLOT_PRICE + addOnPrice;

        try {
            /* 1. Create order */
            const res = await fetch("/api/billing/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId: organization.id,
                    userId: profile.id,
                    credits: selectedCredits,
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
                description: selectedCredits > 0
                    ? `Pro Plan + ${selectedCredits} AI Credits`
                    : "Pro Plan + 100 AI Analyses",
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
                            credits: selectedCredits,
                            addOnPrice,
                        }),
                    });

                    if (verifyRes.ok) {
                        /* 5. Build receipt data */
                        const receipt: ReceiptData = {
                            paymentId: response.razorpay_payment_id,
                            orderId: order.id,
                            amount: totalAmount,
                            description: selectedCredits > 0
                                ? `Pro Plan + ${selectedCredits} AI Credits`
                                : "Pro Plan + 100 AI Analyses",
                            payerName: profile.name || "Organizer",
                            payerEmail: profile.email || undefined,
                            paidAt: new Date().toISOString(),
                        };

                        /* 6. Auto-download receipt */
                        generateReceipt(receipt);

                        /* 7. Show success modal */
                        setSuccessData(receipt);

                        /* 8. Reload billing history */
                        const { data } = await supabase
                            .from("organizer_slot_purchases")
                            .select("*")
                            .eq("organization_id", organization.id)
                            .order("created_at", { ascending: false });
                        setPurchases(data || []);
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Payment verification failed",
                            description:
                                "Your payment could not be verified. Please contact support at acadflow.platform@gmail.com",
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
    /*  AI Credit Purchase (Razorpay)                                    */
    /* ---------------------------------------------------------------- */
    async function handleBuyCredits(packId: string) {
        if (!profile || !selectedConference) {
            toast({
                variant: "destructive",
                title: "Cannot purchase credits",
                description: "Please select a conference first.",
            });
            return;
        }

        const pack = getAICreditPack(packId);
        if (!pack) return;

        setBuyingCredits(true);

        try {
            /* 1. Create order */
            const res = await fetch("/api/ai-credits/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conferenceId: selectedConference,
                    packId,
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
                description: `AI Credits — ${pack.label}`,
                order_id: order.id,
                prefill: {
                    email: profile.email || "",
                    name: profile.name || "",
                },
                handler: async (response: any) => {
                    /* 4. Verify */
                    const verifyRes = await fetch("/api/ai-credits/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: order.id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            conferenceId: selectedConference,
                            packId,
                        }),
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyRes.ok && verifyData.success) {
                        toast({
                            title: "🎉 Credits Added!",
                            description: `${pack.credits} AI credits have been added.`,
                        });
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Verification failed",
                            description:
                                "Credits will be added automatically. Contact support if not reflected within 5 minutes.",
                        });
                    }
                },
                modal: {
                    ondismiss: () => setBuyingCredits(false),
                },
                theme: { color: "#7c3aed" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("AI credit purchase error:", err);
            toast({
                variant: "destructive",
                title: "Payment failed",
                description: "Could not initiate payment. Please try again.",
            });
        } finally {
            setBuyingCredits(false);
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
    /*  Already on Institutional                                        */
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
    /*  Billing Page                                                     */
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

            <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <Crown className="h-6 w-6 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Billing
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                    Manage your conference billing and AI usage.
                </p>
            </div>



            {/* ============================================================ */}
            {/*  AI Credit Purchase Card                                      */}
            {/* ============================================================ */}
            {selectedConference && (
                <Card className="p-6 border-green-200 bg-gradient-to-b from-green-50/50 to-white shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">⚡ Buy AI Credits</h3>
                            <p className="text-xs text-gray-500">
                                Top up your AI analyses instantly
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {AI_CREDIT_PACKS.map((pack) => (
                            <button
                                key={pack.id}
                                onClick={() => handleBuyCredits(pack.id)}
                                disabled={buyingCredits}
                                className={`relative group rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                                    pack.id === "ai_100"
                                        ? "border-indigo-300 bg-indigo-50/50 hover:border-indigo-400"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                            >
                                {pack.id === "ai_100" && (
                                    <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                        Best Value
                                    </span>
                                )}
                                <p className="text-2xl font-bold text-gray-900">+{pack.credits}</p>
                                <p className="text-xs text-gray-500 mt-0.5">AI Credits</p>
                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-gray-900">
                                        ₹{pack.price.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        (₹{(pack.price / pack.credits).toFixed(1)}/credit)
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
                        <Zap className="h-3 w-3" />
                        Each AI analysis (paper review or plagiarism check) uses 1 credit
                    </p>
                </Card>
            )}



            {/* ============================================================ */}
            {/*  Slot Purchase Card                                          */}
            {/* ============================================================ */}
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
                    onClick={() => setOpenBundleModal(true)}
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

            {/* ============================================================ */}
            {/*  Billing History                                             */}
            {/* ============================================================ */}
            <Card className="overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b bg-gray-50/60">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-100">
                            <Receipt className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                            <span className="font-semibold text-gray-800 block">Billing History</span>
                            <span className="text-xs text-gray-400">
                                {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {historyLoading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                )}

                {/* Empty */}
                {!historyLoading && purchases.length === 0 && (
                    <div className="py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                            <CreditCard className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No purchases yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Your slot purchases will appear here after payment.
                        </p>
                    </div>
                )}

                {/* Desktop Table */}
                {!historyLoading && purchases.length > 0 && (
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Payment ID</th>
                                    <th className="py-3 px-4">Description</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map((p, i) => (
                                    <tr
                                        key={p.id}
                                        className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                                    >
                                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                                            {p.payment_id}
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">
                                            {p.description}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">
                                            ₹{p.amount.toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {formatDate(p.created_at)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs"
                                                onClick={() =>
                                                    generateReceipt({
                                                        paymentId: p.payment_id,
                                                        orderId: p.order_id,
                                                        amount: p.amount,
                                                        description: p.description,
                                                        payerName: profile?.name || "Organizer",
                                                        payerEmail: profile?.email || undefined,
                                                        paidAt: p.created_at,
                                                    })
                                                }
                                            >
                                                <Download className="h-3 w-3" />
                                                PDF
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Mobile Cards */}
                {!historyLoading && purchases.length > 0 && (
                    <div className="md:hidden divide-y">
                        {purchases.map((p) => (
                            <div key={p.id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {p.description}
                                        </p>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                                            {p.payment_id}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                                        ₹{p.amount.toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {formatDate(p.created_at)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 gap-1 text-indigo-600 text-[11px] px-2"
                                        onClick={() =>
                                            generateReceipt({
                                                paymentId: p.payment_id,
                                                orderId: p.order_id,
                                                amount: p.amount,
                                                description: p.description,
                                                payerName: profile?.name || "Organizer",
                                                payerEmail: profile?.email || undefined,
                                                paidAt: p.created_at,
                                            })
                                        }
                                    >
                                        <Download className="h-3 w-3" />
                                        Receipt
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Payment Success Modal */}
            {successData && (
                <PaymentSuccessModal
                    open={true}
                    onClose={() => {
                        setSuccessData(null);
                    }}
                    receipt={successData}
                    continueLabel="Continue to Dashboard"
                    onContinue={() => {
                        setSuccessData(null);
                        router.push("/dashboard/organizer");
                    }}
                />
            )}

            {/* AI Credit Bundle Modal */}
            <AICreditModal
                open={openBundleModal}
                onClose={() => setOpenBundleModal(false)}
                onConfirm={(credits) => handlePayment(credits)}
                paying={paying}
            />
        </div>
    );
}
