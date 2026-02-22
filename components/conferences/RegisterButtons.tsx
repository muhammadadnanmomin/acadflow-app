"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  conferenceId: string;
};

type Registration = {
  role: "author" | "attendee";
  paid: boolean | null;
};

const supabase = createClient()

export default function RegisterButtons({ conferenceId }: Props) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registration, setRegistration] =
    useState<Registration | null>(null);

  /* Load user + registration */
  async function loadStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data, error } = await supabase
        .from("conference_registrations")
        .select("role, paid")
        .eq("user_id", user.id)
        .eq("conference_id", conferenceId)
        .maybeSingle();

      if (!error) {
        setRegistration(data);
      } else {
        setRegistration(null);
      }
    } else {
      setRegistration(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStatus();

    /* Listen auth change */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conferenceId]);

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <Button disabled className="w-full">
        Loading...
      </Button>
    );
  }

  /* ---------------- NOT LOGGED IN ---------------- */

  if (!user) {
    return (
      <Link href={`/login?redirect=/conferences/${conferenceId}`}>
        <Button className="w-full">
          Login to Participate
        </Button>
      </Link>
    );
  }

  /* ---------------- NOT REGISTERED ---------------- */

  if (!registration) {
    return (
      <div className="flex flex-col gap-3">

        <Link href={`/conferences/${conferenceId}/register?role=author`}>
          <Button className="w-full">
            Register as Author (Free)
          </Button>
        </Link>

        <Link href={`/conferences/${conferenceId}/register?role=attendee`}>
          <Button variant="outline" className="w-full">
            Register as Attendee
          </Button>
        </Link>

      </div>
    );
  }

  /* ---------------- AUTHOR ---------------- */

  if (registration.role === "author") {
    return (
      <div className="flex flex-col gap-3">

        <Link href="/dashboard/participant/submissions">
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Submit Paper
          </Button>
        </Link>

        <Button disabled variant="outline" className="w-full">
          Registered as Author
        </Button>

      </div>
    );
  }

  /* ---------------- ATTENDEE ---------------- */

  if (registration.role === "attendee") {
    return (
      <div className="flex flex-col gap-3">

        {!registration.paid && (
          <Link href={`/payment/${conferenceId}`}>
            <Button className="w-full">
              Pay to Attend
            </Button>
          </Link>
        )}

        {registration.paid && (
          <Button disabled className="w-full bg-blue-600">
            Access Granted
          </Button>
        )}

        <Button disabled variant="outline" className="w-full">
          Registered as Attendee
        </Button>

      </div>
    );
  }

  return null;
}
