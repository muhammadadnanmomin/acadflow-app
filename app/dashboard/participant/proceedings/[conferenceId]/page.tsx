"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import ProceedingsLocked from "@/components/proceedings/ProceedingsLocked";
import ProceedingsViewer from "@/components/proceedings/ProceedingsViewer";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const supabase = createClient();

export default function ParticipantProceedingsPage() {
  const { conferenceId } = useParams<{ conferenceId: string }>();

  const [conference, setConference] = useState<any>(null);
  const [proceedings, setProceedings] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Fetch conference info
      const { data: conf } = await supabase
        .from("conferences")
        .select("id, title, short_name, status, end_date")
        .eq("id", conferenceId)
        .single();

      setConference(conf);

      // Try to fetch proceedings (RLS will enforce access)
      const res = await fetch(`/api/proceedings/${conferenceId}`);

      if (res.ok) {
        const json = await res.json();
        if (json.proceedings) {
          setProceedings(json.proceedings);
          setHasAccess(true);
        }
      }

      setLoading(false);
    }

    load();
  }, [conferenceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading proceedings…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/participant/conferences"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Conferences
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          Conference Proceedings
        </h1>
        {conference && (
          <p className="text-gray-500 mt-1">
            {conference.title}
            {conference.short_name && (
              <Badge variant="secondary" className="ml-2 text-[11px]">
                {conference.short_name}
              </Badge>
            )}
          </p>
        )}
      </div>

      {/* Conditional view */}
      {hasAccess && proceedings ? (
        <ProceedingsViewer
          conferenceId={conferenceId}
          title={proceedings.title}
          description={proceedings.description}
          createdAt={proceedings.created_at}
        />
      ) : (
        <ProceedingsLocked />
      )}
    </div>
  );
}
