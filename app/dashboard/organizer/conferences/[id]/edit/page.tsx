"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

import { toast } from "@/components/ui/use-toast";

export default function EditConference() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const { profile, loading } = useProfile();

  const id = params.id as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Fields */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [venue, setVenue] = useState("");
  const [mode, setMode] = useState("offline");
  const [deadline, setDeadline] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  /* ✅ Fee fields */
  const [registrationFee, setRegistrationFee] = useState("");
  const [physicalFee, setPhysicalFee] = useState("");
  const [virtualFee, setVirtualFee] = useState("");
  const [fullPublicationFee, setFullPublicationFee] = useState("");
  const [abstractPublicationFee, setAbstractPublicationFee] = useState("");

  /* Load */
  async function loadConference() {
    if (!profile || !id) return;

    const { data, error } = await supabase
      .from("conferences")
      .select("*")
      .eq("id", id)
      .eq("organizer_id", profile.id)
      .single();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Not found",
        description: "Conference not found.",
      });

      router.push("/dashboard/organizer/conferences");
      return;
    }

    /* Set fields */
    setTitle(data.title || "");
    setDescription(data.description || "");
    setStart(data.start_date || "");
    setEnd(data.end_date || "");
    setVenue(data.venue || "");
    setMode(data.mode || "offline");
    setDeadline(data.submission_deadline || "");
    setMaxParticipants(data.max_participants || "");

    /* ✅ Load fees */
    setRegistrationFee(data.registration_fee || "");
    setPhysicalFee(data.physical_presentation_fee || "");
    setVirtualFee(data.virtual_presentation_fee || "");
    setFullPublicationFee(data.full_paper_publication_fee || "");
    setAbstractPublicationFee(data.abstract_publication_fee || "");

    setPageLoading(false);
  }

  useEffect(() => {
    if (!loading) loadConference();
  }, [loading, profile]);

  /* Save */
  async function handleSave() {
    if (!title || !start || !end) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Title and dates are required.",
      });
      return;
    }

    setSaving(true);
    
    if (!profile) return;
    const { error } = await supabase
      .from("conferences")
      .update({
        title,
        description,
        start_date: start,
        end_date: end,
        venue,
        mode,
        submission_deadline: deadline || null,
        max_participants: maxParticipants || null,

        /* ✅ Save fees */
        registration_fee: registrationFee || null,
        physical_presentation_fee: physicalFee || null,
        virtual_presentation_fee: virtualFee || null,
        full_paper_publication_fee: fullPublicationFee || null,
        abstract_publication_fee: abstractPublicationFee || null,
      })
      .eq("id", id)
      .eq("organizer_id", profile.id);

    setSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Updated",
      description: "Conference updated successfully.",
    });

    router.push("/dashboard/organizer/conferences");
  }

  if (loading || pageLoading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">
        Edit Conference
      </h1>

      <Card className="p-6 space-y-4">

        {/* Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* Description */}
        <div className="space-y-1">
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
            className="w-full rounded-md border px-3 py-2"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Start Date *</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">End Date *</label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
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

        {/* ✅ Fees */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Registration Fee</label>
            <Input type="number" value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Physical Presentation Fee</label>
            <Input type="number" value={physicalFee} onChange={(e) => setPhysicalFee(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Virtual Presentation Fee</label>
            <Input type="number" value={virtualFee} onChange={(e) => setVirtualFee(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Full Paper Publication Fee</label>
            <Input type="number" value={fullPublicationFee} onChange={(e) => setFullPublicationFee(e.target.value)} />
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Abstract Publication Fee</label>
            <Input type="number" value={abstractPublicationFee} onChange={(e) => setAbstractPublicationFee(e.target.value)} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/organizer/conferences")}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

      </Card>
    </div>
  );
}