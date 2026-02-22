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
  const [loading, setLoading] = useState(false);

  async function createOrganization() {
    if (!profile || !name) return;

    setLoading(true);

    try {
      // 1️⃣ create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name,
          website,
          created_by: profile.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2️⃣ add owner membership
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: profile.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created",
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Create Organization
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            This workspace will host your conferences.
          </p>
        </div>

        <div className="space-y-4">
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
        </div>

        <Button
          className="w-full"
          onClick={createOrganization}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </Card>
    </div>
  );
}