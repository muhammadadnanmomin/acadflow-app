"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

import { useOrganization } from "@/lib/organizations/useOrganization";

import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

import {
  Calendar,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

const supabase = createClient();


export default function OrganizerConferences() {
  const { profile } = useProfile();
  const organization = useOrganization();

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

  const [participantFee, setParticipantFee] = useState("");
  const [paperFee, setPaperFee] = useState("");
  const [publicationFee, setPublicationFee] = useState("");
  const [abstractFee, setAbstractFee] = useState("");

  const [deadline, setDeadline] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [conferences, setConferences] = useState<any[]>([]);

  /* Load conferences */
async function loadConferences() {
  if (!profile || !organization) return;

  const { data, error } = await supabase
    .from("conferences")
    .select("*")
    .or(
      `organizer_id.eq.${profile.id},organization_id.eq.${organization.id}`
    )
    .order("created_at", { ascending: false });

  if (!error) {
    setConferences(data || []);
  }
}

 useEffect(() => {
  loadConferences();
}, [profile, organization]);

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

    const { error } = await supabase.from("conferences").insert({
      title,
      description,
      start_date: start,
      end_date: end,

      venue,
      mode,

      participant_fee: participantFee || null,
      paper_fee: paperFee || null,
      publication_fee: publicationFee || null,
      abstract_fee: abstractFee || null,

      submission_deadline: deadline || null,
      max_participants: maxParticipants || null,

      contact_email: contactEmail,
      contact_phone: contactPhone,
      website_link: website,

      organizer_id: profile.id,
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

    setParticipantFee("");
    setPaperFee("");
    setPublicationFee("");
    setAbstractFee("");

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

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Conferences
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your academic events
          </p>
        </div>

        <Link href="/dashboard/organizer/conferences/new">
          <Button>
            + New Conference
          </Button>
        </Link>

      </div>


      {/* List */}
      <Card className="p-6 space-y-4">

        <h2 className="text-xl font-semibold">
          Your Conferences
        </h2>

        {conferences.length === 0 && (
          <p className="text-sm text-gray-500">
            No conferences yet.
          </p>
        )}

        <div className="space-y-3">

          {conferences.map((c) => (

            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-lg p-4 hover:bg-gray-50"
            >

              <div className="space-y-1">

                <Link
                  href={`/dashboard/organizer/conferences/${c.id}`}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  {c.title}
                </Link>


                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {c.start_date} → {c.end_date}
                </div>

                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs ${c.is_published
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {c.is_published ? "Published" : "Draft"}
                </span>

              </div>

              <div className="flex gap-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    togglePublish(c.id, !c.is_published)
                  }
                >
                  {c.is_published ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Publish
                    </>
                  )}
                </Button>

                {/* Edit */}
                <Link
                  href={`/dashboard/organizer/conferences/${c.id}/edit`}
                >
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteConference(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

              </div>

            </div>
          ))}

        </div>

      </Card>

    </div>
  );
}
