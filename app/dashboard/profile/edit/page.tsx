"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [educationList, setEducationList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [research, setResearch] = useState("");

  const [newEducation, setNewEducation] = useState({
    institution: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
  });

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // auto create profile if missing
    if (!profileData) {
      const { data } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: user.email?.split("@")[0],
        })
        .select()
        .single();

      profileData = data;
    }

    setProfile(profileData);
    setBio(profileData.bio || "");
    setResearch(
      profileData.research_interests?.join(", ") || ""
    );

    setLoading(false);

    fetchEducation(profileData.id);
  }

  /* ================= FETCH EDUCATION ================= */
  async function fetchEducation(profileId: string) {
    const { data } = await supabase
      .from("education")
      .select("*")
      .eq("profile_id", profileId)
      .order("start_year", { ascending: false });

    if (data) setEducationList(data);
  }

  /* ================= UPDATE PROFILE ================= */
  async function handleUpdate() {
    if (!profile) return;

    const researchArray = research
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        research_interests: researchArray,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
      return;
    }

    toast({ title: "Profile Updated" });
  }

  /* ================= ADD EDUCATION ================= */
  async function handleAddEducation() {
    if (!profile || !newEducation.institution) return;

    await supabase.from("education").insert({
      profile_id: profile.id,
      ...newEducation,
      start_year: newEducation.start_year
        ? Number(newEducation.start_year)
        : null,
      end_year: newEducation.end_year
        ? Number(newEducation.end_year)
        : null,
    });

    setNewEducation({
      institution: "",
      degree: "",
      field_of_study: "",
      start_year: "",
      end_year: "",
    });

    fetchEducation(profile.id);
  }

  async function handleDeleteEducation(id: string) {
    await supabase.from("education").delete().eq("id", id);
    fetchEducation(profile.id);
  }

  /* ================= LOADING ================= */
  if (loading || !profile) {
    return (
      <p className="text-center text-gray-400 mt-10">
        Loading profile...
      </p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">

      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-gray-500">
          Update your public academic profile.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-10">

        {/* HEADER */}
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="bg-indigo-600 text-white text-xl">
              {profile.username?.[0]}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="text-xl font-semibold">
              {profile.username}
            </p>
            <p className="text-sm text-gray-500">
              Public academic identity
            </p>
          </div>
        </div>

        {/* BIO */}
        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* RESEARCH */}
        <div>
          <label className="text-sm font-medium">
            Research Interests
          </label>
          <Input
            value={research}
            onChange={(e) => setResearch(e.target.value)}
          />
        </div>

        <Button onClick={handleUpdate} className="mt-4">
          Save Profile
        </Button>

        {/* EDUCATION */}
        <div className="border-t pt-8 space-y-4 mt-5">
          <h2 className="text-xl font-semibold">Education</h2>

          {educationList.map((edu) => (
            <div
              key={edu.id}
              className="border p-4 rounded-lg flex justify-between"
            >
              <div>
                <p className="font-semibold">{edu.institution}</p>
                <p className="text-sm text-gray-500">
                  {edu.degree}
                </p>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteEducation(edu.id)}
              >
                Delete
              </Button>
            </div>
          ))}

          <div className="grid md:grid-cols-2 gap-3">
            <Input
              placeholder="Institution"
              value={newEducation.institution}
              onChange={(e) =>
                setNewEducation({
                  ...newEducation,
                  institution: e.target.value,
                })
              }
            />
            <Input
              placeholder="Degree"
              value={newEducation.degree}
              onChange={(e) =>
                setNewEducation({
                  ...newEducation,
                  degree: e.target.value,
                })
              }
            />
          </div>

          <Button onClick={handleAddEducation}>
            Add Education
          </Button>
        </div>
      </div>
    </div>
  );
}
