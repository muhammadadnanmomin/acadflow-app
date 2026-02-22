"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  FileText,
  CreditCard,
  ExternalLink,
} from "lucide-react";

const supabase = createClient()

export default function ParticipantConferencesPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);

  /* Load registered conferences */
  async function loadData() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        role,
        paid,
        created_at,
        conferences (
          id,
          title,
          start_date,
          end_date,
          is_published
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setRegistrations(data || []);
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
          My Conferences
        </h1>

        <p className="text-gray-500 mt-1">
          Conferences you are registered for
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-gray-500">
          Loading conferences...
        </p>
      )}

      {/* Empty */}
      {!loading && registrations.length === 0 && (
        <p className="text-sm text-gray-500">
          You haven’t registered for any conferences yet.
        </p>
      )}

      {/* List */}
      {!loading && registrations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {registrations.map((r) => {
            const conf = r.conferences;

            return (
              <Card
                key={r.id}
                className="p-5 space-y-4"
              >

                {/* Title */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {conf?.title}
                  </h2>

                  <PaymentBadge
                    paid={r.paid}
                    role={r.role}
                  />
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {conf?.start_date} → {conf?.end_date}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">

                  {/* Submission (Author only) */}
                  {r.role === "author" && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link
                        href="/dashboard/participant/submissions"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Submission
                      </Link>
                    </Button>
                  )}

                  {/* Payment (Attendee only) */}
                  {r.role === "attendee" && !r.paid && (
                    <Button
                      size="sm"
                      asChild
                    >
                      <Link
                        href={`/payment/${conf?.id}`}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay Now
                      </Link>
                    </Button>
                  )}

                  {/* Public Page */}
                  {conf?.is_published && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a
                        href={`/conferences/${conf?.id}`}
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  )}

                </div>

              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Payment Badge */
function PaymentBadge({
  paid,
  role,
}: {
  paid: boolean;
  role: "author" | "attendee";
}) {
  if (role === "author") {
    return (
      <Badge className="bg-blue-100 text-blue-700">
        Author
      </Badge>
    );
  }

  if (paid) {
    return (
      <Badge className="bg-green-100 text-green-700">
        Paid
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-700">
      Payment Pending
    </Badge>
  );
}
