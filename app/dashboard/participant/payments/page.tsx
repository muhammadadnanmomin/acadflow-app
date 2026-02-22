"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  CreditCard,
  Calendar,
  ExternalLink,
} from "lucide-react";

const supabase = createClient()

export default function ParticipantPaymentsPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  /* Load payment data */
  async function loadData() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        payment_status,
        payment_id,
        amount,
        created_at,
        conferences (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPayments(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Payments
        </h1>

        <p className="text-gray-500 mt-1">
          Track your registration payments
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-gray-500">
          Loading payments...
        </p>
      )}

      {/* Empty */}
      {!loading && payments.length === 0 && (
        <p className="text-sm text-gray-500">
          No payments found.
        </p>
      )}

      {/* List */}
      {!loading && payments.length > 0 && (

        <div className="space-y-5">

          {payments.map((p) => {

            const conf = p.conferences;

            return (

              <Card
                key={p.id}
                className="p-5 space-y-4"
              >

                {/* Header */}
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <CreditCard className="h-4 w-4 text-gray-400" />

                    <span className="font-semibold">
                      {conf?.title}
                    </span>

                  </div>

                  <StatusBadge
                    status={p.payment_status}
                  />

                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {conf?.start_date} → {conf?.end_date}
                  </div>

                  <div>
                    Amount: ₹{p.amount || "N/A"}
                  </div>

                  <div>
                    Transaction ID:{" "}
                    <span className="font-mono text-xs">
                      {p.payment_id || "—"}
                    </span>
                  </div>

                  <div>
                    Date:{" "}
                    {new Date(
                      p.created_at
                    ).toLocaleDateString()}
                  </div>

                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">

                  {/* Pay Now */}
                  {p.payment_status !== "success" && (

                    <Button
                      size="sm"
                      asChild
                    >
                      <Link
                        href={`/conferences/${conf?.id}`}
                      >
                        Pay Now
                      </Link>
                    </Button>

                  )}

                  {/* View Conference */}
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link
                      href={`/conferences/${conf?.id}`}
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>

                </div>

              </Card>

            );
          })}

        </div>

      )}

    </div>
  );
}

/* Payment Status Badge */
function StatusBadge({ status }: { status: string }) {

  if (status === "success") {
    return (
      <Badge className="bg-green-100 text-green-700">
        Paid
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
