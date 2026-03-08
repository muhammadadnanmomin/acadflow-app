"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

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
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Landmark,
  ArrowRight,
  Loader2,
  AlertTriangle,
  BarChart3,
  CalendarRange,
} from "lucide-react";

import Link from "next/link";

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BalanceSummary {
  totalEarned: number;
  totalWithdrawn: number;
  pendingPayout: number;
  availableBalance: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
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

function formatINR(n: number) {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMonthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

/* Date filter presets */
type DatePreset = "this_month" | "last_month" | "last_3" | "all";

function getDateRange(preset: DatePreset): { start: Date | null; end: Date } {
  const now = new Date();
  const end = now;

  switch (preset) {
    case "this_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case "last_3":
      return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end };
    default:
      return { start: null, end };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrganizerPayments() {
  const { profile } = useProfile();
  const { organization } = useOrganization();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  /* Ledger balance */
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);

  /* Fee breakdown */
  const [feeBreakdown, setFeeBreakdown] = useState({
    conferenceFees: 0,
    gatewayFees: 0,
    gstFees: 0,
  });

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  /* Payout form */
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Data loading                                                     */
  /* ---------------------------------------------------------------- */

  async function loadPayments() {
    if (!profile) return;
    setLoading(true);

    /* ================= REGISTRATION PAYMENTS ================= */
    const { data: regData } = await supabase
      .from("conference_registrations")
      .select(`
        id, amount, payment_status, payment_id, created_at,
        profiles ( name, email ),
        conferences ( title, organizer_id )
      `)
      .eq("conferences.organizer_id", profile.id);

    /* ================= PAPER PAYMENTS ================= */
    let paperQuery = supabase
      .from("paper_submissions")
      .select(`
        id, presentation_fee, payment_status, presentation_payment_id, created_at,
        payment_conference_fee, payment_gateway_fee, payment_gst,
        user_id, profiles ( name, email ),
        conferences ( title, organizer_id )
      `)
      .eq("payment_status", "paid");

    if (organization) {
      paperQuery = paperQuery.or(
        `conferences.organizer_id.eq.${profile.id}`
      );
    } else {
      paperQuery = paperQuery.eq("conferences.organizer_id", profile.id);
    }

    const { data: paperData } = await paperQuery;

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
        conferenceFee: p.amount || 0,
        gatewayFee: 0,
        gst: 0,
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
        conferenceFee: Number(p.payment_conference_fee) || p.presentation_fee || 0,
        gatewayFee: Number(p.payment_gateway_fee) || 0,
        gst: Number(p.payment_gst) || 0,
      })) || [];

    const allPayments = [...formattedRegs, ...formattedPapers].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

    /* Fee breakdown */
    const paidPayments = allPayments.filter(
      (p) => p.status === "success" || p.status === "paid"
    );
    setFeeBreakdown({
      conferenceFees: paidPayments.reduce((s, p) => s + p.conferenceFee, 0),
      gatewayFees: paidPayments.reduce((s, p) => s + p.gatewayFee, 0),
      gstFees: paidPayments.reduce((s, p) => s + p.gst, 0),
    });

    setLoading(false);
  }

  const fetchBalance = useCallback(async () => {
    if (!profile) return;
    setBalanceLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/payouts/organizer", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBalance(json.balance);
        setPayouts(json.payouts);
      }
    } catch {
      /* silent */
    }
    setBalanceLoading(false);
  }, [profile]);

  useEffect(() => {
    loadPayments();
    fetchBalance();
  }, [profile, organization]);

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
    const dateRange = getDateRange(datePreset);

    return payments.filter((p) => {
      /* Date */
      if (dateRange.start) {
        const pDate = new Date(p.created_at);
        if (pDate < dateRange.start || pDate > dateRange.end) return false;
      }

      /* Status */
      if (statusFilter === "paid" && p.status !== "success" && p.status !== "paid")
        return false;
      if (statusFilter === "pending" && p.status !== "pending") return false;
      if (statusFilter === "failed" && p.status !== "failed") return false;

      /* Type */
      if (typeFilter === "registration" && p.type !== "Registration") return false;
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
  }, [payments, statusFilter, typeFilter, conferenceFilter, searchQuery, datePreset]);

  /* Monthly earnings (last 6 months) */
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    const now = new Date();
    // Seed last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map[getMonthKey(d.toISOString())] = 0;
    }
    payments
      .filter((p) => p.status === "success" || p.status === "paid")
      .forEach((p) => {
        const k = getMonthKey(p.created_at);
        if (k in map) map[k] += p.conferenceFee || 0;
      });
    return Object.entries(map).map(([key, total]) => ({
      key,
      label: getMonthLabel(key),
      total,
    }));
  }, [payments]);

  const maxMonthly = useMemo(
    () => Math.max(...monthlyData.map((d) => d.total), 1),
    [monthlyData]
  );

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
      "Conference Fee",
      "Gateway Fee",
      "GST",
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
      p.conferenceFee ?? "",
      p.gatewayFee ?? "",
      p.gst ?? "",
      p.status === "success" || p.status === "paid"
        ? "Paid"
        : p.status === "failed"
          ? "Failed"
          : "Pending",
      p.payment_id || "",
      p.created_at ? formatDate(p.created_at) : "",
    ]);

    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------------------------------------------------------- */
  /*  Payout request                                                   */
  /* ---------------------------------------------------------------- */

  async function requestPayout() {
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    setSubmittingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/payouts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount: amt, notes: payoutNotes.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
      } else {
        toast({ title: "Payout request submitted ✓" });
        setShowPayoutForm(false);
        setPayoutAmount("");
        setPayoutNotes("");
        await fetchBalance();
      }
    } catch {
      toast({ variant: "destructive", title: "Something went wrong" });
    }
    setSubmittingPayout(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const netEarnings = feeBreakdown.conferenceFees;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Earnings &amp; Payments
          </h1>
          <p className="text-gray-500 mt-1">
            Track collections, earnings, and manage payouts
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
      {/*  Ledger Balance Cards (row 1)                                 */}
      {/* ============================================================ */}
      {!balanceLoading && balance && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Balance"
            value={`₹${formatINR(balance.availableBalance)}`}
            icon={Wallet}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <StatCard
            title="Pending Payout"
            value={`₹${formatINR(balance.pendingPayout)}`}
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Total Withdrawn"
            value={`₹${formatINR(balance.totalWithdrawn)}`}
            icon={ArrowDownToLine}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            title="Total Earned"
            value={`₹${formatINR(balance.totalEarned)}`}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  Collection Stats (row 2)                                     */}
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
      {/* Monthly Earnings Chart + Fee Breakdown Row                    */}
      {/* ============================================================ */}
      <div className="grid gap-6 md:grid-cols-5">

        {/* Monthly Earnings (3 cols) */}
        <Card className="p-5 md:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Monthly Earnings</h3>
          </div>

          <div className="flex items-end justify-between gap-2 h-36">
            {monthlyData.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 font-medium">
                  {m.total > 0 ? `₹${Math.round(m.total).toLocaleString()}` : ""}
                </span>
                <div className="w-full max-w-[40px] flex items-end" style={{ height: "100px" }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max(4, (m.total / maxMonthly) * 100)}%`,
                      background:
                        m.total > 0
                          ? "linear-gradient(to top, #6366f1, #818cf8)"
                          : "#e5e7eb",
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Fee Breakdown (2 cols) */}
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Fee Breakdown</h3>
          </div>

          <div className="space-y-3">
            <FeeRow label="Conference Fees (Your Share)" value={feeBreakdown.conferenceFees} color="text-emerald-600" />
            <FeeRow label="Gateway Fees (Razorpay)" value={feeBreakdown.gatewayFees} color="text-gray-500" />
            <FeeRow label="GST on Gateway" value={feeBreakdown.gstFees} color="text-gray-500" />
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Net Earnings</span>
              <span className="text-lg font-bold text-emerald-600">₹{formatINR(netEarnings)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  Payout Section                                               */}
      {/* ============================================================ */}
      {!balanceLoading && balance && (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b bg-gray-50/60 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-100">
                <ArrowDownToLine className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Payouts</span>
                <span className="text-xs text-gray-400">
                  Available: ₹{formatINR(balance.availableBalance)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {balance.availableBalance > 0 && !showPayoutForm && (
                <Button
                  size="sm"
                  onClick={() => setShowPayoutForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Request Payout
                </Button>
              )}
              <Link href="/dashboard/organizer/bank-details">
                <Button size="sm" variant="outline" className="gap-2">
                  <Landmark className="h-3.5 w-3.5" />
                  Bank Details
                </Button>
              </Link>
            </div>
          </div>

          {/* Payout request form */}
          {showPayoutForm && (
            <div className="p-5 border-b space-y-3 bg-indigo-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder={`Max: ₹${formatINR(balance.availableBalance)}`}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    min={1}
                    max={balance.availableBalance}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Notes (optional)
                  </label>
                  <Input
                    placeholder="e.g., Monthly settlement"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Settlement typically takes 2–3 business days.</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={submittingPayout || !payoutAmount}
                  onClick={requestPayout}
                >
                  {submittingPayout ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPayoutForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Recent payout history */}
          {payouts.length > 0 && (
            <div className="divide-y max-h-52 overflow-y-auto">
              {payouts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <PayoutBadge status={p.status} />
                    <span className="font-medium text-gray-800">₹{formatINR(p.amount)}</span>
                    {p.notes && <span className="text-xs text-gray-400">— {p.notes}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(p.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          {payouts.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-400 text-center">No payout history yet</p>
          )}

          {payouts.length > 5 && (
            <div className="border-t p-3 text-center">
              <Link
                href="/dashboard/organizer/payouts"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 justify-center"
              >
                View all payouts <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Filters                                                      */}
      {/* ============================================================ */}
      {payments.length > 0 && (
        <Card className="p-4 space-y-3">
          {/* Quick date filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarRange className="h-4 w-4 text-gray-400" />
            {(
              [
                { key: "all", label: "All Time" },
                { key: "this_month", label: "This Month" },
                { key: "last_month", label: "Last Month" },
                { key: "last_3", label: "Last 3 Months" },
              ] as const
            ).map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={datePreset === p.key ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setDatePreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                      <Badge variant="secondary" className="text-xs">
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
/*  Sub-Components                                                     */
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

function PayoutBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-[11px] gap-0.5">
        <CheckCircle className="h-3 w-3" /> Completed
      </Badge>
    );
  if (status === "processing")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[11px] gap-0.5">
        <Loader2 className="h-3 w-3" /> Processing
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-[11px] gap-0.5">
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[11px] gap-0.5">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

function FeeRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>
        ₹{formatINR(value)}
      </span>
    </div>
  );
}