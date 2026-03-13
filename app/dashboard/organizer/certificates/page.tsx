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
  Users,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthorCertRow {
  paperId: string;
  paperTitle: string;
  paymentStatus: string | null;
  presented: boolean | null;
  presentedAt: string | null;
  conferenceId: string;
  conferenceTitle: string;
  authorId: string;
  authorName: string;
  authorEmail: string | null;
  authorOrder: number;
  isPrimary: boolean;
  certificateUrl: string | null;
  certificateId: string | null;
  verificationCode: string | null;
  issuedAt: string | null;
}

interface PaperGroup {
  paperId: string;
  paperTitle: string;
  paymentStatus: string | null;
  presented: boolean | null;
  conferenceId: string;
  conferenceTitle: string;
  authors: AuthorCertRow[];
}

type CertificateStatus = "issued" | "ready" | "awaiting_payment" | "awaiting_presentation";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStatus(row: AuthorCertRow): CertificateStatus {
  if (row.certificateUrl) return "issued";
  if (row.paymentStatus !== "paid") return "awaiting_payment";
  if (row.presented !== true) return "awaiting_presentation";
  return "ready";
}

function groupByPaper(rows: AuthorCertRow[]): PaperGroup[] {
  const map = new Map<string, PaperGroup>();

  for (const r of rows) {
    if (!map.has(r.paperId)) {
      map.set(r.paperId, {
        paperId: r.paperId,
        paperTitle: r.paperTitle,
        paymentStatus: r.paymentStatus,
        presented: r.presented,
        conferenceId: r.conferenceId,
        conferenceTitle: r.conferenceTitle,
        authors: [],
      });
    }
    map.get(r.paperId)!.authors.push(r);
  }

  return Array.from(map.values());
}

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrganizerCertificates() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AuthorCertRow[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conferenceFilter, setConferenceFilter] = useState("all");

  /* ---------------------------------------------------------------- */
  /*  Data loading                                                     */
  /* ---------------------------------------------------------------- */

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    const { data: papers, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        title,
        payment_status,
        presented,
        presented_at,
        conferences!inner (
          id,
          title,
          organizer_id
        )
      `)
      .eq("conferences.organizer_id", profile.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error || !papers) {
      console.error("Load papers error:", error);
      setLoading(false);
      return;
    }

    const paperIds = papers.map((p: any) => p.id);

    if (paperIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: authors } = await supabase
      .from("paper_authors")
      .select("id, submission_id, name, email, author_order, is_primary")
      .in("submission_id", paperIds)
      .order("author_order", { ascending: true });

    const certsRes = await fetch("/api/certificates/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperIds }),
    });
    const certs = certsRes.ok ? await certsRes.json() : [];

    const certMap = new Map<string, any>();
    (certs || []).forEach((c: any) => {
      certMap.set(`${c.paper_id}_${c.author_id}`, c);
    });

    const result: AuthorCertRow[] = [];

    for (const p of papers as any[]) {
      const conf = p.conferences;
      const paperAuthors = (authors || []).filter(
        (a: any) => a.submission_id === p.id
      );

      if (paperAuthors.length === 0) {
        result.push({
          paperId: p.id,
          paperTitle: p.title,
          paymentStatus: p.payment_status,
          presented: p.presented,
          presentedAt: p.presented_at,
          conferenceId: conf?.id || "",
          conferenceTitle: conf?.title || "—",
          authorId: "",
          authorName: "Unknown Author",
          authorEmail: null,
          authorOrder: 1,
          isPrimary: true,
          certificateUrl: null,
          certificateId: null,
          verificationCode: null,
          issuedAt: null,
        });
        continue;
      }

      for (const a of paperAuthors) {
        const cert = certMap.get(`${p.id}_${a.id}`);
        result.push({
          paperId: p.id,
          paperTitle: p.title,
          paymentStatus: p.payment_status,
          presented: p.presented,
          presentedAt: p.presented_at,
          conferenceId: conf?.id || "",
          conferenceTitle: conf?.title || "—",
          authorId: a.id,
          authorName: a.name || "Author",
          authorEmail: a.email || null,
          authorOrder: a.author_order,
          isPrimary: a.is_primary || false,
          certificateUrl: cert?.file_url || null,
          certificateId: cert?.id || null,
          verificationCode: cert?.verification_code || null,
          issuedAt: cert?.issued_at || null,
        });
      }
    }

    setRows(result);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  /* ---------------------------------------------------------------- */
  /*  Generate certificate                                             */
  /* ---------------------------------------------------------------- */

  async function generateCertificate(row: AuthorCertRow) {
    if (row.paymentStatus !== "paid" || row.presented !== true || !row.authorId) return;

    const key = `${row.paperId}_${row.authorId}`;
    setGeneratingIds((prev) => new Set(prev).add(key));

    try {
      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: row.paperId,
          authorId: row.authorId,
          authorName: row.authorName,
          conferenceId: row.conferenceId,
          conferenceTitle: row.conferenceTitle,
          paperTitle: row.paperTitle || undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Error:", text);
        alert("Certificate generation failed");
        return;
      }

      const data = await res.json();

      setRows(prev =>
        prev.map(r =>
          r.paperId === row.paperId && r.authorId === row.authorId
            ? {
                ...r,
                certificateUrl: data.url,
                certificateId: data.certificateId,
                verificationCode: data.verificationCode,
                issuedAt: new Date().toISOString()
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Bulk generate                                                    */
  /* ---------------------------------------------------------------- */

  async function generateAllCertificates() {
    const eligible = rows.filter(
      (r) =>
        r.paymentStatus === "paid" &&
        r.presented === true &&
        !r.certificateUrl &&
        r.authorId
    );
    if (eligible.length === 0) return;

    setBulkGenerating(true);

    const batchSize = 20;
    for (let i = 0; i < eligible.length; i += batchSize) {
      const batch = eligible.slice(i, i + batchSize);
      await Promise.all(batch.map((r) => generateCertificate(r)));
    }

    setBulkGenerating(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Mark presented                                                   */
  /* ---------------------------------------------------------------- */

  async function markPresented(paperId: string) {
    const { error } = await supabase
      .from("paper_submissions")
      .update({
        presented: true,
        presented_at: new Date().toISOString(),
      })
      .eq("id", paperId);

    if (error) {
      console.error("Failed to mark presented:", error);
      alert("Failed to mark as presented");
      return;
    }

    await loadData();
  }

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const totalAuthors = rows.length;
  const issuedCount = useMemo(
    () => rows.filter((r) => !!r.certificateUrl).length,
    [rows]
  );
  const readyCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.paymentStatus === "paid" &&
          r.presented === true &&
          !r.certificateUrl &&
          r.authorId
      ).length,
    [rows]
  );

  const uniqueConferences = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.conferenceTitle) set.add(r.conferenceTitle);
    });
    return Array.from(set).sort();
  }, [rows]);

  /* Client-side filter + group */
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const status = getStatus(r);
      if (statusFilter === "issued" && status !== "issued") return false;
      if (statusFilter === "ready" && status !== "ready") return false;
      if (statusFilter === "awaiting_payment" && status !== "awaiting_payment") return false;
      if (statusFilter === "awaiting_presentation" && status !== "awaiting_presentation") return false;
      if (conferenceFilter !== "all" && r.conferenceTitle !== conferenceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = r.paperTitle?.toLowerCase().includes(q);
        const nameMatch = r.authorName?.toLowerCase().includes(q);
        if (!titleMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [rows, statusFilter, conferenceFilter, searchQuery]);

  const paperGroups = useMemo(() => groupByPaper(filteredRows), [filteredRows]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-lg">
            <Award className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
            <p className="text-gray-500 mt-0.5">
              Generate and manage author certificates
            </p>
          </div>
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
              <Users className="h-3 w-3" />
              {totalAuthors} Authors
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Author Certificates" value={loading ? "—" : totalAuthors} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Certificates Issued" value={loading ? "—" : issuedCount} icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard title="Ready to Generate" value={loading ? "—" : readyCount} icon={Sparkles} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Filters */}
      {!loading && rows.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search paper title or author…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="issued">Certificate Issued</option>
              <option value="ready">Ready for Certificate</option>
              <option value="awaiting_presentation">Awaiting Presentation</option>
              <option value="awaiting_payment">Awaiting Payment</option>
            </select>
            <select
              value={conferenceFilter}
              onChange={(e) => setConferenceFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="all">All Conferences</option>
              {uniqueConferences.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Bulk Generate */}
      {!loading && readyCount > 0 && (
        <div className="flex justify-end">
          <Button onClick={generateAllCertificates} disabled={bulkGenerating} className="gap-2">
            {bulkGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate All Certificates ({readyCount})</>
            )}
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Award className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">No accepted papers yet</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Certificates will appear here once papers are accepted.
          </p>
        </Card>
      )}

      {/* No filter match */}
      {!loading && rows.length > 0 && filteredRows.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No papers match the current filters.
        </p>
      )}

      {/* ============================================================ */}
      {/*  Paper Cards (grouped by paper)                               */}
      {/* ============================================================ */}
      {!loading && paperGroups.length > 0 && (
        <div className="space-y-4">
          {paperGroups.map((group) => {
            const allIssued = group.authors.every((a) => !!a.certificateUrl);
            const someIssued = group.authors.some((a) => !!a.certificateUrl);

            return (
              <Card key={group.paperId} className="overflow-hidden">
                {/* Paper Header */}
                <div className="flex items-start justify-between gap-3 p-5 border-b bg-gray-50/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">
                        {group.paperTitle}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {group.conferenceTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {allIssued ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" />
                        All Issued
                      </Badge>
                    ) : someIssued ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        Partially Issued
                      </Badge>
                    ) : group.presented ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs gap-1">
                        <Mic className="h-3 w-3" />
                        Presented
                      </Badge>
                    ) : null}

                    {!group.presented && group.paymentStatus === "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markPresented(group.paperId)}
                      >
                        <Mic className="h-4 w-4 mr-1" />
                        Mark Presented
                      </Button>
                    )}
                  </div>
                </div>

                {/* Authors Table */}
                <div className="p-0">
                  {/* Desktop */}
                  <table className="w-full text-sm hidden md:table">
                    <thead>
                      <tr className="border-b bg-gray-50/40 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="py-2.5 px-5">Author</th>
                        <th className="py-2.5 px-5">Role</th>
                        <th className="py-2.5 px-5">Certificate Status</th>
                        <th className="py-2.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.authors.map((a) => {
                        const status = getStatus(a);
                        const key = `${a.paperId}_${a.authorId}`;
                        const isGen = generatingIds.has(key);

                        return (
                          <tr key={key} className="border-b last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 px-5">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">{a.authorName}</p>
                                {a.authorEmail && (
                                  <p className="text-xs text-gray-500 truncate">{a.authorEmail}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              {a.isPrimary ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Primary Author</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Co-Author</Badge>
                              )}
                            </td>
                            <td className="py-3 px-5">
                              <CertificateStatusBadge status={status} />
                            </td>
                            <td className="py-3 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {status === "issued" && a.certificateUrl ? (
                                  <>
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={a.certificateUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-4 w-4 mr-1" />
                                        Preview
                                      </a>
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                      <a href={a.certificateUrl} download>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </a>
                                    </Button>
                                    {a.verificationCode && (
                                      <Button size="sm" variant="outline" asChild>
                                        <a
                                          href={`/verify/${a.verificationCode}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ShieldCheck className="h-4 w-4 mr-1" />
                                          Verify
                                        </a>
                                      </Button>
                                    )}
                                  </>
                                ) : status === "awaiting_payment" ? (
                                  <Button size="sm" disabled variant="outline">Payment Pending</Button>
                                ) : status === "ready" ? (
                                  <Button size="sm" onClick={() => generateCertificate(a)} disabled={isGen}>
                                    {isGen ? (
                                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
                                    ) : (
                                      <><Award className="h-4 w-4 mr-1" /> Generate</>
                                    )}
                                  </Button>
                                ) : status === "awaiting_presentation" ? (
                                  <span className="text-xs text-gray-400">Awaiting Presentation</span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile */}
                  <div className="md:hidden divide-y">
                    {group.authors.map((a) => {
                      const status = getStatus(a);
                      const key = `${a.paperId}_${a.authorId}`;
                      const isGen = generatingIds.has(key);

                      return (
                        <div key={key} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-medium text-sm">{a.authorName}</span>
                            </div>
                            {a.isPrimary ? (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Primary</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Co-Author</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <CertificateStatusBadge status={status} />
                          </div>

                          <div className="flex items-center gap-2">
                            {status === "issued" && a.certificateUrl ? (
                              <>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={a.certificateUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4 mr-1" /> Preview
                                  </a>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={a.certificateUrl} download>
                                    <Download className="h-4 w-4 mr-1" /> Download
                                  </a>
                                </Button>
                                {a.verificationCode && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a
                                      href={`/verify/${a.verificationCode}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ShieldCheck className="h-4 w-4 mr-1" /> Verify
                                    </a>
                                  </Button>
                                )}
                              </>
                            ) : status === "ready" ? (
                              <Button size="sm" onClick={() => generateCertificate(a)} disabled={isGen}>
                                {isGen ? (
                                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
                                ) : (
                                  <><Award className="h-4 w-4 mr-1" /> Generate</>
                                )}
                              </Button>
                            ) : status === "awaiting_payment" ? (
                              <Button size="sm" disabled variant="outline">Payment Pending</Button>
                            ) : (
                              <span className="text-xs text-gray-400">Awaiting Presentation</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
/*  CertificateStatusBadge                                             */
/* ------------------------------------------------------------------ */

function CertificateStatusBadge({ status }: { status: CertificateStatus }) {
  if (status === "issued")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
        <CheckCircle className="h-3 w-3" />
        Certificate Issued
      </Badge>
    );

  if (status === "ready")
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs gap-1">
        <Sparkles className="h-3 w-3" />
        Ready for Certificate
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