"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function OrganizationSetup() {
  const router = useRouter();
  const { profile } = useProfile();
  const supabase = createClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function createOrganization() {
    if (!profile || !name) return;

    setLoading(true);

    try {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name,
          website,
          linkedin_url: linkedin,
          country,
          description,
          created_by: profile.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

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
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Organization</h1>
        <p className="text-gray-500 mt-1">
          This workspace will host your conferences.
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6 space-y-6">
        <div className="space-y-4">

          {/* Name */}
          <div>
            <label className="text-sm font-medium">
              Organization Name
            </label>
            <Input
              placeholder="International Conference Society"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Website */}
          <div>
            <label className="text-sm font-medium">
              Website (optional)
            </label>
            <Input
              placeholder="https://example.org"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="text-sm font-medium">
              LinkedIn Page (optional)
            </label>
            <Input
              placeholder="https://linkedin.com/company/your-org"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>

          {/* Country */}
          <div>
            <label className="text-sm font-medium">
              Country
            </label>
            <Input
              placeholder="India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">
              Short Description
            </label>
            <Input
              placeholder="Promoting academic research and innovation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={createOrganization}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Organization"}
        </Button>

      </Card>
    </div>
  );
}