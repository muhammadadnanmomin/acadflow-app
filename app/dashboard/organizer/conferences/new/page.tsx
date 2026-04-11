"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { usePlan } from "@/lib/plans/usePlan";
import { useOrganization } from "@/lib/organizations/useOrganization";
import UpgradeModal from "@/components/upgrade/UpgradeModal";

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
  Lock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerConferences() {
  const { profile } = useProfile();
  const { organization } = useOrganization();
  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Conference</h1>
          <p className="text-gray-500 mt-1">
            Set up a new academic event
          </p>
        </div>
        <Link href="/dashboard/organizer/conferences">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Conferences
          </Button>
        </Link>
      </div>

      {/* ============================================================ */}
      {/*  LIMIT REACHED BLOCK                                          */}
      {/* ============================================================ */}
      {!plan.loading && !plan.canCreateConference ? (
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Lock className="h-8 w-8 text-amber-500" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Conference limit reached
            </h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              You have used all {plan.conferenceLimit ?? 0} conference
              slot{(plan.conferenceLimit ?? 0) !== 1 ? "s" : ""} on your{" "}
              {plan.planType === "free" ? "Free" : "Pro"} plan.
              Purchase another slot to create more conferences.
            </p>
          </div>

          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={() => setShowUpgradeModal(true)}
          >
            <Sparkles className="h-4 w-4" />
            Buy Conference Slot — ₹1,999
          </Button>
        </Card>
      ) : (
        /* ============================================================ */
        /*  CREATE FORM (shared component)                               */
        /* ============================================================ */
        <ConferenceForm mode="create" onSuccess={loadConferences} />
      )}

      {/* Upgrade Modal */}
      {organization && profile && (
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          organizationId={organization.id}
          userId={profile.id}
        />
      )}
    </div>
  );
}
