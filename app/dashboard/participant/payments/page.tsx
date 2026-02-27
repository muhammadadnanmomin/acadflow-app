"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { FileText, CheckCircle } from "lucide-react";
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

    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, conferenceId: confId, userId: profile.id }),
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
    <div className="space-y-8 max-w-6xl">

      {paymentSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-8 rounded-xl text-center shadow-xl animate-bounce">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
            <p className="text-sm text-gray-600 mt-2">
              Your payment has been confirmed.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold">Payments</h1>

      {loading && <p>Loading...</p>}

      {!loading && acceptedPapers.map((row) => {
        const confId = row.conference_id;
        const totalFee = calculateFee(confId);
        const alreadyPaid = row.payment_status === "paid";

        return (
          <Card key={row.id} className="p-5 space-y-4">
            <div className="flex justify-between">
              <div className="flex gap-2 items-center">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">{fees[confId]?.title}</span>
              </div>
              <Badge className={alreadyPaid
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"}>
                {alreadyPaid ? "Paid" : "Payment Pending"}
              </Badge>
            </div>

            {/* show selected options after payment */}
            {alreadyPaid && (
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Presentation:</strong> {row.presentation_type}</p>
                <p><strong>Publication:</strong> {row.publication_type}</p>
              </div>
            )}

            {!alreadyPaid && (
              <>
                <select
                  className="border rounded px-3 py-2 w-full"
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

                <select
                  className="border rounded px-3 py-2 w-full"
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

                {totalFee > 0 && (
                  <div className="bg-white border rounded p-3 text-sm">
                    <strong>Total Payable Fee:</strong> ₹{totalFee}
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={payLoading === confId}
                  onClick={() => openPayment(row)}
                >
                  {payLoading === confId
                    ? "Processing..."
                    : "Proceed to Payment"}
                </Button>
              </>
            )}

            {alreadyPaid && (
              <div className="text-sm text-green-700">
                ✔ Payment completed successfully
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}