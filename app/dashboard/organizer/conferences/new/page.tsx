"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

import { getOrCreateOrganization } from "@/lib/organizations/getOrCreateOrganization";

import ConferenceForm from "@/components/conference/ConferenceForm";

import {
  Calendar,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerConferences() {
  const { profile } = useProfile();

  const [conferences, setConferences] = useState<any[]>([]);

  /* ================================================================ */
  /*  Load conferences                                                 */
  /* ================================================================ */
  async function loadConferences() {
    if (!profile) return;

    const orgId = await getOrCreateOrganization(
      profile.id,
      profile.name || "My Organization"
    );

    const { data, error } = await supabase
      .from("conferences")
      .select("*")
      .or(`organizer_id.eq.${profile.id},organization_id.eq.${orgId}`)
      .order("created_at", { ascending: false });

    if (!error) {
      setConferences(data || []);
    }
  }

  useEffect(() => {
    loadConferences();
  }, [profile]);

  /* ================================================================ */
  /*  Publish / Unpublish                                              */
  /* ================================================================ */
  async function togglePublish(id: string, value: boolean) {
    const { error } = await supabase
      .from("conferences")
      .update({ is_published: value })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: value ? "Published" : "Unpublished",
      description: "Conference status updated.",
    });

    loadConferences();
  }

  /* ================================================================ */
  /*  Delete                                                           */
  /* ================================================================ */
  async function deleteConference(id: string) {
    if (!confirm("Delete this conference?")) return;

    const { error } = await supabase
      .from("conferences")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Conference deleted",
      description: "Conference removed successfully.",
    });

    loadConferences();
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Manage Conferences</h1>
        <p className="text-gray-500 mt-1">
          Create, publish and manage your events
        </p>
      </div>

      {/* ============================================================ */}
      {/*  CREATE FORM (shared component)                               */}
      {/* ============================================================ */}
      <ConferenceForm mode="create" onSuccess={loadConferences} />
    </div>
  );
}
