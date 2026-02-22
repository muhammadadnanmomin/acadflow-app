"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  IndianRupee,
  CreditCard,
} from "lucide-react";

export default function OrganizerPayments() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  /* Load payments */
  async function loadPayments() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        amount,
        payment_status,
        payment_id,
        created_at,
        profiles ( name, email ),
        conferences ( title )
      `)
      .eq("organizer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPayments(data || []);

    /* Calculate total */
    const sum =
      data?.reduce(
        (acc: number, p: any) =>
          p.payment_status === "success"
            ? acc + p.amount
            : acc,
        0
      ) || 0;

    setTotal(sum);

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
          Track participant payments
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-6 sm:grid-cols-2">

        <Card className="p-6 flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              Total Revenue
            </p>

            <p className="mt-1 text-2xl font-bold">
              ₹{total}
            </p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <IndianRupee className="h-6 w-6 text-green-600" />
          </div>

        </Card>

        <Card className="p-6 flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              Total Transactions
            </p>

            <p className="mt-1 text-2xl font-bold">
              {payments.length}
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>

        </Card>

      </div>

      {/* Payments Table */}
      <Card className="p-6">

        {loading && (
          <p className="text-sm text-gray-500">
            Loading payments...
          </p>
        )}

        {!loading && payments.length === 0 && (
          <p className="text-sm text-gray-500">
            No payments yet.
          </p>
        )}

        {!loading && payments.length > 0 && (

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="border-b text-left text-sm text-gray-500">

                  <th className="py-3 px-2">Participant</th>
                  <th className="py-3 px-2">Conference</th>
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

                    {/* Participant */}
                    <td className="py-3 px-2 text-sm">

                      <div>
                        <p className="font-medium">
                          {p.profiles?.name}
                        </p>

                        <p className="text-gray-500">
                          {p.profiles?.email}
                        </p>
                      </div>

                    </td>

                    {/* Conference */}
                    <td className="py-3 px-2 text-sm">
                      {p.conferences?.title}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-2 font-medium">
                      ₹{p.amount}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <StatusBadge status={p.payment_status} />
                    </td>

                    {/* Payment ID */}
                    <td className="py-3 px-2 text-xs text-gray-500">
                      {p.payment_id || "-"}
                    </td>

                    {/* Date */}
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

/* Status badge */
function StatusBadge({ status }: { status: string }) {

  if (status === "success") {
    return (
      <Badge className="bg-green-100 text-green-700">
        Success
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge className="bg-red-100 text-red-700">
        Failed
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-700">
      Pending
    </Badge>
  );
}
