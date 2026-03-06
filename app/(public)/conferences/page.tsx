import type { Metadata } from "next";
import { supabaseServerClient } from "@/lib/supabase/server-client";
import ConferenceExplorer from "@/components/conference/ConferenceExplorer";
import type { ConferenceItem } from "@/components/conference/ConferenceExplorer";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Academic Conferences | AcadFlow",
  description:
    "Discover upcoming academic conferences, submission deadlines, and research events worldwide.",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ConferencesPage() {
  const { data: conferences } = await supabaseServerClient
    .from("conferences")
    .select("*, organizations(name, slug)")
    .eq("is_published", true)
    .order("start_date");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Academic Conferences
        </h1>

        <p className="text-gray-500 mt-1">
          Discover and register for upcoming academic events
        </p>
      </div>

      {/* Interactive Explorer */}
      <ConferenceExplorer
        conferences={(conferences as unknown as ConferenceItem[]) || []}
      />
    </div>
  );
}
