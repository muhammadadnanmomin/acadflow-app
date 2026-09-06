import { createServerSupabaseClient } from "@/lib/supabase/server";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  GraduationCap,
  BookOpen,
  User,
  Briefcase,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  /* Fetch profile by username */
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <User className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Profile Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          The user <span className="font-mono font-medium">@{username}</span> does not exist on Confairo.
        </p>
      </div>
    );
  }

  /* Fetch education */
  const { data: educationList } = await supabase
    .from("education")
    .select("*")
    .eq("profile_id", profile.id)
    .order("start_year", { ascending: false });

  const education = educationList || [];
  const initial = (profile.name?.[0] || profile.username?.[0] || "U").toUpperCase();

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">

      {/* ── Header ── */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.name || profile.username} />
            <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h1 className="text-2xl font-bold">
                {profile.name || profile.username}
              </h1>
              <Badge variant="secondary" className="capitalize">
                {profile.role || "participant"}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            {profile.affiliation && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground justify-center sm:justify-start">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{profile.affiliation}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── About ── */}
      {profile.bio && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        </Card>
      )}

      {/* ── Research Interests ── */}
      {profile.research_interests?.length > 0 && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <h2 className="text-lg font-semibold">Research Interests</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.research_interests.map((interest: string) => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            <h2 className="text-lg font-semibold">Education</h2>
          </div>
          <div className="space-y-3">
            {education.map((edu: any) => (
              <div
                key={edu.id}
                className="border rounded-lg p-4 space-y-1"
              >
                <p className="font-semibold">{edu.institution}</p>
                <p className="text-sm text-muted-foreground">
                  {[edu.degree, edu.field_of_study].filter(Boolean).join(" in ")}
                </p>
                {(edu.start_year || edu.end_year) && (
                  <p className="text-xs text-muted-foreground">
                    {edu.start_year || "?"} – {edu.end_year || "Present"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Footer ── */}
      <p className="text-center text-xs text-muted-foreground">
        Public academic profile on{" "}
        <span className="font-semibold text-indigo-600">Confairo</span>
      </p>
    </div>
  );
}
