"use client";

import { useEffect, useState, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  IndianRupee,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Download,
  FileText,
  Filter,
} from "lucide-react";

const supabase = createClient();

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

function getCurrencySymbol(currency: string | null) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "INR":
    default:
      return "₹";
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrganizerPayments() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");

  /* ---------------------------------------------------------------- */
  /*  Data loading (unchanged Supabase queries)                        */
  /* ---------------------------------------------------------------- */

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
      (sum, p) =>
        p.status === "success" || p.status === "paid"
          ? sum + (p.amount || 0)
          : sum,
      0
    );

    setTotal(totalAmount);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, [profile]);

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const successfulCount = useMemo(
    () =>
      payments.filter(
        (p) => p.status === "success" || p.status === "paid"
      ).length,
    [payments]
  );

  const pendingCount = useMemo(
    () => payments.filter((p) => p.status === "pending").length,
    [payments]
  );

  const uniqueConferences = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.conference) set.add(p.conference);
    });
    return Array.from(set).sort();
  }, [payments]);

  /* Client-side filtering */
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      /* Status */
      if (statusFilter === "paid" && p.status !== "success" && p.status !== "paid")
        return false;
      if (statusFilter === "pending" && p.status !== "pending") return false;
      if (statusFilter === "failed" && p.status !== "failed") return false;

      /* Type */
      if (typeFilter === "registration" && p.type !== "Registration")
        return false;
      if (typeFilter === "paper" && p.type !== "Paper Fee") return false;

      /* Conference */
      if (conferenceFilter !== "all" && p.conference !== conferenceFilter)
        return false;

      /* Search */
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.participant?.name?.toLowerCase().includes(q);
        const emailMatch = p.participant?.email?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [payments, statusFilter, typeFilter, conferenceFilter, searchQuery]);

  /* ---------------------------------------------------------------- */
  /*  CSV Export                                                        */
  /* ---------------------------------------------------------------- */

  function exportCSV() {
    const headers = [
      "Participant Name",
      "Email",
      "Conference",
      "Type",
      "Amount",
      "Status",
      "Payment ID",
      "Date",
    ];

    const rows = filteredPayments.map((p) => [
      p.participant?.name || "",
      p.participant?.email || "",
      p.conference || "",
      p.type,
      p.amount ?? "",
      p.status === "success" || p.status === "paid"
        ? "Paid"
        : p.status === "failed"
          ? "Failed"
          : "Pending",
      p.payment_id || "",
      p.created_at ? formatDate(p.created_at) : "",
    ]);

    const csv =
      [headers, ...rows].map((r) =>
        r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Payments &amp; Collections
          </h1>
          <p className="text-gray-500 mt-1">
            Track participant registrations &amp; paper fee collections
          </p>
        </div>

        {payments.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Summary Stats                                                */}
      {/* ============================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collections"
          value={`₹${total.toLocaleString()}`}
          icon={IndianRupee}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Successful Payments"
          value={successfulCount}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Pending Payments"
          value={pendingCount}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Total Transactions"
          value={payments.length}
          icon={CreditCard}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* ============================================================ */}
      {/*  Filters                                                      */}
      {/* ============================================================ */}
      {payments.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="registration">Registration</option>
              <option value="paper">Paper Fee</option>
            </select>

            {/* Conference */}
            <select
              value={conferenceFilter}
              onChange={(e) => setConferenceFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="all">All Conferences</option>
              {uniqueConferences.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Loading                                                      */}
      {/* ============================================================ */}
      {loading && (
        <p className="text-sm text-gray-500 py-8 text-center">
          Loading payments…
        </p>
      )}

      {/* ============================================================ */}
      {/*  Empty State                                                  */}
      {/* ============================================================ */}
      {!loading && payments.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            No payments recorded yet
          </h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Participant registrations and paper fee collections will appear here.
          </p>
        </Card>
      )}

      {/* No results from filter */}
      {!loading && payments.length > 0 && filteredPayments.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No payments match the current filters.
        </p>
      )}

      {/* ============================================================ */}
      {/*  Payments Table (Desktop)                                     */}
      {/* ============================================================ */}
      {!loading && filteredPayments.length > 0 && (
        <Card className="p-0 overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Conference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""
                      }`}
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {p.participant?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.participant?.email || "—"}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-gray-700 max-w-[200px] truncate">
                      {p.conference || "—"}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        {p.type}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ₹{(p.amount || 0).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3 px-4 text-xs text-gray-400 font-mono">
                      {p.payment_id || "—"}
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      {formatDate(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Payments Cards (Mobile)                                      */}
      {/* ============================================================ */}
      {!loading && filteredPayments.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredPayments.map((p) => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {p.participant?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.participant?.email || "—"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 truncate max-w-[60%]">
                  {p.conference || "—"}
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{(p.amount || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <Badge variant="secondary" className="text-[11px]">
                  {p.type}
                </Badge>
                <span>{formatDate(p.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>

      <div className={`${iconBg} p-3 rounded-lg`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusBadge                                                        */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  if (status === "success" || status === "paid")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
        <CheckCircle className="h-3 w-3" />
        Paid
      </Badge>
    );

  if (status === "failed")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );

  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}