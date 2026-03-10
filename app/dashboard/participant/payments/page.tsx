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
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import jsPDF from "jspdf";

import {
  calculateFeeBreakdown,
  formatINR,
  PLATFORM_FEE_PERCENT,
  type FeeBreakdown,
} from "@/lib/payment/fees";

export default function ParticipantPaymentsPage() {
  const { profile } = useProfile();
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [acceptedPapers, setAcceptedPapers] = useState<any[]>([]);
  const [fees, setFees] = useState<Record<string, any>>({});

  /* Category-based fees */
  const [categoryFees, setCategoryFees] = useState<Record<string, any[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({});

  const [presentationType, setPresentationType] = useState<Record<string, string>>({});
  const [publicationType, setPublicationType] = useState<Record<string, string>>({});

  const [processing, setProcessing] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function loadData() {
    if (!profile) return;

    setLoading(true);

    try {
      /* ── 1. Load accepted papers (author flow) ── */
      const { data, error } = await supabase
        .from("paper_submissions")
        .select(`
          id,
          conference_id,
          status,
          presentation_type,
          publication_type,
          payment_status,
          participant_category,
          conferences (
            title,
            mode,
            organizations (
              name
            )
          )
        `)
        .eq("user_id", profile.id)
        .eq("status", "accepted");

      if (error) {
        console.error("Load payments error:", error);
        toast({
          variant: "destructive",
          title: "Failed to load payments",
          description: error.message,
        });
        setLoading(false);
        return;
      }

      /* ── 2. Load listener registrations ── */
      const { data: listenerRegs } = await supabase
        .from("conference_registrations")
        .select(`
          id,
          conference_id,
          role,
          paid,
          conferences (
            title,
            mode,
            organizations (
              name
            )
          )
        `)
        .eq("user_id", profile.id)
        .eq("role", "listener");

      /* ── 3. Transform & merge rows ── */
      const authorRows = (data || []).map((d: any) => ({ ...d, type: "author" as const }));

      const listenerRows = (listenerRegs || []).map((reg: any) => ({
        id: reg.id,
        conference_id: reg.conference_id,
        payment_status: reg.paid ? "paid" : "pending",
        participant_category: "Listener",
        presentation_type: null,
        publication_type: null,
        conferences: reg.conferences,
        type: "listener" as const,
      }));

      const allRows = [...authorRows, ...listenerRows];

      if (allRows.length === 0) {
        setAcceptedPapers([]);
        setLoading(false);
        return;
      }

      /* ── 4. Build fee map & conference IDs ── */
      const feeMap: Record<string, any> = {};
      const confIds = new Set<string>();
      allRows.forEach((d) => {
        const conf = d.conferences as any;
        feeMap[d.conference_id] = {
          ...conf,
          organizer_name: conf?.organizations?.name || "Conference Organizer",
        };
        confIds.add(d.conference_id);
      });

      /* Load category fees for all relevant conferences */
      const catFeeMap: Record<string, any[]> = {};
      if (confIds.size > 0) {
        const { data: catRows } = await supabase
          .from("conference_fee_categories")
          .select("*")
          .in("conference_id", Array.from(confIds));

        if (catRows) {
          catRows.forEach((row) => {
            if (!catFeeMap[row.conference_id]) catFeeMap[row.conference_id] = [];
            catFeeMap[row.conference_id].push(row);
          });
        }
      }

      // Auto-select presentation type when conference mode allows only one option
      const autoPresType: Record<string, string> = {};
      authorRows.forEach((d) => {
        const conf = d.conferences as any;
        const m = conf?.mode;
        if (m === "online") autoPresType[d.conference_id] = "Virtual Presentation";
        else if (m === "offline") autoPresType[d.conference_id] = "Physical Presentation";
      });

      // Restore saved category from paper_submissions (authors only)
      const autoCat: Record<string, string> = {};
      authorRows.forEach((d) => {
        if (d.participant_category) autoCat[d.conference_id] = d.participant_category;
      });

      // Auto-select Listener category for listener rows
      listenerRows.forEach((d) => {
        autoCat[d.conference_id] = "Listener";
      });

      setCategoryFees(catFeeMap);
      setSelectedCategory((prev) => ({ ...autoCat, ...prev }));
      setFees(feeMap);
      setPresentationType((prev) => ({ ...autoPresType, ...prev }));
      setAcceptedPapers(allRows);
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error loading payments:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  // ── Fee calculation helpers ──────────────────────────────────────

  /** Get the fee category row for the selected category */
  function getCategoryRow(confId: string) {
    const cat = selectedCategory[confId];
    if (!cat) return null;
    const rows = categoryFees[confId];
    if (!rows) return null;
    return rows.find((r) => r.category_name === cat) || null;
  }

  /** Conference fee = sum of selected presentation + publication options */
  function getConferenceFee(confId: string): number {
    const row = getCategoryRow(confId);
    if (!row) return 0;

    const cat = selectedCategory[confId];

    // Listener: only listener_fee
    if (cat === "Listener") {
      return Number(row.listener_fee || 0);
    }

    let total = 0;

    if (presentationType[confId] === "Physical Presentation")
      total += Number(row.physical_presentation_fee || 0);

    if (presentationType[confId] === "Virtual Presentation")
      total += Number(row.virtual_presentation_fee || 0);

    if (publicationType[confId] === "Full Paper Publication")
      total += Number(row.full_paper_publication_fee || 0);

    if (publicationType[confId] === "Abstract Only Publication")
      total += Number(row.abstract_publication_fee || 0);

    return total;
  }

  /** Full fee breakdown including platform processing fee */
  function getBreakdown(confId: string): FeeBreakdown {
    return calculateFeeBreakdown(getConferenceFee(confId));
  }

  /** Get the fee for the selected presentation type */
  function getPresentationFee(confId: string): number {
    const row = getCategoryRow(confId);
    if (!row) return 0;
    if (selectedCategory[confId] === "Listener") return 0;
    if (presentationType[confId] === "Physical Presentation")
      return Number(row.physical_presentation_fee || 0);
    if (presentationType[confId] === "Virtual Presentation")
      return Number(row.virtual_presentation_fee || 0);
    return 0;
  }

  /** Get the fee for the selected publication type */
  function getPublicationFee(confId: string): number {
    const row = getCategoryRow(confId);
    if (!row) return 0;
    if (selectedCategory[confId] === "Listener") return 0;
    if (publicationType[confId] === "Full Paper Publication")
      return Number(row.full_paper_publication_fee || 0);
    if (publicationType[confId] === "Abstract Only Publication")
      return Number(row.abstract_publication_fee || 0);
    return 0;
  }

  // ── Save options ─────────────────────────────────────────────────

  async function saveOptions(row: any) {
    const confId = row.conference_id;
    const cat = selectedCategory[confId];
    const isListener = cat === "Listener";

    // Listener registrations: category is fixed, no options to save
    if (row.type === "listener") {
      return true;
    }

    if (!cat) {
      toast({
        variant: "destructive",
        title: "Select a category first",
      });
      return false;
    }

    if (!isListener && (!presentationType[confId] || !publicationType[confId])) {
      toast({
        variant: "destructive",
        title: "Select options first",
      });
      return false;
    }

    setProcessing(confId);

    const updatePayload: Record<string, any> = {
      participant_category: cat,
    };
    if (!isListener) {
      updatePayload.presentation_type = presentationType[confId];
      updatePayload.publication_type = publicationType[confId];
    } else {
      updatePayload.presentation_type = null;
      updatePayload.publication_type = null;
    }

    await supabase
      .from("paper_submissions")
      .update(updatePayload)
      .eq("id", row.id);

    setProcessing(null);
    return true;
  }

  // ── Invoice / Receipt PDF ────────────────────────────────────────

  function generateInvoice(
    title: string,
    organizer: string,
    breakdown: FeeBreakdown,
    paymentId: string,
    orderId: string
  ) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // ── Header ──
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Receipt", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Powered by AcadFlow", 20, y);
    doc.setTextColor(0);
    y += 6;

    // divider
    doc.setDrawColor(200);
    doc.line(20, y, pageWidth - 20, y);
    y += 12;

    // ── Conference Details ──
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Conference Details", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Conference Name: ${title}`, 20, y);
    y += 6;
    doc.text(`Organized By: ${organizer}`, 20, y);
    y += 12;

    // divider
    doc.line(20, y, pageWidth - 20, y);
    y += 12;

    // ── Payment Details ──
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Razorpay Payment ID: ${paymentId}`, 20, y);
    y += 6;
    doc.text(`Razorpay Order ID: ${orderId}`, 20, y);
    y += 6;
    doc.text(`Date & Time: ${new Date().toLocaleString("en-IN")}`, 20, y);
    y += 12;

    // divider
    doc.line(20, y, pageWidth - 20, y);
    y += 12;

    // ── Fee Breakdown ──
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fee Breakdown", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Line items
    const rightX = pageWidth - 20;

    const addRow = (label: string, amount: string, bold = false) => {
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(label, 20, y);
      doc.text(amount, rightX, y, { align: "right" });
      y += 7;
    };

    addRow("Conference Fee", `Rs. ${formatINR(breakdown.conferenceFee)}`);
    addRow(
      `Platform Processing Fee (${PLATFORM_FEE_PERCENT}%)`,
      `Rs. ${formatINR(breakdown.processingFee)}`
    );

    y += 2;
    doc.setDrawColor(180);
    doc.line(20, y, rightX, y);
    y += 8;

    doc.setFontSize(13);
    addRow("Total Paid", `Rs. ${formatINR(breakdown.total)}`, true);

    y += 8;

    // divider
    doc.setDrawColor(200);
    doc.line(20, y, pageWidth - 20, y);
    y += 12;

    // ── Transparency Section ──
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Transparency Notice", 20, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(
      `Conference fee of Rs. ${formatINR(breakdown.conferenceFee)} has been transferred to ${organizer}.`,
      20,
      y
    );
    y += 5;
    doc.text(
      `Platform processing fee of Rs. ${formatINR(breakdown.processingFee)} is retained by AcadFlow.`,
      20,
      y
    );
    y += 5;
    doc.text(
      "AcadFlow charges a small platform processing fee to support secure payment infrastructure and platform operations.",
      20,
      y
    );
    doc.setTextColor(0);

    doc.save("AcadFlow_Receipt.pdf");
  }

  // ── Open Razorpay Checkout ───────────────────────────────────────

  async function openPayment(row: any) {
    const confId = row.conference_id;

    // prevent duplicate payment
    if (row.payment_status === "paid") {
      toast({ title: "Payment already completed" });
      return;
    }

    const conferenceFee = getConferenceFee(confId);
    if (!conferenceFee || conferenceFee <= 0) return;

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
      setPayLoading(null);
      return;
    }

    const isListener = row.type === "listener";

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conferenceFee,
          conferenceId: confId,
          userId: profile.id,
          submissionId: isListener ? null : row.id,
          registrationId: isListener ? row.id : null,
          paymentType: row.type,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast({
          variant: "destructive",
          title: "Order creation failed",
          description: errorData.error || "Please try again",
        });
        setPayLoading(null);
        return;
      }

      const order = await res.json();
      const serverBreakdown: FeeBreakdown = order.breakdown;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "AcadFlow",
        description: `Payment to ${fees[confId]?.organizer_name || "Conference Organizer"} via AcadFlow`,
        order_id: order.id,

        handler: async (response: any) => {
          // ✅ Verify payment with fee breakdown
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              submissionId: isListener ? null : row.id,
              registrationId: isListener ? row.id : null,
              paymentType: row.type,
              conferenceFee: serverBreakdown.conferenceFee,
              processingFee: serverBreakdown.processingFee,
              total: serverBreakdown.total,
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
          setAcceptedPapers((prev) =>
            prev.map((p) =>
              p.id === row.id ? { ...p, payment_status: "paid" } : p
            )
          );

          generateInvoice(
            fees[confId].title,
            fees[confId]?.organizer_name || "Conference Organizer",
            serverBreakdown,
            response.razorpay_payment_id,
            order.id
          );
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
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later",
      });
    }

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
            Once your papers are accepted or you register as a listener, payment options will appear here.
          </p>
        </Card>
      )}

      {/* ── Payment Cards ── */}
      {!loading && acceptedPapers.map((row) => {
        const confId = row.conference_id;
        const breakdown = getBreakdown(confId);
        const alreadyPaid = row.payment_status === "paid";
        const isProcessing = payLoading === confId;
        const presFee = getPresentationFee(confId);
        const pubFee = getPublicationFee(confId);

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
                      onClick={() => generateInvoice(
                        fees[confId]?.title || "Conference",
                        fees[confId]?.organizer_name || "Conference Organizer",
                        breakdown,
                        "N/A",
                        "N/A"
                      )}
                    >
                      <Receipt className="h-4 w-4 mr-2" /> Download Receipt
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Unpaid State ── */}
              {!alreadyPaid && (
                <div className="space-y-4">
                  {/* Dropdowns */}
                  <div className="space-y-3">
                    {/* Category dropdown */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Participant Category</label>
                      <select
                        className="border border-gray-200 rounded-lg px-3 py-2.5 w-full text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                        value={selectedCategory[confId] || ""}
                        onChange={(e) =>
                          setSelectedCategory({
                            ...selectedCategory,
                            [confId]: e.target.value,
                          })
                        }
                      >
                        <option value="">Select your category</option>
                        {(categoryFees[confId] || []).map((cat: any) => (
                          <option key={cat.category_name} value={cat.category_name}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Listener: no further options */}
                    {selectedCategory[confId] === "Listener" && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                        <p className="font-medium">Listener Category</p>
                        <p className="text-xs mt-1 text-blue-600">
                          As a listener, you do not present or publish. Only the listener fee applies.
                        </p>
                      </div>
                    )}

                    {/* Non-listener: show presentation & publication options */}
                    {selectedCategory[confId] && selectedCategory[confId] !== "Listener" && (
                      <>
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
                            {fees[confId]?.mode !== "online" && (
                              <option>Physical Presentation</option>
                            )}
                            {fees[confId]?.mode !== "offline" && (
                              <option>Virtual Presentation</option>
                            )}
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
                      </>
                    )}
                  </div>

                  {/* ── Fee Breakdown Card ── */}
                  {breakdown.conferenceFee > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 border border-indigo-200 rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-100">
                        <CreditCard className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-800">Fee Breakdown</span>
                        {selectedCategory[confId] && (
                          <Badge className="ml-auto bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs">
                            {selectedCategory[confId]}
                          </Badge>
                        )}
                      </div>

                      {/* Line items */}
                      <div className="px-4 py-3 space-y-2">
                        {/* Listener fee */}
                        {selectedCategory[confId] === "Listener" && breakdown.conferenceFee > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Listener Fee</span>
                            <span className="text-gray-700 font-medium tabular-nums">
                              ₹{formatINR(breakdown.conferenceFee)}
                            </span>
                          </div>
                        )}

                        {/* Presentation fee */}
                        {selectedCategory[confId] !== "Listener" && presFee > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {presentationType[confId]} Fee
                            </span>
                            <span className="text-gray-700 font-medium tabular-nums">
                              ₹{formatINR(presFee)}
                            </span>
                          </div>
                        )}

                        {/* Publication fee */}
                        {selectedCategory[confId] !== "Listener" && pubFee > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {publicationType[confId]} Fee
                            </span>
                            <span className="text-gray-700 font-medium tabular-nums">
                              ₹{formatINR(pubFee)}
                            </span>
                          </div>
                        )}

                        {/* Subtotal divider */}
                        <div className="border-t border-dashed border-indigo-200 pt-2 mt-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Conference Fee</span>
                            <span className="text-gray-800 font-semibold tabular-nums">
                              ₹{formatINR(breakdown.conferenceFee)}
                            </span>
                          </div>
                        </div>

                        {/* Platform processing fee */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Platform Processing Fee ({PLATFORM_FEE_PERCENT}%)
                          </span>
                          <span className="text-gray-600 tabular-nums">
                            ₹{formatINR(breakdown.processingFee)}
                          </span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-indigo-100/60 border-t border-indigo-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">
                            Total Payable
                          </span>
                          <span className="text-xl font-bold text-indigo-700 tabular-nums">
                            ₹{formatINR(breakdown.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deadline Warning */}
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Complete your payment to secure your presentation slot. Unpaid papers may not be included in the conference proceedings.</span>
                  </div>

                  {/* Payment Transparency Block */}
                  <div className="border border-gray-200 rounded-xl p-4 space-y-2.5 bg-white">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-gray-800">Payment Transparency</span>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <p>
                        <span className="text-gray-400">Conference Organized By:</span>{" "}
                        <span className="font-medium text-gray-700">{fees[confId]?.organizer_name || "Conference Organizer"}</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Payment Recipient:</span>{" "}
                        <span className="font-medium text-gray-700">{fees[confId]?.organizer_name || "Conference Organizer"}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      AcadFlow charges a small platform processing fee to support secure payment infrastructure and platform operations. The conference fee (₹{formatINR(breakdown.conferenceFee)}) goes directly to the organizer.
                    </p>
                  </div>

                  {/* Pay Button */}
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold transition-all"
                    disabled={isProcessing || breakdown.conferenceFee <= 0}
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
                        {breakdown.total > 0
                          ? `Pay ₹${formatINR(breakdown.total)}`
                          : "Complete Payment"}
                      </>
                    )}
                  </Button>

                  {/* Legal Confirmation */}
                  <p className="text-xs text-center text-gray-400 leading-relaxed">
                    By proceeding, you agree that the conference fee will be transferred to the organizer.
                    A small platform processing fee is charged by AcadFlow.
                  </p>
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