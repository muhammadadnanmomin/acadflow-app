"use client";

import { useState, useEffect, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

import ShareConference from "@/components/shared/ShareConference";

import {
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Search,
  Monitor,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Tag,
  Pencil,
  Share2,
  ExternalLink,
} from "lucide-react";

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string | null) {
  if (!date) return "—";
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

export default function OrganizerConferences() {
  const { profile } = useProfile();
  const { organization } = useOrganization();

  const [conferences, setConferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareDialogConf, setShareDialogConf] = useState<{ id: string; title: string } | null>(null);

  /* Load conferences */
  async function loadConferences() {
    if (!profile || !organization) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("conferences")
      .select("*")
      .or(
        `organizer_id.eq.${profile.id},organization_id.eq.${organization.id}`
      )
      .order("created_at", { ascending: false });

    if (!error) {
      setConferences(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadConferences();
  }, [profile, organization]);

  /* Publish / Unpublish */
  async function togglePublish(id: string, value: boolean) {
    const { error } = await supabase
      .from("conferences")
      .update({ is_published: value })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return;
    }

    // On publish → show share popup instead of plain toast
    if (value) {
      const conf = conferences.find((c) => c.id === id);
      setShareDialogConf({ id, title: conf?.title || "Conference" });
    } else {
      toast({
        title: "Unpublished",
        description: "Conference is now in draft mode.",
      });
    }

    loadConferences();
  }

  /* Delete */
  async function deleteConference(id: string) {
    if (!confirm("Delete this conference?")) return;

    const { error } = await supabase
      .from("conferences")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Conference deleted",
      description: "Conference removed successfully.",
    });

    loadConferences();
  }

  /* Client-side search filter */
  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conferences;
    const q = searchQuery.toLowerCase();
    return conferences.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.short_name?.toLowerCase().includes(q) ||
        c.venue?.toLowerCase().includes(q)
    );
  }, [conferences, searchQuery]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ============================================================ */}
      {/*  Page Header                                                  */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conferences</h1>
          <p className="text-gray-500 mt-1">
            Manage your academic events
          </p>
        </div>

        <Link href="/dashboard/organizer/conferences/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Conference
          </Button>
        </Link>
      </div>

      {/* ============================================================ */}
      {/*  Search Bar                                                   */}
      {/* ============================================================ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by title, short name, or venue…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ============================================================ */}
      {/*  Loading State                                                */}
      {/* ============================================================ */}
      {loading && (
        <p className="text-sm text-gray-500 py-8 text-center">
          Loading conferences…
        </p>
      )}

      {/* ============================================================ */}
      {/*  Empty State                                                  */}
      {/* ============================================================ */}
      {!loading && conferences.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Calendar className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            No conferences yet
          </h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            You haven&apos;t created any conferences yet. Get started by
            creating your first academic event.
          </p>
          <Link href="/dashboard/organizer/conferences/new" className="mt-6 inline-block">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Conference
            </Button>
          </Link>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  No search results                                            */}
      {/* ============================================================ */}
      {!loading && conferences.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No conferences match &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      {/* ============================================================ */}
      {/*  Conference Cards                                             */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {filtered.map((c) => {
          const tracks: string[] = c.tracks ?? [];
          const submissionsOpen =
            c.submission_deadline && c.submission_deadline >= today;
          const submissionsClosed =
            c.submission_deadline && c.submission_deadline < today;

          return (
            <Card
              key={c.id}
              className="rounded-xl shadow-sm hover:shadow-md transition-shadow p-0 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5">

                {/* ---- Left: Logo + Info ---- */}
                <div className="flex items-start gap-4 min-w-0 flex-1">

                  {/* Logo */}
                  {c.conference_logo_url ? (
                    <img
                      src={c.conference_logo_url}
                      alt=""
                      className="h-12 w-12 rounded-lg border border-gray-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-2">

                    {/* Title Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/organizer/conferences/${c.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate"
                      >
                        {c.title}
                      </Link>

                      {c.short_name && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {c.short_name}
                        </Badge>
                      )}

                      {/* Published / Draft */}
                      <Badge
                        className={`text-xs shrink-0 ${c.is_published
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        {c.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    {/* Date + Meta Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">

                      {/* Date */}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(c.start_date)} → {formatDate(c.end_date)}
                      </span>

                      {/* Mode */}
                      {c.mode && (
                        <Badge variant="outline" className="text-xs capitalize">
                          <Monitor className="h-3 w-3" />
                          {c.mode}
                        </Badge>
                      )}

                      {/* Currency */}
                      {c.currency && (
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3" />
                          {c.currency}
                        </Badge>
                      )}

                      {/* Submission status */}
                      {submissionsOpen && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3" />
                          Submissions Open
                        </Badge>
                      )}
                      {submissionsClosed && (
                        <Badge variant="secondary" className="text-xs text-red-600 bg-red-50 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3 w-3" />
                          Closed
                        </Badge>
                      )}
                    </div>

                    {/* Quick Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      {c.max_participants && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Max {c.max_participants}
                        </span>
                      )}

                      {c.payment_required === false ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Free
                        </span>
                      ) : c.currency ? (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Paid ({getCurrencySymbol(c.currency)})
                        </span>
                      ) : null}
                    </div>

                    {/* Tracks */}
                    {tracks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Tag className="h-3 w-3 text-gray-400 shrink-0" />
                        {tracks.slice(0, 3).map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[11px] px-2 py-0"
                          >
                            {t}
                          </Badge>
                        ))}
                        {tracks.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{tracks.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ---- Right: Action Buttons ---- */}
                <div className="flex flex-wrap gap-2 shrink-0 sm:pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      togglePublish(c.id, !c.is_published)
                    }
                    className="gap-1.5"
                  >
                    {c.is_published ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Publish
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/dashboard/organizer/conferences/${c.id}/edit`}
                  >
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteConference(c.id)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

              </div>
            </Card>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/*  Share Dialog — shown after publishing                        */}
      {/* ============================================================ */}
      <Dialog
        open={!!shareDialogConf}
        onOpenChange={(open) => { if (!open) setShareDialogConf(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conference Published Successfully 🎉</DialogTitle>
            <DialogDescription>
              Your conference is now live. Share it with researchers to attract submissions.
            </DialogDescription>
          </DialogHeader>

          {shareDialogConf && (
            <div className="space-y-4">
              {/* Public URL */}
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Public Conference URL</p>
                <p className="text-sm font-medium text-indigo-600 break-all">
                  {`${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/conferences/${shareDialogConf.id}`}
                </p>
              </div>

              {/* Share buttons */}
              <ShareConference
                url={`${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/conferences/${shareDialogConf.id}`}
                title={shareDialogConf.title}
              />
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setShareDialogConf(null)}
            >
              Close
            </Button>
            {shareDialogConf && (
              <Link href={`/conferences/${shareDialogConf.id}`} target="_blank">
                <Button className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Public Page
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
