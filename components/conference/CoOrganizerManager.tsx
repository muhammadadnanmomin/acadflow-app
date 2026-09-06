"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Crown,
  UserPlus,
  Mail,
  Building2,
  AlertCircle,
} from "lucide-react";

const supabase = createClient();

interface Organizer {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  organization_name: string | null;
  profiles: {
    name: string | null;
    email: string | null;
  };
}

interface CoOrganizerManagerProps {
  conferenceId: string;
}

export default function CoOrganizerManager({
  conferenceId,
}: CoOrganizerManagerProps) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  /* ---- Load organizers ---- */
  const loadOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(
        `/api/organizer/co-organizers?conferenceId=${conferenceId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setOrganizers(data.organizers || []);
        setIsOwner(data.isOwner);
      }
    } catch (err) {
      console.error("Failed to load co-organizers:", err);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    loadOrganizers();
  }, [loadOrganizers]);

  /* ---- Add co-organizer ---- */
  async function handleAdd() {
    const trimmed = email.trim();
    if (!trimmed) return;

    setAdding(true);
    setAddError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch("/api/organizer/co-organizers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conferenceId, email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error);
        toast({
          variant: "destructive",
          title: "Failed to add",
          description: data.error,
        });
      } else {
        toast({ title: "Co-organizer added", description: data.message });
        setEmail("");
        setAddError(null);
        loadOrganizers();
      }
    } catch (err) {
      const msg = "Something went wrong";
      setAddError(msg);
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setAdding(false);
    }
  }

  /* ---- Remove co-organizer ---- */
  async function handleRemove(userId: string) {
    setRemovingId(userId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch("/api/organizer/co-organizers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conferenceId, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Failed to remove",
          description: data.error,
        });
      } else {
        toast({ title: "Removed", description: data.message });
        loadOrganizers();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setRemovingId(null);
    }
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading co-organizers…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current organizers list */}
      <div className="space-y-2">
        {organizers.length === 0 ? (
          <p className="text-sm text-gray-500">No co-organizers yet</p>
        ) : (
          organizers.map((org) => {
            const orgName = org.organization_name || null;

            return (
              <div
                key={org.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 bg-white hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 shrink-0">
                    {org.role === "owner" ? (
                      <Crown className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Users className="h-4 w-4 text-indigo-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {org.profiles?.name || "Unknown"}
                    </p>
                    {org.profiles?.email && (
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        {org.profiles.email}
                      </p>
                    )}
                    {orgName && (
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {orgName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={
                      org.role === "owner"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }
                  >
                    {org.role === "owner" ? "Owner" : "Organizer"}
                  </Badge>

                  {isOwner && org.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(org.user_id)}
                      disabled={removingId === org.user_id}
                      className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
                    >
                      {removingId === org.user_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add co-organizer form (owner-only) */}
      {isOwner && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <UserPlus className="h-4 w-4 text-indigo-500" />
            Add Co-Organizer
          </div>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address…"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (addError) setAddError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className={`flex-1 ${addError ? "border-red-300 focus-visible:ring-red-400" : ""}`}
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !email.trim()}
              className="gap-1.5 shrink-0"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>

          {/* Inline error message */}
          {addError && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Only users with an existing Confairo account and organization
            membership can be added. They will immediately gain access to manage
            this conference.
          </p>
        </div>
      )}
    </div>
  );
}
