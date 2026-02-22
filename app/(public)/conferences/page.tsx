import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server-client";

import {
  Calendar,
  MapPin,
  Monitor,
  ArrowRight,
  Search,
} from "lucide-react";

export default async function ConferencesPage() {
  const { data: conferences } = await supabaseServerClient
    .from("conferences")
    .select("*")
    .eq("is_published", true)
    .order("start_date");

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
        <div className="rounded-xl border bg-white p-10 text-center">

          <h3 className="text-lg font-semibold text-gray-800">
            No conferences available
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Please check back later for upcoming events.
          </p>

        </div>
      )}

      {/* Conference Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {conferences?.map((c) => (
          <Link
            key={c.id}
            href={`/conferences/${c.id}`}
            className="group rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-lg"
          >

            {/* Date Badge */}
            <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">

              <Calendar className="h-3.5 w-3.5" />

              {c.start_date}

            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition">

              {c.title}

            </h2>

            {/* Description */}
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">

              {c.description || "No description provided."}

            </p>

            {/* Info */}
            <div className="mt-4 space-y-1 text-sm text-gray-500">

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

                  <span>{c.venue}</span>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between">

              <span className="text-xs text-gray-400">
                Ends on {c.end_date}
              </span>

              <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">

                View Details
                <ArrowRight className="h-4 w-4" />

              </span>

            </div>

          </Link>
        ))}

      </div>

    </div>
  );
}
