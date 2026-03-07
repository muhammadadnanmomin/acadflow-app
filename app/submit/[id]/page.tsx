"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { type PlanType, canSubmitPaper, formatLimit } from "@/lib/config/pricing";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

import { AlertTriangle, FileText, Loader2 } from "lucide-react";

export default function SubmitPage() {
  const { id } = useParams(); // conference id
  const router = useRouter();

  const { profile } = useProfile();

  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("paper");
  const [loading, setLoading] = useState(false);

  /* ---- Submission limit state ---- */
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [submissionLimit, setSubmissionLimit] = useState<number | null>(150);
  const [orgPlanType, setOrgPlanType] = useState<PlanType>("free");

  const supabase = createClient();

  /* ---- Check submission limit on mount ---- */
  useEffect(() => {
    async function checkLimit() {
      if (!id) return;

      setCheckingLimit(true);

      try {
        /* Get the conference's organization */
        const { data: conference } = await supabase
          .from("conferences")
          .select("organization_id")
          .eq("id", id)
          .single();

        if (!conference?.organization_id) {
          setCheckingLimit(false);
          return;
        }

        /* Get the org's plan */
        const { data: org } = await supabase
          .from("organizations")
          .select("plan_type, submission_limit")
          .eq("id", conference.organization_id)
          .single();

        const planType: PlanType = org?.plan_type || "free";
        const limit: number | null = org?.submission_limit ?? 150;

        setOrgPlanType(planType);
        setSubmissionLimit(limit);

        /* Count submissions for THIS conference */
        const { count } = await supabase
          .from("paper_submissions")
          .select("*", { count: "exact", head: true })
          .eq("conference_id", id);

        const currentCount = count || 0;
        setSubmissionCount(currentCount);

        /* Check if limit reached */
        if (!canSubmitPaper(planType, currentCount)) {
          setLimitReached(true);
        }
      } catch (err) {
        console.error("Limit check error:", err);
      } finally {
        setCheckingLimit(false);
      }
    }

    checkLimit();
  }, [id]);

  /* ---- Upload ---- */
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

  /* ---- Loading state ---- */
  if (checkingLimit) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading…</span>
        </Card>
      </div>
    );
  }

  /* ---- Limit reached state ---- */
  if (limitReached) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Submission Limit Reached
          </h1>

          <p className="text-gray-600 max-w-md mx-auto">
            This conference has reached the Free plan submission limit
            ({formatLimit(submissionLimit)} papers). The organizer can upgrade
            to Pro to continue accepting submissions.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            <span>
              {submissionCount} / {formatLimit(submissionLimit)} submissions used
            </span>
          </div>

          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">

      <Card className="p-6 space-y-6">

        <h1 className="text-2xl font-bold">
          Submit Paper / Abstract
        </h1>

        {/* Submission count indicator */}
        {submissionLimit !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <FileText className="h-4 w-4" />
            <span>
              {submissionCount} / {formatLimit(submissionLimit)} submissions used
            </span>
          </div>
        )}

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
