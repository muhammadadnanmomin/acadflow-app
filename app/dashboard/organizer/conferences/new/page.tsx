"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

import { getOrCreateOrganization } from "@/lib/organizations/getOrCreateOrganization";

import {
  Calendar,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

const supabase = createClient();

export default function OrganizerConferences() {
  const { profile } = useProfile();

  function usePersistedState(key: string, defaultValue: any) {
    const [state, setState] = useState(() => {
      if (typeof window === "undefined") return defaultValue;

      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    });

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
  }

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [venue, setVenue] = useState("");
  const [mode, setMode] = useState("offline");

  const [registrationFee, setRegistrationFee] = useState("");
  const [physicalFee, setPhysicalFee] = useState("");
  const [virtualFee, setVirtualFee] = useState("");
  const [fullPublicationFee, setFullPublicationFee] = useState("");
  const [abstractPublicationFee, setAbstractPublicationFee] = useState("");

  const [deadline, setDeadline] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [conferences, setConferences] = useState<any[]>([]);

  /* Load conferences */
  async function loadConferences() {
    if (!profile) return;

    // get organization
    const orgId = await getOrCreateOrganization(
      profile.id,
      profile.name || "My Organization"
    );

    const { data, error } = await supabase
      .from("conferences")
      .select("*")
      .or(
        `organizer_id.eq.${profile.id},organization_id.eq.${orgId}`
      )
      .order("created_at", { ascending: false });

    if (!error) {
      setConferences(data || []);
    }
  }

  useEffect(() => {
    loadConferences();
  }, [profile]);

  /* Create conference */
  async function createConference() {
    if (!profile) return;

    if (!title || !start || !end) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill all required fields.",
      });
      return;
    }

    setLoading(true);

    // get or create personal organization
    const orgId = await getOrCreateOrganization(
      profile.id,
      profile.name || "My Organization"
    );

    const { error } = await supabase.from("conferences").insert({
      title,
      description,
      start_date: start,
      end_date: end,

      venue,
      mode,

      registration_fee: registrationFee || null,
      physical_presentation_fee: physicalFee || null,
      virtual_presentation_fee: virtualFee || null,
      full_paper_publication_fee: fullPublicationFee || null,
      abstract_publication_fee: abstractPublicationFee || null,

      submission_deadline: deadline || null,
      max_participants: maxParticipants || null,

      contact_email: contactEmail,
      contact_phone: contactPhone,
      website_link: website,

      organizer_id: profile.id,   // keep
      organization_id: orgId,     // NEW

      is_published: false,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Conference created",
      description: "Your conference has been created successfully.",
    });

    setVenue("");
    setMode("offline");

    setRegistrationFee("");
    setPhysicalFee("");
    setVirtualFee("");
    setFullPublicationFee("");
    setAbstractPublicationFee("");

    setDeadline("");
    setMaxParticipants("");

    setContactEmail("");
    setContactPhone("");
    setWebsite("");

    loadConferences();
  }

  /* Publish / Unpublish */
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

  /* Delete */
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

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Manage Conferences
        </h1>

        <p className="text-gray-500 mt-1">
          Create, publish and manage your events
        </p>
      </div>

      {/* Create */}
      <Card className="p-6 space-y-5">

        <h2 className="text-xl font-semibold">
          Create Conference
        </h2>

        <div className="grid gap-4 md:grid-cols-2">

          {/* Title */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Venue */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Venue</label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>

          {/* Mode */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Mode</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Dates */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Start Date *</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">End Date *</label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>

          {/* Deadline */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Submission Deadline</label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {/* Max */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Max Participants</label>
            <Input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />
          </div>

          {/* Fees */}
          {/* Fees */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Registration Fee</label>
            <Input
              type="number"
              value={registrationFee}
              onChange={(e) => setRegistrationFee(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Physical Presentation Fee</label>
            <Input
              type="number"
              value={physicalFee}
              onChange={(e) => setPhysicalFee(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Virtual Presentation Fee</label>
            <Input
              type="number"
              value={virtualFee}
              onChange={(e) => setVirtualFee(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Full Paper Publication Fee</label>
            <Input
              type="number"
              value={fullPublicationFee}
              onChange={(e) => setFullPublicationFee(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Abstract Publication Fee</label>
            <Input
              type="number"
              value={abstractPublicationFee}
              onChange={(e) => setAbstractPublicationFee(e.target.value)}
            />
          </div>

          {/* Contact */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Contact Email</label>
            <Input
              placeholder=""
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Contact Phone</label>
            <Input
              placeholder=""
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          {/* Website */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium">Website Link</label>
            <Input
              placeholder=""
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

        </div>

        <Button onClick={createConference} disabled={loading}>
          {loading ? "Creating..." : "Create Conference"}
        </Button>

      </Card>
    </div>
  );
}
