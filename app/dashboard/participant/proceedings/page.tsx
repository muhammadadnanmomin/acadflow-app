"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProceedingsCard from "@/components/proceedings/ProceedingsCard";
import ProceedingsLocked from "@/components/proceedings/ProceedingsLocked";
import {
  BookOpen,
  Calendar,
  Loader2,
  FileX,
} from "lucide-react";
import Link from "next/link";

const supabase = createClient();

interface ConferenceRow {
  id: string;
  title: string;
  short_name: string | null;
  end_date: string | null;
  status: string | null;
}

interface ProceedingsData {
  conference: ConferenceRow;
  proceedings: {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
  } | null;
  accessReason: "author" | "attendee" | "organizer" | null;
  lastAccessedAt: string | null;
  hasAccess: boolean;
}

export default function ParticipantProceedingsListPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [items, setItems] = useState<ProceedingsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    async function load() {
      setLoading(true);

      // 1. Get all conferences the user is associated with
      //    (via registrations OR paper submissions)
      const [{ data: registrations }, { data: submissions }] =
        await Promise.all([
          supabase
            .from("conference_registrations")
            .select("conference_id")
            .eq("user_id", profile!.id),
          supabase
            .from("paper_submissions")
            .select("conference_id")
            .eq("user_id", profile!.id),
        ]);

      // Merge unique conference IDs
      const idSet = new Set<string>();
      registrations?.forEach((r) => idSet.add(r.conference_id));
      submissions?.forEach((s) => idSet.add(s.conference_id));

      const conferenceIds = Array.from(idSet);

      if (conferenceIds.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch conference details for completed conferences
      const today = new Date().toISOString().split("T")[0];
      const { data: conferences } = await supabase
        .from("conferences")
        .select("id, title, short_name, end_date, status")
        .in("id", conferenceIds)
        .lte("end_date", today)
        .order("end_date", { ascending: false });

      if (!conferences || conferences.length === 0) {
        setLoading(false);
        return;
      }

      // 3. For each completed conference, check proceedings access
      const results: ProceedingsData[] = [];

      for (const conf of conferences) {
        try {
          const res = await fetch(`/api/proceedings/${conf.id}`);

          if (res.ok) {
            const json = await res.json();
            results.push({
              conference: conf,
              proceedings: json.proceedings,
              accessReason: json.accessReason,
              lastAccessedAt: json.lastAccessedAt,
              hasAccess: true,
            });
          } else {
            // No access or no proceedings — still show the conference
            results.push({
              conference: conf,
              proceedings: null,
              accessReason: null,
              lastAccessedAt: null,
              hasAccess: false,
            });
          }
        } catch {
          results.push({
            conference: conf,
            proceedings: null,
            accessReason: null,
            lastAccessedAt: null,
            hasAccess: false,
          });
        }
      }

      setItems(results);
      setLoading(false);
    }

    load();
  }, [profile]);

  /* ---- Loading state ---- */
  if (profileLoading || loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Conference Proceedings
          </h1>
        </div>

        {/* Skeleton cards */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-1.5 bg-gray-200 rounded w-full mb-4" />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-11 w-11 bg-gray-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mt-4" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
              <div className="flex gap-3 mt-6">
                <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                <div className="h-10 bg-gray-100 rounded-lg flex-1" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Main render ---- */
  const accessibleItems = items.filter((i) => i.hasAccess && i.proceedings);
  const lockedItems = items.filter((i) => !i.hasAccess || !i.proceedings);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Conference Proceedings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Secure access to published conference papers
            </p>
          </div>
        </div>

        {accessibleItems.length > 0 && (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 text-xs">
            {accessibleItems.length} Available
          </Badge>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <FileX className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No proceedings available
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Proceedings will appear here once your conferences conclude and
            organizers publish them.
          </p>
        </Card>
      )}

      {/* Accessible proceedings */}
      {accessibleItems.length > 0 && (
        <div className="space-y-4">
          {accessibleItems.map((item) => (
            <ProceedingsCard
              key={item.conference.id}
              conferenceId={item.conference.id}
              conferenceTitle={item.conference.title}
              conferenceShortName={item.conference.short_name}
              proceedingsTitle={item.proceedings!.title}
              proceedingsDescription={item.proceedings!.description}
              proceedingsCreatedAt={item.proceedings!.created_at}
              accessReason={item.accessReason!}
              lastAccessedAt={item.lastAccessedAt}
            />
          ))}
        </div>
      )}

      {/* Locked conferences */}
      {lockedItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Locked Proceedings
          </h2>

          {lockedItems.map((item) => (
            <Card
              key={item.conference.id}
              className="p-5 opacity-75 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {item.conference.title}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      Ended{" "}
                      {item.conference.end_date
                        ? new Date(item.conference.end_date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" }
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[11px] text-amber-600 border-amber-200 bg-amber-50 gap-1"
                >
                  🔒 Locked
                </Badge>
              </div>
            </Card>
          ))}

          {/* Locked explanation (shown once below the list) */}
          <div className="mt-2">
            <ProceedingsLocked />
          </div>
        </div>
      )}
    </div>
  );
}
