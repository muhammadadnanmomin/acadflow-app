"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function SubmitPage() {
  const { id } = useParams(); // conference id
  const router = useRouter();

  const { profile } = useProfile();

  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("paper");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  /* Upload */
  async function handleSubmit() {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
      });
      return;
    }

    setLoading(true);

    const path = `${profile.id}/${id}/${Date.now()}-${file.name}`;

    /* Upload to storage */
    const { error: uploadError } = await supabase.storage
      .from("papers")
      .upload(path, file, {
        upsert: false,
      });

    if (uploadError) {
      setLoading(false);

      toast({
        variant: "destructive",
        title: "Upload failed",
        description: uploadError.message,
      });

      return;
    }

    /* Get public URL */
    const { data } = supabase.storage
      .from("papers")
      .getPublicUrl(path);

    const fileUrl = data.publicUrl;

    /* Insert DB */
    const { error } = await supabase
      .from("paper_submissions")
      .insert({
        user_id: profile.id,
        conference_id: id,
        file_url: fileUrl,
        type,
        status: "submitted",
      });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message,
      });

      return;
    }

    toast({
      title: "Submitted successfully",
      description: "Your paper has been uploaded.",
    });

    router.push("/dashboard/participant/submissions");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">

      <Card className="p-6 space-y-6">

        <h1 className="text-2xl font-bold">
          Submit Paper / Abstract
        </h1>

        {/* Type */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Submission Type
          </label>

          <select
            className="w-full border rounded-md px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="paper">Full Paper</option>
            <option value="abstract">Abstract Only</option>
          </select>
        </div>

        {/* File */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Upload PDF
          </label>

          <Input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>

      </Card>

    </div>
  );
}
