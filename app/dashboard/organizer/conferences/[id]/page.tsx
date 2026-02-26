"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Calendar } from "lucide-react";

const supabase = createClient();

export default function ConferenceDetails() {
  const params = useParams();
  const router = useRouter();

  const { profile, loading } = useProfile();

  const [conference, setConference] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const id = params.id as string;

  /* Load conference */
  async function loadConference() {
    if (!profile || !id) return;

    const { data, error } = await supabase
      .from("conferences")
      .select("*")
      .eq("id", id)
      .eq("organizer_id", profile.id) // security
      .single();

    if (!error) {
      setConference(data);
    }

    setPageLoading(false);
  }

  useEffect(() => {
    if (!loading) loadConference();
  }, [loading, profile]);

  if (loading || pageLoading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!conference) {
    return (
      <div className="p-6 space-y-4">
        <p>Conference not found.</p>

        <Button onClick={() => router.back()}>
          Go Back
        </Button>

      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Button
        variant="outline"
        onClick={() =>
          router.push(`/dashboard/organizer/conferences/${id}/edit`)
        }
      >
        Edit Conference
      </Button>

      {/* Main Info */}
      <Card className="p-6 space-y-4">

        <h1 className="text-3xl font-bold">
          {conference.title}
        </h1>

        <p className="text-gray-600">
          {conference.description || "No description"}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {conference.start_date} → {conference.end_date}
        </div>

        <span
          className={`inline-block rounded-full px-3 py-1 text-xs ${conference.is_published
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
            }`}
        >
          {conference.is_published ? "Published" : "Draft"}
        </span>

      </Card>

      {/* Details */}
      <Card className="p-6 space-y-4">

        <h2 className="text-xl font-semibold">
          Conference Details
        </h2>

        <Detail label="Venue" value={conference.venue} />
        <Detail label="Mode" value={conference.mode} />

        <Detail
          label="Submission Deadline"
          value={conference.submission_deadline}
        />

        <Detail
          label="Max Participants"
          value={conference.max_participants}
        />

      </Card>

      {/* Fees */}
      <Card className="p-6 space-y-4">

        <h2 className="text-xl font-semibold">
          Registration Fees
        </h2>

        <Detail label="Registration Fee" value={conference.registration_fee} />
        <Detail label="Physical Presentation Fee" value={conference.physical_presentation_fee} />
        <Detail label="Virtual Presentation Fee" value={conference.virtual_presentation_fee} />
        <Detail label="Full Paper Publication Fee" value={conference.full_paper_publication_fee} />
        <Detail label="Abstract Publication Fee" value={conference.abstract_publication_fee} />

      </Card>

      {/* Contact */}
      <Card className="p-6 space-y-4">

        <h2 className="text-xl font-semibold">
          Contact
        </h2>

        <Detail label="Email" value={conference.contact_email} />
        <Detail label="Phone" value={conference.contact_phone} />

        {conference.website_link && (
          <Detail
            label="Website"
            value={
              <a
                href={conference.website_link}
                target="_blank"
                className="text-indigo-600 underline"
              >
                Visit Website
              </a>
            }
          />
        )}

      </Card>

    </div>
  );
}

/* Reusable Row */
function Detail({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="flex justify-between border-b pb-2 text-sm">

      <span className="font-medium text-gray-600">
        {label}
      </span>

      <span className="text-gray-900">
        {value || "—"}
      </span>

    </div>
  );
}
