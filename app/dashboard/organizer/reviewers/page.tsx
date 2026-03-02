"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";
import { useOrgRole } from "@/lib/organizations/useOrgRole";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

/* ---------- TYPES ---------- */

interface Conference {
  id: string;
  title: string;
}

interface Reviewer {
  id: string;
  name: string;
}

/* ---------- COMPONENT ---------- */

export default function OrganizerReviewers() {
  const supabase = createClient();
  const { profile } = useProfile();
  const organization = useOrganization();
  const role = useOrgRole();

  const [loading, setLoading] = useState(true);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [reviewersByConference, setReviewersByConference] =
    useState<Record<string, Reviewer[]>>({});

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteConferenceId, setInviteConferenceId] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  /* ---------- LOAD DATA ---------- */

  const loadData = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    try {
      if (!organization) return;

      const { data: confs, error: confError } = await supabase
        .from("conferences")
        .select("id, title")
        .or(
          `organizer_id.eq.${profile.id},organization_id.eq.${organization.id}`
        );

      if (confError) throw confError;

      setConferences(confs || []);

      const conferenceIds = (confs || []).map(c => c.id);

      if (conferenceIds.length === 0) {
        setReviewersByConference({});
        setLoading(false);
        return;
      }

      const { data: regs, error: regError } = await supabase
        .from("conference_registrations")
        .select("conference_id, user_id, profiles(name)")
        .in("conference_id", conferenceIds)
        .eq("role", "reviewer");

      if (regError) throw regError;

      const map: Record<string, Reviewer[]> = {};

      regs?.forEach((r: any) => {
        if (!map[r.conference_id]) map[r.conference_id] = [];
        map[r.conference_id].push({
          id: r.user_id,
          name: r.profiles?.name ?? "Unknown",
        });
      });

      setReviewersByConference(map);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: error.message ?? "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }, [profile, organization, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------- GENERATE INVITE ---------- */

  async function sendInvite() {
    if (!profile || !inviteEmail || !inviteConferenceId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Select a conference and enter reviewer email.",
      });
      return;
    }

    setSendingInvite(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data: existing, error: existingError } = await supabase
        .from("reviewer_invites")
        .select("token, accepted")
        .eq("email", inviteEmail)
        .eq("conference_id", inviteConferenceId)
        .maybeSingle();

      if (existingError) throw existingError;

      let inviteToken: string;

      if (existing) {
        if (existing.accepted) {
          throw new Error("Reviewer already accepted this invite.");
        }

        inviteToken = existing.token;

        toast({
          title: "Invite already exists",
          description: "Sharing existing invite link.",
        });
      } else {
        inviteToken = crypto.randomUUID();

        const { error } = await supabase
          .from("reviewer_invites")
          .insert({
            email: inviteEmail,
            conference_id: inviteConferenceId,
            token: inviteToken,
            invited_by: user.id,
            accepted: false,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

        if (error) throw error;

        toast({
          title: "Invite generated",
          description: "Share the invite using the options below.",
        });
      }

      const link = `${window.location.origin}/invites/reviewer?token=${inviteToken}`;


      // 📧 send invite email automatically
try {
  const conferenceTitle =
    conferences.find(c => c.id === inviteConferenceId)?.title || "Conference";

  await fetch("/api/send-reviewer-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: inviteEmail,
      conference: conferenceTitle,
      link,
    }),
  });

  toast({
    title: "Email sent",
    description: "Reviewer invitation email delivered.",
  });

} catch (err) {
  console.error("Invite email failed:", err);
}

      setInviteLink(link);
      setShowShareModal(true);

      setInviteEmail("");
      setInviteConferenceId("");

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: err.message ?? "Something went wrong",
      });
    } finally {
      setSendingInvite(false);
    }
  }

  /* ---------- UI ---------- */

 return (
  <div className="space-y-10 max-w-5xl mx-auto px-4">

    {/* Header */}
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">
        Reviewer Management
      </h1>
      <p className="text-gray-500">
        Invite reviewers and manage conference review teams.
      </p>
    </div>

    {/* Invite Section */}
    <Card className="p-6 space-y-5 border shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Invite Reviewer</h2>
        <p className="text-sm text-gray-500">
          Generate an invite link and automatically send it via email.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <Select
          value={inviteConferenceId}
          onValueChange={setInviteConferenceId}
        >
          <SelectTrigger className="md:w-[260px]">
            <SelectValue placeholder="Select conference" />
          </SelectTrigger>
          <SelectContent>
            {conferences.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="email"
          placeholder="reviewer@email.com"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
        />

        <Button
          onClick={sendInvite}
          disabled={sendingInvite}
          className="md:w-auto"
        >
          {sendingInvite ? "Generating..." : "Generate & Send"}
        </Button>
      </div>
    </Card>

    {/* Reviewer List */}
    <Card className="p-6 border shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">
          Reviewers by Conference
        </h2>
        <Badge variant="outline">
          {Object.values(reviewersByConference).flat().length} Total
        </Badge>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading reviewers…</p>
      ) : Object.keys(reviewersByConference).length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="font-medium">No reviewers yet</p>
          <p className="text-sm">
            Invite reviewers to begin the peer review process.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(reviewersByConference).map(
            ([confId, reviewers]) => (
              <div key={confId} className="space-y-3">
                <p className="font-semibold text-gray-700">
                  {
                    conferences.find(c => c.id === confId)
                      ?.title
                  }
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {reviewers.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition"
                    >
                      <span className="font-medium text-sm">
                        {r.name}
                      </span>
                      <Badge>Reviewer</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </Card>

    {/* Share Modal */}
    <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
      <DialogContent className="space-y-5">
        <DialogHeader>
          <DialogTitle>Share Reviewer Invite</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500">
          The reviewer has been emailed. You can also share the
          invite link manually.
        </p>

        <div className="space-y-3">

          <Button
            className="w-full"
            onClick={async () => {
              if (!inviteLink) return;
              await navigator.clipboard.writeText(inviteLink);
              toast({ title: "Link copied" });
            }}
          >
            Copy Link
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (!inviteLink) return;
              window.location.href = `mailto:${inviteEmail}?subject=Reviewer Invitation&body=You have been invited to review papers. Click here: ${inviteLink}`;
            }}
          >
            Send via Email
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (!inviteLink) return;
              window.open(
                `https://wa.me/?text=You have been invited to review papers. ${inviteLink}`,
                "_blank"
              );
            }}
          >
            Share on WhatsApp
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  </div>
);
}
