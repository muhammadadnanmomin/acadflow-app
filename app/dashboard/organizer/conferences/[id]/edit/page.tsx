"use client";

import { useParams } from "next/navigation";

import ConferenceForm from "@/components/conference/ConferenceForm";

export default function EditConference() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Edit Conference</h1>

      <ConferenceForm mode="edit" conferenceId={id} />
    </div>
  );
}