"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

import {
  FileText,
  Headphones,
  Info,
  Loader2,
  Users,
} from "lucide-react";

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
  const [conferenceTitle, setConferenceTitle] = useState<string | null>(null);

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

      // Fetch conference title
      const { data: conf } = await supabase
        .from("conferences")
        .select("title")
        .eq("id", conferenceId)
        .single();

      if (active) {
        setConferenceTitle(conf?.title || null);
      }

      setLoading(false);
    }

    loadUser();
    return () => {
      active = false;
    };
  }, [router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-500">Loading registration…</p>
        </div>
      </div>
    );
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

  /* ---------- Role card config ---------- */
  const roles = [
    {
      value: "author" as const,
      title: "Author",
      description: "Submit and present your research paper",
      icon: FileText,
      badgeText: null,
    },
    {
      value: "listener" as const,
      title: "Listener",
      description: "Attend sessions without submitting a paper",
      icon: Headphones,
      badgeText: "Conference Fee Required",
    },
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-sm border rounded-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 border-b px-6 py-8 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-100 mx-auto mb-4">
            <Users className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Join This Conference
          </h1>
          {conferenceTitle && (
            <p className="text-sm font-medium text-indigo-600 mt-1">
              {conferenceTitle}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1.5">
            Choose how you want to participate
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Role Selection Cards */}
          <RadioGroup
            value={role}
            onValueChange={(value: "author" | "listener") => setRole(value)}
            className="space-y-3"
          >
            {roles.map((r) => {
              const isSelected = role === r.value;
              const Icon = r.icon;

              return (
                <Label
                  key={r.value}
                  htmlFor={r.value}
                  className="block cursor-pointer"
                >
                  <div
                    className={`
                      relative flex items-start gap-4 rounded-xl border-2 p-4 transition-all
                      ${isSelected
                        ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      }
                    `}
                  >
                    {/* Radio indicator */}
                    <div className="pt-0.5">
                      <RadioGroupItem value={r.value} id={r.value} />
                    </div>

                    {/* Icon */}
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${
                            isSelected ? "text-indigo-900" : "text-gray-800"
                          }`}
                        >
                          {r.title}
                        </span>

                        {r.badgeText && (
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              isSelected
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {r.badgeText}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>

          {/* Info Section */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed space-y-1">
              <p>
                <strong>Authors</strong> can submit papers and present at the conference.
              </p>
              <p>
                <strong>Listeners</strong> can attend sessions without presenting.
                A conference participation fee may apply.
              </p>
            </div>
          </div>

          {/* Register Button */}
          <Button
            className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
            disabled={submitting}
            onClick={handleRegister}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Registering…
              </>
            ) : (
              "Register Now"
            )}
          </Button>

          {/* Footer note */}
          <p className="text-[11px] text-center text-gray-400 leading-relaxed">
            You can change your participation details from your dashboard after registering.
          </p>
        </div>
      </Card>
    </div>
  );
}
