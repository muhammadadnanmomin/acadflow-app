"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  FileText,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Download,
  Receipt,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Wallet,
  Smartphone,
  Landmark,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import jsPDF from "jspdf";

export default function ParticipantPaymentsPage() {
  const { profile } = useProfile();
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [acceptedPapers, setAcceptedPapers] = useState<any[]>([]);
  const [fees, setFees] = useState<Record<string, any>>({});

  const [presentationType, setPresentationType] = useState<Record<string, string>>({});
  const [publicationType, setPublicationType] = useState<Record<string, string>>({});

  const [processing, setProcessing] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function loadData() {
    if (!profile) return;

    setLoading(true);

    if (!profile) return;

    const { data } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        conference_id,
        status,
        presentation_type,
        publication_type,
        payment_status,
        conferences (
          title,
          physical_presentation_fee,
          virtual_presentation_fee,
          full_paper_publication_fee,
          abstract_publication_fee
        )
      `)
      .eq("user_id", profile.id)
      .eq("status", "accepted");

    if (!data) return;

    const feeMap: Record<string, any> = {};
    data.forEach((d) => {
      feeMap[d.conference_id] = d.conferences;
    });

    setFees(feeMap);
    setAcceptedPapers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  function calculateFee(confId: string) {
    const confFees = fees[confId];
    if (!confFees) return 0;

    let total = 0;

    if (presentationType[confId] === "Physical Presentation")
      total += Number(confFees.physical_presentation_fee || 0);

    if (presentationType[confId] === "Virtual Presentation")
      total += Number(confFees.virtual_presentation_fee || 0);

    if (publicationType[confId] === "Full Paper Publication")
      total += Number(confFees.full_paper_publication_fee || 0);

    if (publicationType[confId] === "Abstract Only Publication")
      total += Number(confFees.abstract_publication_fee || 0);

    return total;
  }

  async function saveOptions(row: any) {
    const confId = row.conference_id;

    if (!presentationType[confId] || !publicationType[confId]) {
      toast({
        variant: "destructive",
        title: "Select options first",
      });
      return false;
    }

    setProcessing(confId);

    await supabase
      .from("paper_submissions")
      .update({
        presentation_type: presentationType[confId],
        publication_type: publicationType[confId],
      })
      .eq("id", row.id);

    setProcessing(null);
    return true;
  }

  function generateInvoice(title: string, amount: number) {
    const doc = new jsPDF();
    doc.text("AcadFlow Payment Receipt", 20, 20);
    doc.text(`Conference: ${title}`, 20, 40);
    doc.text(`Amount Paid: ₹${amount}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 60);
    doc.save("AcadFlow_Receipt.pdf");
  }

  async function openPayment(row: any) {
    const confId = row.conference_id;

    // prevent duplicate payment
    if (row.payment_status === "paid") {
      toast({ title: "Payment already completed" });
      return;
    }

    const amount = calculateFee(confId);
    if (!amount || amount <= 0) return;

    const saved = await saveOptions(row);
    if (!saved) return;

    if (payLoading === confId) return;
    setPayLoading(confId);

    if (!profile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not loaded",
      });
      return;
    }
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        conferenceId: confId,
        userId: profile.id,
      }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "AcadFlow",
      description: "Conference Fee Payment",
      order_id: order.id,

      handler: async (response: any) => {

        // ✅ WAIT for verification
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            submissionId: row.id,
          }),
        });

        if (!verifyRes.ok) {
          toast({
            variant: "destructive",
            title: "Payment verification failed",
          });
          return;
        }

        // instant UI update
        setAcceptedPapers(prev =>
          prev.map(p =>
            p.id === row.id ? { ...p, payment_status: "paid" } : p
          )
        );

        generateInvoice(fees[confId].title, amount);
        setPaymentSuccess(true);

        await loadData();

        toast({
          title: "Payment Successful 🎉",
        });
      },

      theme: { color: "#4f46e5" },
    };

    const razor = new (window as any).Razorpay(options);
    razor.open();
    setPayLoading(null);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Success Overlay ── */}
      {paymentSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-green-100 mt-2 text-sm">
                Your conference fee has been confirmed.
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Your presentation slot is now confirmed. A receipt has been downloaded.
              </p>
              <Button
                onClick={() => setPaymentSuccess(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your conference presentation & publication fee payments
        </p>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-gray-500 text-sm">Loading payment details…</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && acceptedPapers.length === 0 && (
        <Card className="p-10 text-center shadow-sm">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg">No payments due at this time</p>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
            Once your papers are accepted for a conference, payment options for presentation and publication fees will appear here.
          </p>
        </Card>
      )}

      {/* ── Payment Cards ── */}
      {!loading && acceptedPapers.map((row) => {
        const confId = row.conference_id;
        const totalFee = calculateFee(confId);
        const alreadyPaid = row.payment_status === "paid";
        const isProcessing = payLoading === confId;

        return (
          <Card key={row.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">

            {/* Card Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b gap-3 ${alreadyPaid ? "bg-gradient-to-r from-green-50 to-emerald-50" : "bg-gray-50/60"
              }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0 ${alreadyPaid ? "bg-green-100" : "bg-indigo-100"
                  }`}>
                  <FileText className={`h-4 w-4 ${alreadyPaid ? "text-green-600" : "text-indigo-600"}`} />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-gray-800 block truncate">{fees[confId]?.title}</span>
                  <span className="text-xs text-gray-400">Conference Fee Payment</span>
                </div>
              </div>

              {/* Status Badge */}
              {alreadyPaid ? (
                <Badge className="bg-green-100 text-green-700 border border-green-200 self-start sm:self-auto gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 self-start sm:self-auto gap-1">
                  <Clock className="h-3 w-3" /> Payment Pending
                </Badge>
              )}
            </div>

            <div className="p-5 space-y-5">

              {/* ── Paid State ── */}
              {alreadyPaid && (
                <div className="space-y-4">
                  {/* Selected Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {row.presentation_type && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Presentation Type</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{row.presentation_type}</p>
                      </div>
                    )}
                    {row.publication_type && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Publication Type</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{row.publication_type}</p>
                      </div>
                    )}
                  </div>

                  {/* Success Message */}
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 text-sm">Payment Completed Successfully</p>
                      <p className="text-xs text-green-600">Your presentation & publication slot is confirmed.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateInvoice(fees[confId]?.title || "Conference", totalFee || 0)}
                    >
                      <Receipt className="h-4 w-4 mr-2" /> Download Receipt
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateInvoice(fees[confId]?.title || "Conference", totalFee || 0)}
                    >
                      <Download className="h-4 w-4 mr-2" /> View Invoice
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Unpaid State ── */}
              {!alreadyPaid && (
                <div className="space-y-4">
                  {/* Dropdowns */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Presentation Type</label>
                      <select
                        className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                        value={presentationType[confId] || ""}
                        onChange={(e) =>
                          setPresentationType({
                            ...presentationType,
                            [confId]: e.target.value,
                          })
                        }
                      >
                        <option value="">Select presentation type</option>
                        <option>Physical Presentation</option>
                        <option>Virtual Presentation</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Publication Option</label>
                      <select
                        className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                        value={publicationType[confId] || ""}
                        onChange={(e) =>
                          setPublicationType({
                            ...publicationType,
                            [confId]: e.target.value,
                          })
                        }
                      >
                        <option value="">Select publication option</option>
                        <option>Full Paper Publication</option>
                        <option>Abstract Only Publication</option>
                      </select>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {totalFee > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-600">Total Payable</span>
                        </div>
                        <span className="text-2xl font-bold text-indigo-700">
                          ₹{totalFee.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Deadline Warning */}
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Complete your payment to secure your presentation slot. Unpaid papers may not be included in the conference proceedings.</span>
                  </div>

                  {/* Pay Button */}
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold transition-all"
                    disabled={isProcessing}
                    onClick={() => openPayment(row)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing Payment…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* ── Trust Section ── */}
      {!loading && acceptedPapers.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Secure payment powered by <strong className="text-gray-700">Razorpay</strong> · Encrypted & safe</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="flex items-center gap-1 text-xs" title="UPI">
                <Smartphone className="h-3.5 w-3.5" />
                <span>UPI</span>
              </div>
              <div className="h-3 w-px bg-gray-300" />
              <div className="flex items-center gap-1 text-xs" title="Cards">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Cards</span>
              </div>
              <div className="h-3 w-px bg-gray-300" />
              <div className="flex items-center gap-1 text-xs" title="Net Banking">
                <Landmark className="h-3.5 w-3.5" />
                <span>Net Banking</span>
              </div>
              <div className="h-3 w-px bg-gray-300" />
              <div className="flex items-center gap-1 text-xs" title="Wallets">
                <Wallet className="h-3.5 w-3.5" />
                <span>Wallets</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}