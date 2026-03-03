"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

import {
  Search,
  X,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Loader2,
  Copy,
  Mail,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

/* ---------- TYPES ---------- */

interface Conference {
  id: string;
  title: string;
}

interface Reviewer {
  id: string;
  name: string;
}

interface WorkloadEntry {
  total: number;
  active: number;
  completed: number;
}

interface PendingInvite {
  id: string;
  email: string;
  conference_id: string;
  token: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
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
  const [workloadMap, setWorkloadMap] = useState<Record<string, WorkloadEntry>>({});

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteConferenceId, setInviteConferenceId] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConference, setSelectedConference] = useState("all");

  // Pending invites
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [cancelTarget, setCancelTarget] = useState<PendingInvite | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Remove reviewer
  const [removeTarget, setRemoveTarget] = useState<{ reviewerId: string; conferenceId: string; reviewerName: string } | null>(null);
  const [removing, setRemoving] = useState(false);

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
        setWorkloadMap({});
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
      const allReviewerIds = new Set<string>();

      regs?.forEach((r: any) => {
        if (!map[r.conference_id]) map[r.conference_id] = [];
        map[r.conference_id].push({
          id: r.user_id,
          name: r.profiles?.name ?? "Unknown",
        });
        allReviewerIds.add(r.user_id);
      });

      setReviewersByConference(map);

      // Load workload stats (ONE aggregated query)
      if (allReviewerIds.size > 0) {
        const { data: assignments } = await supabase
          .from("paper_submissions")
          .select("reviewer_id, status")
          .in("reviewer_id", Array.from(allReviewerIds));

        const wl: Record<string, WorkloadEntry> = {};
        assignments?.forEach(a => {
          if (!wl[a.reviewer_id]) wl[a.reviewer_id] = { total: 0, active: 0, completed: 0 };
          wl[a.reviewer_id].total++;
          if (["submitted", "under_review", "resubmitted"].includes(a.status)) {
            wl[a.reviewer_id].active++;
          }
          if (["accepted", "rejected"].includes(a.status)) {
            wl[a.reviewer_id].completed++;
          }
        });
        setWorkloadMap(wl);
      } else {
        setWorkloadMap({});
      }

      // Load pending invites
      const { data: invites } = await supabase
        .from("reviewer_invites")
        .select("id, email, conference_id, token, accepted, expires_at, created_at")
        .in("conference_id", conferenceIds)
        .eq("accepted", false)
        .order("created_at", { ascending: false });

      setPendingInvites(invites || []);
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

  /* ---------- REMOVE REVIEWER ---------- */

  async function removeReviewer() {
    if (!removeTarget) return;
    setRemoving(true);

    try {
      // Safety check: any active assignments?
      const { data: activeAssignments } = await supabase
        .from("paper_submissions")
        .select("id")
        .eq("reviewer_id", removeTarget.reviewerId)
        .eq("conference_id", removeTarget.conferenceId)
        .not("status", "in", '("accepted","rejected")');

      if (activeAssignments && activeAssignments.length > 0) {
        toast({
          variant: "destructive",
          title: "Cannot remove reviewer",
          description: `This reviewer has ${activeAssignments.length} active paper assignment${activeAssignments.length > 1 ? "s" : ""}. Reassign or complete them first.`,
        });
        setRemoving(false);
        setRemoveTarget(null);
        return;
      }

      // Safe to remove — delete conference_registrations entry only
      const { error } = await supabase
        .from("conference_registrations")
        .delete()
        .eq("user_id", removeTarget.reviewerId)
        .eq("conference_id", removeTarget.conferenceId)
        .eq("role", "reviewer");

      if (error) throw error;

      toast({
        title: "Reviewer removed",
        description: `${removeTarget.reviewerName} has been removed from this conference.`,
      });

      setRemoveTarget(null);
      loadData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove reviewer",
        description: err.message ?? "Something went wrong",
      });
    } finally {
      setRemoving(false);
    }
  }

  /* ---------- CANCEL INVITE ---------- */

  async function cancelInvite() {
    if (!cancelTarget) return;
    setCancelling(true);

    try {
      const { error } = await supabase
        .from("reviewer_invites")
        .delete()
        .eq("id", cancelTarget.id);

      if (error) throw error;

      toast({
        title: "Invite cancelled",
        description: `Invitation for ${cancelTarget.email} has been removed.`,
      });

      setCancelTarget(null);
      loadData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to cancel invite",
        description: err.message ?? "Something went wrong",
      });
    } finally {
      setCancelling(false);
    }
  }

  /* ---------- RESEND INVITE ---------- */

  async function resendInvite(invite: PendingInvite) {
    setResendingId(invite.id);

    try {
      const link = `${window.location.origin}/invites/reviewer?token=${invite.token}`;
      const conferenceTitle = conferences.find(c => c.id === invite.conference_id)?.title || "Conference";

      await fetch("/api/send-reviewer-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invite.email,
          conference: conferenceTitle,
          link,
        }),
      });

      toast({
        title: "Email resent",
        description: `Invitation resent to ${invite.email}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: err.message ?? "Something went wrong",
      });
    } finally {
      setResendingId(null);
    }
  }

  /* ---------- FILTERED REVIEWERS ---------- */

  const filteredEntries = useMemo(() => {
    let entries = Object.entries(reviewersByConference);

    // Conference filter
    if (selectedConference !== "all") {
      entries = entries.filter(([confId]) => confId === selectedConference);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries
        .map(([confId, reviewers]) => [
          confId,
          reviewers.filter(r => r.name.toLowerCase().includes(q)),
        ] as [string, Reviewer[]])
        .filter(([, reviewers]) => reviewers.length > 0);
    }

    return entries;
  }, [reviewersByConference, selectedConference, searchQuery]);

  const filteredReviewerCount = filteredEntries.reduce((sum, [, r]) => sum + r.length, 0);
  const totalReviewerCount = Object.values(reviewersByConference).flat().length;

  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    selectedConference !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function clearFilters() {
    setSearchQuery("");
    setSelectedConference("all");
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

      {/* ── Pending Invitations ── */}
      <Card className="p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
          {pendingInvites.length > 0 && (
            <Badge variant="outline">{pendingInvites.length} Pending</Badge>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading invitations…</p>
        ) : pendingInvites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvites.map(invite => {
              const confTitle = conferences.find(c => c.id === invite.conference_id)?.title || "Unknown";
              const expiry = new Date(invite.expires_at);
              const now = new Date();
              const daysRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

              let expiryBadge: { label: string; cls: string };
              if (expiry < now) {
                expiryBadge = { label: "Expired", cls: "bg-red-100 text-red-700" };
              } else if (daysRemaining <= 2) {
                expiryBadge = { label: "Expiring Soon", cls: "bg-yellow-100 text-yellow-700" };
              } else {
                expiryBadge = { label: "Active", cls: "bg-green-100 text-green-700" };
              }

              const link = `${window.location.origin}/invites/reviewer?token=${invite.token}`;

              return (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 bg-white hover:bg-gray-50 transition gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-gray-500">Conference: {confTitle}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={expiryBadge.cls}>{expiryBadge.label}</Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {expiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(link);
                        toast({ title: "Link copied" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resendingId === invite.id}
                      onClick={() => resendInvite(invite)}
                    >
                      {resendingId === invite.id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 mr-1" />
                      )}
                      Resend
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCancelTarget(invite)}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Filter Panel ── */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search reviewer…"
            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Conference</label>
            <select
              value={selectedConference}
              onChange={e => setSelectedConference(e.target.value)}
              className={`border rounded-md px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${selectedConference !== "all" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200"
                }`}
            >
              <option value="all">All Conferences</option>
              {conferences.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Clear Filters
            </button>
          )}
        </div>

        {!loading && (
          <p className="text-xs text-gray-400">
            Showing {filteredReviewerCount} of {totalReviewerCount} reviewer{totalReviewerCount !== 1 ? "s" : ""}
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`}
          </p>
        )}
      </Card>

      {/* ── Reviewer List ── */}
      <Card className="p-6 border shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            Reviewers by Conference
          </h2>
          <Badge variant="outline">
            {totalReviewerCount} Total
          </Badge>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading reviewers…</p>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {activeFilterCount > 0 ? (
              <>
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No reviewers match current filters.</p>
                <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:underline">
                  Clear all filters
                </button>
              </>
            ) : (
              <>
                <p className="font-medium">No reviewers yet</p>
                <p className="text-sm">
                  Invite reviewers to begin the peer review process.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredEntries.map(
              ([confId, reviewers]) => (
                <div key={confId} className="space-y-3">
                  <p className="font-semibold text-gray-700">
                    {
                      conferences.find(c => c.id === confId)
                        ?.title
                    }
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {reviewers.map(r => {
                      const wl = workloadMap[r.id];
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition"
                        >
                          <div>
                            <span className="font-medium text-sm">
                              {r.name}
                            </span>
                            {wl && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Assigned: {wl.total} | Active: {wl.active} | Completed: {wl.completed}
                              </p>
                            )}
                            {!wl && (
                              <p className="text-xs text-gray-400 mt-0.5">No assignments</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>Reviewer</Badge>
                            <button
                              onClick={() => setRemoveTarget({ reviewerId: r.id, conferenceId: confId, reviewerName: r.name })}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                              title="Remove reviewer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* ── Remove Confirmation Modal ── */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Reviewer
            </h2>

            <p className="text-sm text-gray-600">
              Are you sure you want to remove <strong>{removeTarget.reviewerName}</strong> from this conference?
            </p>

            <p className="text-xs text-gray-400">
              This will only remove their conference role. Their profile and past reviews will not be affected.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={removeReviewer}
                disabled={removing}
              >
                {removing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Remove
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Cancel Invite Confirmation Modal ── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Invitation
            </h2>

            <p className="text-sm text-gray-600">
              Are you sure you want to cancel the invitation for <strong>{cancelTarget.email}</strong>?
            </p>

            <p className="text-xs text-gray-400">
              The invite link will be invalidated and the reviewer will no longer be able to accept it.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                Keep Invite
              </Button>
              <Button
                variant="destructive"
                onClick={cancelInvite}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                Cancel Invite
              </Button>
            </div>
          </Card>
        </div>
      )}

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
