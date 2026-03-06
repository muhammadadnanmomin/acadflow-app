"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Upload,
  X,
  Plus,
  GraduationCap,
  Trash2,
  Loader2,
  ArrowLeft,
  Camera,
} from "lucide-react";
import Link from "next/link";

const MAX_BIO_LENGTH = 500;
const MAX_TAG_LENGTH = 40;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [educationList, setEducationList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Profile fields ── */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /* ── Research interests (tag system) ── */
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");

  /* ── Education ── */
  const [newEducation, setNewEducation] = useState({
    institution: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
  });

  /* ================================================================ */
  /*  Load profile                                                     */
  /* ================================================================ */
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
    setName(profileData.name || "");
    setBio(profileData.bio || "");
    setAffiliation(profileData.affiliation || "");
    setAvatarUrl(profileData.avatar_url || null);
    setInterests(profileData.research_interests || []);

    setLoading(false);
    fetchEducation(profileData.id);
  }

  /* ================================================================ */
  /*  Fetch education                                                  */
  /* ================================================================ */
  async function fetchEducation(profileId: string) {
    const { data } = await supabase
      .from("education")
      .select("*")
      .eq("profile_id", profileId)
      .order("start_year", { ascending: false });

    if (data) setEducationList(data);
  }

  /* ================================================================ */
  /*  Avatar upload                                                    */
  /* ================================================================ */
  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPG or PNG image.",
      });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Avatar must be under 2 MB.",
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile || !profile) return avatarUrl;

    const path = `avatars/${profile.id}.png`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (error) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: "Avatar upload failed",
        description: error.message,
      });
      return avatarUrl;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Append cache-buster so the browser fetches the new image
    return `${publicUrl}?t=${Date.now()}`;
  }

  /* ================================================================ */
  /*  Research interest tags                                           */
  /* ================================================================ */
  function addInterest() {
    const tag = interestInput.trim();
    if (!tag) return;

    if (tag.length > MAX_TAG_LENGTH) {
      toast({
        variant: "destructive",
        title: "Tag too long",
        description: `Maximum ${MAX_TAG_LENGTH} characters per tag.`,
      });
      return;
    }

    if (interests.includes(tag)) {
      toast({
        variant: "destructive",
        title: "Duplicate tag",
        description: `"${tag}" already exists.`,
      });
      return;
    }

    setInterests((prev) => [...prev, tag]);
    setInterestInput("");
  }

  function removeInterest(tag: string) {
    setInterests((prev) => prev.filter((t) => t !== tag));
  }

  /* ================================================================ */
  /*  Save profile                                                     */
  /* ================================================================ */
  async function handleUpdate() {
    if (!profile) return;

    if (bio.length > MAX_BIO_LENGTH) {
      toast({
        variant: "destructive",
        title: "Bio too long",
        description: `Bio must be under ${MAX_BIO_LENGTH} characters.`,
      });
      return;
    }

    setSaving(true);

    try {
      // Upload avatar if changed
      const finalAvatarUrl = await uploadAvatar();

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim() || null,
          bio: bio.trim() || null,
          affiliation: affiliation.trim() || null,
          avatar_url: finalAvatarUrl,
          research_interests: interests.length > 0 ? interests : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error.message,
        });
        return;
      }

      toast({ title: "Profile updated ✅" });
      router.push("/dashboard/profile");
    } finally {
      setSaving(false);
    }
  }

  /* ================================================================ */
  /*  Add education                                                    */
  /* ================================================================ */
  async function handleAddEducation() {
    if (!profile) return;

    if (!newEducation.institution.trim()) {
      toast({
        variant: "destructive",
        title: "Missing institution",
        description: "Please enter an institution name.",
      });
      return;
    }

    const startYear = newEducation.start_year ? Number(newEducation.start_year) : null;
    const endYear = newEducation.end_year ? Number(newEducation.end_year) : null;

    if (newEducation.start_year && (isNaN(startYear!) || startYear! < 1900 || startYear! > 2100)) {
      toast({
        variant: "destructive",
        title: "Invalid start year",
        description: "Please enter a valid 4-digit year.",
      });
      return;
    }

    if (newEducation.end_year && (isNaN(endYear!) || endYear! < 1900 || endYear! > 2100)) {
      toast({
        variant: "destructive",
        title: "Invalid end year",
        description: "Please enter a valid 4-digit year.",
      });
      return;
    }

    await supabase.from("education").insert({
      profile_id: profile.id,
      institution: newEducation.institution.trim(),
      degree: newEducation.degree.trim() || null,
      field_of_study: newEducation.field_of_study.trim() || null,
      start_year: startYear,
      end_year: endYear,
    });

    setNewEducation({
      institution: "",
      degree: "",
      field_of_study: "",
      start_year: "",
      end_year: "",
    });

    toast({ title: "Education added ✅" });
    fetchEducation(profile.id);
  }

  async function handleDeleteEducation(id: string) {
    await supabase.from("education").delete().eq("id", id);
    fetchEducation(profile.id);
    toast({ title: "Education entry removed" });
  }

  /* ================================================================ */
  /*  Skeleton loading                                                 */
  /* ================================================================ */
  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card className="p-8 space-y-8">
          <div className="flex items-center gap-5">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  const displayAvatar = avatarPreview || avatarUrl || "";
  const initial = (name?.[0] || profile.username?.[0] || "U").toUpperCase();

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Update your public academic identity.
          </p>
        </div>
        <Link href="/dashboard/profile">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
        </Link>
      </div>

      <Card className="p-8 space-y-10">

        {/* ── Avatar ── */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Profile Picture</label>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayAvatar} alt={name || profile.username} />
                <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-white border rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                <Camera className="h-3.5 w-3.5 text-gray-600" />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </label>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>JPG or PNG · Max 2 MB</p>
              {avatarFile && (
                <p className="text-green-600 text-xs">✓ New image selected: {avatarFile.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Username (read-only) ── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Username</label>
          <Input value={profile.username || ""} disabled className="bg-gray-50" />
          <p className="text-xs text-muted-foreground">
            Username cannot be changed. It is your unique public identifier.
          </p>
        </div>

        {/* ── Name ── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Muhammad Adnan"
          />
        </div>

        {/* ── Affiliation ── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Affiliation</label>
          <Input
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="e.g. National University of Sciences & Technology"
          />
        </div>

        {/* ── Bio ── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Bio</label>
            <span className={`text-xs ${bio.length > MAX_BIO_LENGTH ? "text-red-500" : "text-muted-foreground"}`}>
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell the academic community about yourself, your work, and your research..."
            maxLength={MAX_BIO_LENGTH}
          />
        </div>

        {/* ── Research Interests (tags) ── */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Research Interests</label>

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1 cursor-default"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeInterest(tag)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              placeholder="e.g. Machine Learning"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <Button variant="outline" onClick={addInterest} type="button">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Type an interest and press Enter or click Add.
          </p>
        </div>

        {/* ── Save Button ── */}
        <Button onClick={handleUpdate} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Profile"
          )}
        </Button>

        {/* ── Education ── */}
        <div className="border-t pt-8 space-y-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Education</h2>
          </div>

          {/* Existing entries */}
          {educationList.length > 0 ? (
            <div className="space-y-3">
              {educationList.map((edu) => (
                <div
                  key={edu.id}
                  className="border rounded-lg p-4 flex justify-between items-start"
                >
                  <div className="space-y-0.5">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteEducation(edu.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No education entries added yet.
            </p>
          )}

          {/* Add new education */}
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
            <p className="text-sm font-medium">Add Education</p>

            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder="Institution *"
                value={newEducation.institution}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, institution: e.target.value })
                }
              />
              <Input
                placeholder="Degree (e.g. B.Tech, M.S.)"
                value={newEducation.degree}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, degree: e.target.value })
                }
              />
              <Input
                placeholder="Field of Study"
                value={newEducation.field_of_study}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, field_of_study: e.target.value })
                }
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Start Year"
                  value={newEducation.start_year}
                  onChange={(e) =>
                    setNewEducation({ ...newEducation, start_year: e.target.value })
                  }
                  min={1900}
                  max={2100}
                />
                <Input
                  type="number"
                  placeholder="End Year"
                  value={newEducation.end_year}
                  onChange={(e) =>
                    setNewEducation({ ...newEducation, end_year: e.target.value })
                  }
                  min={1900}
                  max={2100}
                />
              </div>
            </div>

            <Button onClick={handleAddEducation} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Education
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
