"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

type User = {
  id: string;
};

type Registration = {
  role: "author" | "listener";
  paid: boolean;
};

const supabase = createClient()

export default function ConferenceRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const conferenceId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"author" | "listener">("listener");
  const [submitting, setSubmitting] = useState(false);

  const roleParam = searchParams.get("role");

  /* ---------- Redirect URL ---------- */
  const redirectTo = useMemo(() => {
    const base = `/conferences/${conferenceId}/register`;
    if (roleParam === "author" || roleParam === "listener") {
      return `${base}?role=${roleParam}`;
    }
    return base;
  }, [conferenceId, roleParam]);

  /* ---------- Sync role from URL ---------- */
  useEffect(() => {
    if (roleParam === "author" || roleParam === "listener") {
      setRole(roleParam);
    }
  }, [roleParam]);

  /* ---------- Load user ---------- */
  useEffect(() => {
    let active = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      setUser({ id: user.id });
      setLoading(false);
    }

    loadUser();
    return () => {
      active = false;
    };
  }, [router, redirectTo]);

  if (loading) {
    return <p className="p-10">Loading...</p>;
  }

  if (!user) {
    return null;
  }

  /* ---------- Redirect by role ---------- */
  function redirectByRole(r: "author" | "listener") {
    if (r === "author") {
      router.push("/dashboard/participant/submissions");
    } else {
      router.push("/dashboard/participant/payments");
    }
  }

  /* ---------- Register ---------- */
  async function handleRegister() {
    if (!user) return;

    setSubmitting(true);

    const { data: existing, error: fetchError } = await supabase
      .from("conference_registrations")
      .select("role, paid")
      .eq("user_id", user.id)
      .eq("conference_id", conferenceId)
      .maybeSingle<Registration>();

    if (fetchError) {
      setSubmitting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: fetchError.message,
      });
      return;
    }

    // Already registered
    if (existing) {
      setSubmitting(false);
      toast({
        title: "Already Registered",
        description: "You are already registered for this conference.",
      });
      redirectByRole(existing.role);
      return;
    }

    // Insert registration (allowed by INSERT policy)
    const { error } = await supabase
      .from("conference_registrations")
      .insert({
        user_id: user.id,
        conference_id: conferenceId,
        role,
        paid: false,
      });

    if (error) {
      setSubmitting(false);

      // Unique constraint safety
      if (error.code === "23505") {
        toast({
          title: "Already Registered",
          description: "You are already registered.",
        });
        redirectByRole(role);
        return;
      }

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
      return;
    }

    setSubmitting(false);
    toast({
      title: "Registration Successful",
      description: "You are now registered.",
    });

    redirectByRole(role);
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <Card className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Conference Registration
        </h1>

        <p className="text-sm text-gray-500 text-center">
          Choose how you want to participate
        </p>

        <RadioGroup
          value={role}
          onValueChange={(value: "author" | "listener") => setRole(value)}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="author" id="author" />
            <Label htmlFor="author">
              Author (Submit Paper – Free)
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <RadioGroupItem value="listener" id="listener" />
            <Label htmlFor="listener">
              Listener (Attend Only – Paid)
            </Label>
          </div>
        </RadioGroup>

        <Button
          className="w-full"
          disabled={submitting}
          onClick={handleRegister}
        >
          {submitting ? "Registering..." : "Register"}
        </Button>
      </Card>
    </div>
  );
}
