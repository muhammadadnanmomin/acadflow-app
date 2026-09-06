import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  GraduationCap,
  BookOpen,
  CalendarDays,
  Pencil,
  User,
  Briefcase,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Profile completion helper                                          */
/* ------------------------------------------------------------------ */
function computeCompletion(profile: any, educationCount: number) {
  let score = 0;
  if (profile.avatar_url) score += 20;
  if (profile.bio) score += 20;
  if (profile.research_interests?.length > 0) score += 20;
  if (educationCount > 0) score += 20;
  if (profile.affiliation) score += 20;
  return score;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function ProfileViewPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: educationList } = await supabase
    .from("education")
    .select("*")
    .eq("profile_id", profile.id)
    .order("start_year", { ascending: false });

  const education = educationList || [];
  const completion = computeCompletion(profile, education.length);
  const initial = (profile.name?.[0] || profile.username?.[0] || "U").toUpperCase();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">

      {/* ── Header Card ── */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.name || profile.username} />
            <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">
                {profile.name || profile.username}
              </h1>
              <Badge variant="secondary" className="capitalize">
                {profile.role || "participant"}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            {profile.affiliation && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{profile.affiliation}</span>
              </div>
            )}
          </div>

          <Link href="/dashboard/profile/edit">
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </Card>

      {/* ── Profile Completion ── */}
      {completion < 100 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Profile Completion</p>
            <span className="text-sm font-semibold text-indigo-600">{completion}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Complete your profile to enhance your academic presence on Confairo.
          </p>
        </Card>
      )}

      {/* ── About ── */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-600" />
          <h2 className="text-lg font-semibold">About</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {profile.bio || "No bio added yet. Tell the academic community about yourself."}
        </p>
      </Card>

      {/* ── Research Interests ── */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          <h2 className="text-lg font-semibold">Research Interests</h2>
        </div>

        {profile.research_interests?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.research_interests.map((interest: string) => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No research interests added yet.
          </p>
        )}
      </Card>

      {/* ── Education ── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <h2 className="text-lg font-semibold">Education</h2>
        </div>

        {education.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No education entries added yet.
          </p>
        )}
      </Card>

      {/* ── Member Since ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
        <CalendarDays className="h-4 w-4" />
        <span>
          Member since{" "}
          {new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
