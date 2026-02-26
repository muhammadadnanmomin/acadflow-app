"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { IndianRupee, CreditCard } from "lucide-react";

export default function OrganizerPayments() {
  const { profile } = useProfile();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  async function loadPayments() {
    if (!profile) return;
    setLoading(true);

    /* ================= REGISTRATION PAYMENTS ================= */
    const { data: regData } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        amount,
        payment_status,
        payment_id,
        created_at,
        profiles ( name, email ),
        conferences ( title, organizer_id )
      `)
      .eq("conferences.organizer_id", profile.id);

    /* ================= PAPER PAYMENTS ================= */
    const { data: paperData } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        presentation_fee,
        payment_status,
        presentation_payment_id,
        created_at,
        user_id,
        profiles ( name, email ),
        conferences ( title, organizer_id )
      `)
      .eq("conferences.organizer_id", profile.id)
      .eq("payment_status", "paid");

    const formattedRegs =
      regData?.map((p: any) => ({
        id: p.id,
        participant: p.profiles,
        conference: p.conferences?.title,
        amount: p.amount,
        status: p.payment_status,
        payment_id: p.payment_id,
        created_at: p.created_at,
        type: "Registration",
      })) || [];

    const formattedPapers =
      paperData?.map((p: any) => ({
        id: p.id,
        participant: p.profiles,
        conference: p.conferences?.title,
        amount: p.presentation_fee,
        status: p.payment_status,
        payment_id: p.presentation_payment_id,
        created_at: p.created_at,
        type: "Paper Fee",
      })) || [];

    const allPayments = [...formattedRegs, ...formattedPapers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    setPayments(allPayments);

    const totalAmount = allPayments.reduce(
      (sum, p) => (p.status === "success" || p.status === "paid"
        ? sum + (p.amount || 0)
        : sum),
      0
    );

    setTotal(totalAmount);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, [profile]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Payments & Revenue
        </h1>
        <p className="text-gray-500 mt-1">
          Track participant payments & paper fees
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-6 sm:grid-cols-2">

        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold">₹{total}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <IndianRupee className="h-6 w-6 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="mt-1 text-2xl font-bold">{payments.length}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        </Card>

      </div>

      {/* Payments Table */}
      <Card className="p-6">

        {loading && (
          <p className="text-sm text-gray-500">Loading payments...</p>
        )}

        {!loading && payments.length === 0 && (
          <p className="text-sm text-gray-500">No payments yet.</p>
        )}

        {!loading && payments.length > 0 && (

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">

              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="py-3 px-2">Participant</th>
                  <th className="py-3 px-2">Conference</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Payment ID</th>
                  <th className="py-3 px-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 text-sm">
                      <p className="font-medium">{p.participant?.name}</p>
                      <p className="text-gray-500">{p.participant?.email}</p>
                    </td>

                    <td className="py-3 px-2 text-sm">
                      {p.conference}
                    </td>

                    <td className="py-3 px-2 text-sm">
                      {p.type}
                    </td>

                    <td className="py-3 px-2 font-medium">
                      ₹{p.amount}
                    </td>

                    <td className="py-3 px-2">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3 px-2 text-xs text-gray-500">
                      {p.payment_id || "-"}
                    </td>

                    <td className="py-3 px-2 text-sm">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        )}

      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success" || status === "paid")
    return <Badge className="bg-green-100 text-green-700">Paid</Badge>;

  if (status === "failed")
    return <Badge className="bg-red-100 text-red-700">Failed</Badge>;

  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}