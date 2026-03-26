"use client";

import { useEffect, useState, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile }   from "@/lib/auth/useProfile";

import { Card }     from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Input }    from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Award,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const supabase = createClient();

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ParticipantCertificatesPage() {
  const { profile } = useProfile();

  const [loading, setLoading]           = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("certificates")
      .select(`
        id,
        file_url,
        issued_at,
        verification_code,
        paper_authors!inner (
          id,
          name,
          email
        ),
        paper_submissions:paper_id (
          title
        ),
        conferences (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq("paper_authors.email", profile.email)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCertificates(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const totalCertificates = certificates.length;

  const latestIssuedDate = useMemo(() => {
    if (certificates.length === 0) return "—";
    return formatDate(certificates[0]?.issued_at);
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const conf    = c.conferences;
      const hasFile = !!c.file_url;

      if (statusFilter === "available"     && !hasFile) return false;
      if (statusFilter === "not_available" &&  hasFile) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!conf?.title?.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [certificates, statusFilter, searchQuery]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-50 p-2.5 rounded-lg">
          <Award className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="text-gray-500 mt-0.5">
            Download your conference participation certificates
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Total Certificates"
          value={loading ? "—" : totalCertificates}
          icon={Award}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Latest Certificate"
          value={loading ? "—" : latestIssuedDate}
          icon={Calendar}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* Filters */}
      {!loading && certificates.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by conference title…"
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
              <option value="available">Available</option>
              <option value="not_available">Not Available</option>
            </select>
          </div>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <div className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && certificates.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Award className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            No certificates yet
          </h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Certificates will appear here after your paper is presented and
            approved.
          </p>
        </Card>
      )}

      {/* No filter results */}
      {!loading && certificates.length > 0 && filteredCertificates.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No certificates match the current filters.
        </p>
      )}

      {/* Certificate Cards */}
      {!loading && filteredCertificates.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCertificates.map((c) => (
            <CertificateCard key={c.id} certificate={c} />
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
/*  CertificateCard                                                    */
/* ------------------------------------------------------------------ */

function CertificateCard({ certificate: c }: { certificate: any }) {
  const conf    = c.conferences;
  const hasFile = !!c.file_url;

  return (
    <Card className="p-5 space-y-4 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Award className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <span className="font-semibold text-gray-900 line-clamp-2">
            {conf?.title}
          </span>
        </div>

        {hasFile ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1 shrink-0">
            <CheckCircle className="h-3 w-3" />
            Available
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Not Available
          </Badge>
        )}
      </div>

      {/* Conference dates */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="h-4 w-4 shrink-0" />
        {formatDate(conf?.start_date)} → {formatDate(conf?.end_date)}
      </div>

      {/* Paper title */}
      {c.paper_submissions?.title && (
        <p className="text-sm text-gray-600">
          <span className="text-gray-400">Paper:</span>{" "}
          <span className="font-medium">{c.paper_submissions.title}</span>
        </p>
      )}

      {/* Issued date */}
      <p className="text-sm text-gray-500">
        Certificate issued on:{" "}
        <span className="text-gray-700 font-medium">{formatDate(c.issued_at)}</span>
      </p>

      {/* Action row — participants can only download PDF */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        {hasFile ? (
          <>
            <Button size="sm" variant="outline" asChild>
              <a href={c.file_url} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href={c.file_url} download>
                <FileText className="h-4 w-4 mr-1" />
                Download PDF
              </a>
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" disabled>
            <Clock className="h-4 w-4 mr-1" />
            Not Available Yet
          </Button>
        )}
      </div>
    </Card>
  );
}