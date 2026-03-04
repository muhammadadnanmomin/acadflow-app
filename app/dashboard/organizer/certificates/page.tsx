"use client";

import { useEffect, useState, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Award,
  Download,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Loader2,
  Sparkles,
  Mic,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CertificatePaper {
  id: string;
  title: string;
  payment_status: string | null;
  user_id: string;
  certificate_url: string | null;
  presented: boolean | null;
  presented_at: string | null;
  conferences: {
    id: string;
    title: string;
    organizer_id: string;
  } | null;
  profiles: {
    name: string | null;
    email: string | null;
  } | null;
  /* Future-ready fields */
  certificate_template_id?: string;
  issued_at?: string;
}

type CertificateStatus = "issued" | "ready" | "awaiting_payment" | "awaiting_presentation";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCertificateStatus(paper: CertificatePaper): CertificateStatus {
  if (paper.certificate_url) return "issued";
  if (paper.payment_status !== "paid") return "awaiting_payment";
  if (paper.presented !== true) return "awaiting_presentation";
  return "ready";
}

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrganizerCertificates() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<CertificatePaper[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");

  /* ---------------------------------------------------------------- */
  /*  Data loading (unchanged Supabase query + profiles join)          */
  /* ---------------------------------------------------------------- */

  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        title,
        payment_status,
        user_id,
        presented,
        presented_at,
        conferences!inner (
          id,
          title,
          organizer_id
        ),
        certificate_url:file_url,
        profiles ( name, email )
      `)
      .eq("conferences.organizer_id", profile.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", JSON.stringify(error, null, 2));
      setLoading(false);
      return;
    }

    setPapers((data as any[] as CertificatePaper[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  /* ---------------------------------------------------------------- */
  /*  Generate certificate (unchanged API call)                        */
  /* ---------------------------------------------------------------- */

  async function generateCertificate(p: CertificatePaper) {
    if (p.payment_status !== "paid" || p.presented !== true) return;

    setGeneratingIds((prev) => new Set(prev).add(p.id));

    const authorName = p.profiles?.name || "Participant";
    const conferenceTitle = p.conferences?.title || "Conference";

    try {
      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: p.id,
          authorName,
          conferenceTitle,
          paperTitle: p.title || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Error:", text);
        alert("Certificate generation failed");
        return;
      }

      const data = await res.json();

      if (!data.url) {
        alert("Certificate generation failed");
        return;
      }

      await supabase.from("certificates").insert({
        paper_id: p.id,
        user_id: p.user_id,
        conference_id: p.conferences?.id,
        file_url: data.url,
      });

      await loadPapers();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Bulk generate                                                    */
  /* ---------------------------------------------------------------- */

  async function generateAllCertificates() {
    const eligible = papers.filter(
      (p) =>
        p.payment_status === "paid" &&
        p.presented === true &&
        !p.certificate_url
    );
    if (eligible.length === 0) return;

    setBulkGenerating(true);

    for (const p of eligible) {
      await generateCertificate(p);
    }

    setBulkGenerating(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Mark presented                                                   */
  /* ---------------------------------------------------------------- */

  async function markPresented(p: CertificatePaper) {
    const { error } = await supabase
      .from("paper_submissions")
      .update({
        presented: true,
        presented_at: new Date().toISOString(),
      })
      .eq("id", p.id);

    if (error) {
      console.error("Failed to mark presented:", error);
      alert("Failed to mark as presented");
      return;
    }

    await loadPapers();
  }

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const totalAccepted = papers.length;
  const issuedCount = useMemo(
    () => papers.filter((p) => !!p.certificate_url).length,
    [papers]
  );
  const readyCount = useMemo(
    () =>
      papers.filter(
        (p) =>
          p.payment_status === "paid" &&
          p.presented === true &&
          !p.certificate_url
      ).length,
    [papers]
  );
  const awaitingPresentationCount = useMemo(
    () =>
      papers.filter(
        (p) =>
          p.payment_status === "paid" &&
          p.presented !== true &&
          !p.certificate_url
      ).length,
    [papers]
  );

  const uniqueConferences = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => {
      if (p.conferences?.title) set.add(p.conferences.title);
    });
    return Array.from(set).sort();
  }, [papers]);

  /* Client-side filtering */
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const status = getCertificateStatus(p);

      /* Status filter */
      if (statusFilter === "issued" && status !== "issued") return false;
      if (statusFilter === "ready" && status !== "ready") return false;
      if (statusFilter === "awaiting_payment" && status !== "awaiting_payment")
        return false;
      if (
        statusFilter === "awaiting_presentation" &&
        status !== "awaiting_presentation"
      )
        return false;

      /* Conference filter */
      if (
        conferenceFilter !== "all" &&
        p.conferences?.title !== conferenceFilter
      )
        return false;

      /* Search */
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = p.title?.toLowerCase().includes(q);
        const nameMatch = p.profiles?.name?.toLowerCase().includes(q);
        if (!titleMatch && !nameMatch) return false;
      }

      return true;
    });
  }, [papers, statusFilter, conferenceFilter, searchQuery]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-lg">
            <Award className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
            <p className="text-gray-500 mt-0.5">
              Generate and manage participant certificates
            </p>
          </div>
        </div>

        {/* Header stat badges */}
        {!loading && papers.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
              <FileText className="h-3 w-3" />
              {totalAccepted} Accepted
            </Badge>
            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1.5 text-xs py-1 px-2.5">
              <CheckCircle className="h-3 w-3" />
              {issuedCount} Issued
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1.5 text-xs py-1 px-2.5">
              <Clock className="h-3 w-3" />
              {readyCount} Ready
            </Badge>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Summary Stats                                                */}
      {/* ============================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Accepted Papers"
          value={loading ? "—" : totalAccepted}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Certificates Issued"
          value={loading ? "—" : issuedCount}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Ready to Generate"
          value={loading ? "—" : readyCount}
          icon={Sparkles}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ============================================================ */}
      {/*  Filters                                                      */}
      {/* ============================================================ */}
      {!loading && papers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search paper title or author…"
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
              <option value="issued">Issued</option>
              <option value="ready">Ready</option>
              <option value="awaiting_presentation">Awaiting Presentation</option>
              <option value="awaiting_payment">Awaiting Payment</option>
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
      {/*  Bulk Generate Button                                         */}
      {/* ============================================================ */}
      {!loading && readyCount > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={generateAllCertificates}
            disabled={bulkGenerating}
            className="gap-2"
          >
            {bulkGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All Certificates ({readyCount})
              </>
            )}
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Loading Skeleton                                             */}
      {/* ============================================================ */}
      {loading && (
        <>
          {/* Desktop skeleton */}
          <Card className="p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Paper</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Conference</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Certificate Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Skeleton className="h-8 w-24 ml-auto rounded-md" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile skeleton */}
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-28 rounded-md" />
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/*  Empty State                                                  */}
      {/* ============================================================ */}
      {!loading && papers.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Award className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            No accepted papers yet
          </h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Certificates will appear here once papers are accepted.
          </p>
        </Card>
      )}

      {/* No results from filter */}
      {!loading && papers.length > 0 && filteredPapers.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No papers match the current filters.
        </p>
      )}

      {/* ============================================================ */}
      {/*  Table (Desktop)                                              */}
      {/* ============================================================ */}
      {!loading && filteredPapers.length > 0 && (
        <Card className="p-0 overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4">Paper</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Conference</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Certificate Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPapers.map((p, i) => (
                  <CertificateRow
                    key={p.id}
                    paper={p}
                    index={i}
                    isGenerating={generatingIds.has(p.id)}
                    onGenerate={() => generateCertificate(p)}
                    onMarkPresented={() => markPresented(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Cards (Mobile)                                               */}
      {/* ============================================================ */}
      {!loading && filteredPapers.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredPapers.map((p) => {
            const status = getCertificateStatus(p);
            const isGen = generatingIds.has(p.id);

            return (
              <Card key={p.id} className="p-4 space-y-3">
                {/* Paper title */}
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="font-medium text-gray-900 line-clamp-2">
                    {p.title}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {p.profiles?.name || "Participant"}
                </div>

                {/* Conference */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">
                    {p.conferences?.title || "—"}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <PaymentStatusBadge status={p.payment_status} />
                  <CertificateStatusBadge status={status} />
                  {p.presented && <PresentedBadge />}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {status === "issued" && p.certificate_url ? (
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={p.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={p.certificate_url}
                          download
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </>
                  ) : status === "awaiting_payment" ? (
                    <Button size="sm" disabled variant="outline">
                      Payment Pending
                    </Button>
                  ) : status === "awaiting_presentation" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markPresented(p)}
                    >
                      <Mic className="h-4 w-4 mr-1" />
                      Mark Presented
                    </Button>
                  ) : status === "ready" ? (
                    <Button
                      size="sm"
                      onClick={() => generateCertificate(p)}
                      disabled={isGen}
                    >
                      {isGen ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Award className="h-4 w-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
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
/*  CertificateRow                                                     */
/* ------------------------------------------------------------------ */

function CertificateRow({
  paper: p,
  index: i,
  isGenerating,
  onGenerate,
  onMarkPresented,
}: {
  paper: CertificatePaper;
  index: number;
  isGenerating: boolean;
  onGenerate: () => void;
  onMarkPresented: () => void;
}) {
  const status = getCertificateStatus(p);

  return (
    <tr
      className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""
        }`}
    >
      {/* Paper */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="font-medium text-gray-900 max-w-[220px] truncate">
            {p.title}
          </span>
        </div>
      </td>

      {/* Author */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-gray-900 truncate">
              {p.profiles?.name || "Participant"}
            </p>
            {p.profiles?.email && (
              <p className="text-xs text-gray-500 truncate">
                {p.profiles.email}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Conference */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="max-w-[180px] truncate">
            {p.conferences?.title || "—"}
          </span>
        </div>
      </td>

      {/* Payment */}
      <td className="py-3 px-4">
        <PaymentStatusBadge status={p.payment_status} />
      </td>

      {/* Certificate Status */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <CertificateStatusBadge status={status} />
          {p.presented && <PresentedBadge />}
        </div>
      </td>

      {/* Action */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {status === "issued" && p.certificate_url ? (
            <>
              <Button size="sm" variant="outline" asChild>
                <a
                  href={p.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={p.certificate_url} download>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            </>
          ) : status === "awaiting_payment" ? (
            <Button size="sm" disabled variant="outline">
              Payment Pending
            </Button>
          ) : status === "awaiting_presentation" ? (
            <Button size="sm" variant="outline" onClick={onMarkPresented}>
              <Mic className="h-4 w-4 mr-1" />
              Mark Presented
            </Button>
          ) : status === "ready" ? (
            <Button size="sm" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  CertificateStatusBadge                                             */
/* ------------------------------------------------------------------ */

function CertificateStatusBadge({ status }: { status: CertificateStatus }) {
  if (status === "issued")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
        <CheckCircle className="h-3 w-3" />
        Issued
      </Badge>
    );

  if (status === "ready")
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs gap-1">
        <Clock className="h-3 w-3" />
        Ready
      </Badge>
    );

  if (status === "awaiting_presentation")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs gap-1">
        <Clock className="h-3 w-3" />
        Awaiting Presentation
      </Badge>
    );

  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs gap-1">
      <AlertCircle className="h-3 w-3" />
      Awaiting Payment
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  PaymentStatusBadge                                                 */
/* ------------------------------------------------------------------ */

function PaymentStatusBadge({ status }: { status: string | null }) {
  if (status === "paid")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
        <CheckCircle className="h-3 w-3" />
        Paid
      </Badge>
    );

  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-xs gap-1">
      <AlertCircle className="h-3 w-3" />
      Unpaid
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  PresentedBadge                                                     */
/* ------------------------------------------------------------------ */

function PresentedBadge() {
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
      <Mic className="h-3 w-3" />
      Presented
    </Badge>
  );
}