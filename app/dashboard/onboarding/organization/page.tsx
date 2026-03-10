"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { getNames } from "country-list";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Building2,
  Loader2,
  Upload,
  Globe,
  Linkedin,
  MapPin,
  ImageIcon,
  X,
} from "lucide-react";

/* ---------- Constants ---------- */

const COUNTRIES = getNames().filter((c) => c !== "Israel").sort();

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

/* ---------- Helpers ---------- */

/** Generate a URL-safe slug from an organization name. */
function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Validate a URL string (returns true if empty or valid). */
function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/* ---------- Component ---------- */

export default function OrganizationSetup() {
  const router = useRouter();
  const { profile } = useProfile();
  const supabase = createClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  /* Logo state */
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  /* ---------- Logo handling ---------- */

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PNG or JPEG image.",
      });
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Logo must be smaller than 2 MB.",
      });
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ---------- Upload logo to Supabase Storage ---------- */

  async function uploadLogo(orgId: string): Promise<string | null> {
    if (!logoFile) return null;

    const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${orgId}/logo.${ext}`;

    const { error } = await supabase.storage
      .from("organization-logos")
      .upload(filePath, logoFile, { upsert: true });

    if (error) {
      console.error("Logo upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("organization-logos").getPublicUrl(filePath);

    return publicUrl;
  }

  /* ---------- Create organization ---------- */

  async function createOrganization() {
    if (!profile) return;

    /* --- Trim all inputs --- */
    const trimmedName = name.trim();
    const trimmedWebsite = website.trim();
    const trimmedLinkedin = linkedin.trim();
    const trimmedCountry = country.trim();
    const trimmedDescription = description.trim();

    /* --- Validate required fields --- */
    if (!trimmedName) {
      toast({
        variant: "destructive",
        title: "Organization name is required",
        description: "Please enter a name for your organization.",
      });
      return;
    }

    if (!trimmedCountry) {
      toast({
        variant: "destructive",
        title: "Country is required",
        description: "Please select the country where your organization is based.",
      });
      return;
    }

    /* --- Validate URLs --- */
    if (trimmedWebsite && !isValidUrl(trimmedWebsite)) {
      toast({
        variant: "destructive",
        title: "Invalid website URL",
        description: "Please enter a valid URL (e.g. https://example.org).",
      });
      return;
    }

    if (trimmedLinkedin && !isValidUrl(trimmedLinkedin)) {
      toast({
        variant: "destructive",
        title: "Invalid LinkedIn URL",
        description:
          "Please enter a valid URL (e.g. https://linkedin.com/company/your-org).",
      });
      return;
    }

    setLoading(true);

    try {
      /* --- Generate slug & check for duplicates --- */
      const slug = generateSlug(trimmedName);

      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        toast({
          variant: "destructive",
          title: "Organization already exists",
          description: "An organization with this name already exists.",
        });
        setLoading(false);
        return;
      }

      /* --- Create organization --- */
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: trimmedName,
          slug,
          website: trimmedWebsite || null,
          linkedin_url: trimmedLinkedin || null,
          country: trimmedCountry,
          description: trimmedDescription || null,
          created_by: profile.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      /* --- Upload logo if provided --- */
      if (logoFile) {
        const logoUrl = await uploadLogo(org.id);
        if (logoUrl) {
          await supabase
            .from("organizations")
            .update({ logo_url: logoUrl })
            .eq("id", org.id);
        }
      }

      /* --- Add creator as owner --- */
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: profile.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created 🎉",
        description: "You are ready to host conferences.",
      });

      router.push("/dashboard/organizer");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast({
        variant: "destructive",
        title: "Failed to create organization",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Computed ---------- */

  const slug = generateSlug(name);
  const isFormValid = name.trim().length > 0 && country.trim().length > 0;

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Create Your Organization
          </h1>
        </div>
        <p className="text-gray-500 mt-1">
          This workspace will allow you to:
        </p>
        <ul className="text-gray-500 text-sm mt-2 space-y-1 ml-1">
          <li>• Host conferences</li>
          <li>• Manage paper submissions</li>
          <li>• Assign reviewers</li>
          <li>• Issue certificates to participants</li>
        </ul>
      </div>

      {/* Form Card */}
      <Card className="p-6 space-y-6">
        <div className="space-y-5">
          {/* Logo */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Organization Logo{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>

            {logoPreview ? (
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg border overflow-hidden bg-gray-50">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-600 truncate max-w-[200px]">
                    {logoFile?.name}
                  </p>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1 w-fit"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 w-full rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/40 transition p-4 text-left group"
              >
                <div className="h-12 w-12 rounded-lg bg-gray-100 group-hover:bg-primary/10 transition flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-primary transition" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload logo
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG or JPEG, max 2 MB
                  </p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleLogoSelect}
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="International Conference Society"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {slug && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                acadflow.com/org/
                <span className="font-mono text-gray-500">{slug}</span>
              </p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <SelectValue placeholder="Select a country" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Website */}
          <div>
            <label className="text-sm font-medium">
              Website{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="https://example.org"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label className="text-sm font-medium">
              LinkedIn Page{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="https://linkedin.com/company/your-org"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="Describe your organization and its mission in academic research."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={createOrganization}
          disabled={loading || !isFormValid}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Organization...
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              Create Organization
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}