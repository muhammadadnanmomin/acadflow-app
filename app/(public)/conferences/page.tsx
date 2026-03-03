import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server-client";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  MapPin,
  Monitor,
  ArrowRight,
  Search,
  Tag,
  DollarSign,
  CalendarCheck,
  BookOpen,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLowestFee(conf: any): number | null {
  const fees = [
    conf.registration_fee,
    conf.physical_presentation_fee,
    conf.virtual_presentation_fee,
    conf.full_paper_publication_fee,
    conf.abstract_publication_fee,
  ].filter((f) => f != null && f > 0);

  if (fees.length === 0) return null;
  return Math.min(...fees);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ConferencesPage() {
  const { data: conferences } = await supabaseServerClient
    .from("conferences")
    .select("*")
    .eq("is_published", true)
    .order("start_date");

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Academic Conferences
          </h1>

          <p className="text-gray-500 mt-1">
            Discover and register for upcoming academic events
          </p>
        </div>

        {/* Search (UI only for now) */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            placeholder="Search conferences..."
            className="w-full rounded-lg border px-9 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      {/* Empty State */}
      {conferences?.length === 0 && (
        <div className="rounded-xl border bg-white p-16 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <BookOpen className="h-8 w-8 text-indigo-400" />
          </div>

          <h3 className="text-xl font-semibold text-gray-800">
            No conferences available yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            We don&apos;t have any published conferences at the moment. Check
            back soon — new academic events are added regularly.
          </p>

        </div>
      )}

      {/* Conference Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {conferences?.map((c) => {
          const submissionsOpen =
            c.submission_deadline && c.submission_deadline >= today;
          const lowestFee = getLowestFee(c);
          const currencySymbol = getCurrencySymbol(c.currency);
          const tracks: string[] = c.tracks ?? [];

          return (
            <Link
              key={c.id}
              href={`/conferences/${c.id}`}
              className="group rounded-xl border bg-white shadow-sm transition hover:shadow-lg flex flex-col overflow-hidden"
            >

              {/* Logo + Top section */}
              <div className="p-5 pb-0 flex items-start gap-3">
                {/* Logo */}
                {c.conference_logo_url && (
                  <img
                    src={c.conference_logo_url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover border shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  {/* Date Badge */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(c.start_date)}
                    </span>

                    {submissionsOpen && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                        <CalendarCheck className="h-3 w-3" />
                        Submissions Open
                      </Badge>
                    )}
                  </div>

                  {/* Title + Short name */}
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition leading-snug">
                    {c.title}
                    {c.short_name && (
                      <Badge
                        variant="secondary"
                        className="ml-2 align-middle text-[10px] px-1.5 py-0"
                      >
                        {c.short_name}
                      </Badge>
                    )}
                  </h2>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 pt-3 pb-5 flex flex-col flex-1">

                {/* Description */}
                <p className="line-clamp-2 text-sm text-gray-600">
                  {c.description || "No description provided."}
                </p>

                {/* Tracks */}
                {tracks.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                    {tracks.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-[11px] px-2 py-0">
                        {t}
                      </Badge>
                    ))}
                    {tracks.length > 3 && (
                      <span className="text-[11px] text-gray-400">
                        +{tracks.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Info Row */}
                <div className="mt-3 space-y-1 text-sm text-gray-500">

                  {/* Mode */}
                  {c.mode && (
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="capitalize">{c.mode}</span>
                    </div>
                  )}

                  {/* Venue */}
                  {c.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{c.venue}</span>
                    </div>
                  )}

                </div>

                {/* Spacer to push footer down */}
                <div className="flex-1" />

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t pt-3">

                  {/* Fee display */}
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                    {c.payment_required === false ? (
                      <span className="font-medium text-green-600">Free</span>
                    ) : lowestFee != null ? (
                      <span className="font-medium text-gray-700">
                        From {currencySymbol}{lowestFee}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </span>

                </div>

              </div>

            </Link>
          );
        })}

      </div>

    </div>
  );
}
