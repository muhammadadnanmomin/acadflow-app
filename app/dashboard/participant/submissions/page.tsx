"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import {
  Upload,
  FileText,
  Download,
  Loader2,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Mail,
  GraduationCap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PartyPopper,
} from "lucide-react";

export default function ParticipantSubmissionsPage() {
  const { profile } = useProfile();
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [authors, setAuthors] = useState<Record<string, any[]>>({});

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const [affiliations, setAffiliations] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [declarations, setDeclarations] = useState<Record<string, any>>({});
  const [coAuthors, setCoAuthors] = useState<Record<string, any[]>>({});

  // Post-submission states
  const [cameraReadyFiles, setCameraReadyFiles] = useState<Record<string, File | null>>({});
  const [revisionFiles, setRevisionFiles] = useState<Record<string, File | null>>({});
  const [revisionUploading, setRevisionUploading] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    const { data: regs } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        conference_id,
        conferences (
          title,
          presentation_ppt_template_url
        )
      `)
      .eq("user_id", profile.id)
      .eq("role", "author");

    setRegistrations(regs || []);

    const confIds = regs?.map(r => r.conference_id) || [];

    const { data: subs } = await supabase
      .from("paper_submissions")
      .select("*")
      .eq("user_id", profile.id)
      .in("conference_id", confIds);

    const map: Record<string, any> = {};
    subs?.forEach(s => {
      map[s.conference_id] = s;
    });

    setSubmissions(map);

    // Fetch authors for all submissions
    if (subs?.length) {
      const subIds = subs.map(s => s.id);
      const { data: auth } = await supabase
        .from("paper_authors")
        .select("*")
        .in("submission_id", subIds)
        .order("author_order", { ascending: true });

      const authorMap: Record<string, any[]> = {};
      auth?.forEach(a => {
        if (!authorMap[a.submission_id]) authorMap[a.submission_id] = [];
        authorMap[a.submission_id].push(a);
      });
      setAuthors(authorMap);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  function addAuthor(confId: string) {
    setCoAuthors(prev => ({
      ...prev,
      [confId]: [...(prev[confId] || []), { name: "", email: "", affiliation: "" }],
    }));
  }

  function updateAuthor(confId: string, index: number, field: string, value: string) {
    const list = [...(coAuthors[confId] || [])];
    list[index][field] = value;
    setCoAuthors(prev => ({ ...prev, [confId]: list }));
  }

  function removeAuthor(confId: string, index: number) {
    const list = [...(coAuthors[confId] || [])];
    list.splice(index, 1);
    setCoAuthors(prev => ({ ...prev, [confId]: list }));
  }

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  /* ─── Camera-Ready Upload ─── */
  async function uploadCameraReady(confId: string, submissionId: string) {
    const file = cameraReadyFiles[confId];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ variant: "destructive", title: "Session expired. Please log in again." });
      return;
    }

    const path = `${session.user.id}/${confId}/camera_ready_${Date.now()}_${file.name}`;

    await supabase.storage.from("papers").upload(path, file, { upsert: true });
    const url = supabase.storage.from("papers").getPublicUrl(path).data.publicUrl;

    await supabase
      .from("paper_submissions")
      .update({
        camera_ready_url: url,
        status: "final_submitted",
      })
      .eq("id", submissionId);

    toast({ title: "Camera-ready version uploaded ✅" });
    loadData();
  }

  /* ─── Revision Upload ─── */
  async function uploadRevision(confId: string, submission: any) {
    const file = revisionFiles[confId];
    if (!file) {
      toast({ variant: "destructive", title: "Please select a PDF file first" });
      return;
    }

    setRevisionUploading(confId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Session expired. Please log in again." });
        setRevisionUploading(null);
        return;
      }

      const newRevision = (submission.revision_number || 1) + 1;
      const path = `${session.user.id}/${confId}/revision_${newRevision}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("papers")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const url = supabase.storage.from("papers").getPublicUrl(path).data.publicUrl;

      // Insert revision record
      await supabase.from("paper_revisions").insert({
        submission_id: submission.id,
        file_url: url,
        revision_number: newRevision,
        uploaded_by: session.user.id,
      });

      // Update main submission
      const { error: updateError } = await supabase
        .from("paper_submissions")
        .update({
          file_url: url,
          revision_number: newRevision,
          status: "resubmitted",
          reviewed_at: null,
          decision_at: null,
        })
        .eq("id", submission.id);
      if (updateError) throw updateError;

      toast({ title: `Revision ${newRevision} uploaded successfully ✅` });
      setRevisionFiles(prev => ({ ...prev, [confId]: null }));
      loadData();
    } catch (err: any) {
      console.error("Revision upload failed:", err);
      toast({
        variant: "destructive",
        title: "Failed to upload revision",
        description: err?.message || "An unexpected error occurred",
      });
    } finally {
      setRevisionUploading(null);
    }
  }

  /* ─── Payment Handler ─── */
  async function handlePayment(confId: string, submission: any) {
    setPaying(confId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Session expired. Please log in again." });
        setPaying(null);
        return;
      }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: submission.presentation_fee,
          conferenceId: confId,
          userId: session.user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create payment order");
      }

      const order = await res.json();

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "AcadFlow",
        description: `Presentation Fee — ${submission.title}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                submissionId: submission.id,
              }),
            });
            if (!verifyRes.ok) throw new Error("Payment verification failed");
            toast({ title: "Payment successful! ✅" });
            loadData();
          } catch (err: any) {
            toast({ variant: "destructive", title: "Payment verification failed", description: err?.message || "Please contact support" });
          } finally {
            setPaying(null);
          }
        },
        modal: { ondismiss: () => setPaying(null) },
        prefill: { email: session.user.email, name: profile?.name || "" },
        theme: { color: "#4F46E5" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast({ variant: "destructive", title: "Payment failed", description: response.error?.description || "Please try again" });
        setPaying(null);
      });
      rzp.open();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Payment failed", description: err?.message || "An unexpected error occurred" });
      setPaying(null);
    }
  }

  /* ─── Paper Upload ─── */
  async function uploadPaper(confId: string) {
    const file = files[confId];
    const title = titles[confId];

    if (!title || !emails[confId]) {
      toast({ variant: "destructive", title: "Please fill all required fields" });
      return;
    }

    const d = declarations[confId];
    if (!d?.original || !d?.notSubmitted || !d?.noPlagiarism || !d?.approved) {
      toast({ variant: "destructive", title: "Please accept all declarations" });
      return;
    }

    if (!file) {
      toast({ variant: "destructive", title: "Please upload the PDF file" });
      return;
    }

    setUploading(confId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const path = `${session.user.id}/${confId}/${Date.now()}_${file.name}`;

    await supabase.storage.from("papers").upload(path, file, { upsert: true });
    const url = supabase.storage.from("papers").getPublicUrl(path).data.publicUrl;

    const conferenceTitle =
      registrations.find(r => r.conference_id === confId)
        ?.conferences?.title || "Conference";

    const { data: submission } = await supabase
      .from("paper_submissions")
      .upsert({
        user_id: session.user.id,
        conference_id: confId,
        file_url: url,
        title,
        affiliation: affiliations[confId],
        email: emails[confId],
        contact_number: contacts[confId],
        declaration_original: d.original,
        declaration_not_submitted: d.notSubmitted,
        declaration_no_plagiarism: d.noPlagiarism,
        declaration_author_approval: d.approved,
        status: "submitted",
      })
      .select()
      .single();

    const authorsToInsert = [
      {
        submission_id: submission.id,
        name: profile?.name || "Primary Author",
        email: session.user.email,
        affiliation: affiliations[confId],
        is_primary: true,
        author_order: 1,
      },
      ...(coAuthors[confId] || []).map((a, i) => ({
        submission_id: submission.id,
        name: a.name,
        email: a.email,
        affiliation: a.affiliation,
        is_primary: false,
        author_order: i + 2,
      })),
    ];

    await supabase.from("paper_authors").insert(authorsToInsert);

    // 📧 send submission confirmation email to ALL authors
    try {
      for (const author of authorsToInsert) {
        if (!author.email) continue;

        const cleanName =
          author.name &&
            !author.name.toLowerCase().includes("author")
            ? author.name.trim()
            : "Author";

        await fetch("/api/send-submission-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: author.email,
            name: cleanName,
            conference: conferenceTitle,
          }),
        });
      }
    } catch (err) {
      console.error("Submission email failed:", err);
    }

    toast({ title: "Paper submitted successfully ✅" });

    setUploading(null);
    loadData();
  }

  /* ═══════════════════════════════════ RENDER ═══════════════════════════════════ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500 text-sm">Loading submissions…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <p className="text-gray-500 mt-1">
          Upload and track your paper submissions
        </p>
      </div>

      {registrations.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No conference registrations found.</p>
          <p className="text-xs text-gray-400 mt-1">Register for a conference as an author to submit papers.</p>
        </Card>
      )}

      {registrations.map(reg => {
        const submission = submissions[reg.conference_id];
        const confId = reg.conference_id;
        const confTitle = reg.conferences?.title || "Conference";
        const pptTemplateUrl =
          reg.conferences?.presentation_ppt_template_url || null;

        return (
          <Card key={reg.id} className="overflow-hidden">

            {/* ── Conference Header ── */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">{confTitle}</span>
              </div>
              {submission && <StatusBadge status={submission.status} />}
            </div>

            <div className="p-5">
              {/* ═══════ SUBMISSION FORM (no submission yet) ═══════ */}
              {!submission && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Paper Title *</label>
                    <Input
                      placeholder="Enter full paper title"
                      onChange={e => setTitles(p => ({ ...p, [confId]: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Primary Author Affiliation</label>
                    <Input
                      placeholder="e.g. ABC College of Engineering"
                      onChange={e => setAffiliations(p => ({ ...p, [confId]: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Primary Author Email *</label>
                    <Input
                      type="email"
                      placeholder="author@email.com"
                      onChange={e => setEmails(p => ({ ...p, [confId]: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Contact Number</label>
                    <Input
                      placeholder="+91 9876543210"
                      onChange={e => setContacts(p => ({ ...p, [confId]: e.target.value }))}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mt-2">Co-Authors (Optional)</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Add co-authors in the order they should appear in the publication.
                    </p>

                    {(coAuthors[confId] || []).map((a, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <Input placeholder="Author Name"
                          onChange={e => updateAuthor(confId, i, "name", e.target.value)} />
                        <Input placeholder="Email Address"
                          onChange={e => updateAuthor(confId, i, "email", e.target.value)} />
                        <Input placeholder="Affiliation"
                          onChange={e => updateAuthor(confId, i, "affiliation", e.target.value)} />
                        <Button size="sm" variant="outline" onClick={() => removeAuthor(confId, i)}>✕</Button>
                      </div>
                    ))}

                    <Button size="sm" variant="outline" onClick={() => addAuthor(confId)}>
                      + Add Co-Author
                    </Button>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Upload Paper (PDF only) *</label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={e =>
                        setFiles(prev => ({
                          ...prev,
                          [confId]: e.target.files?.[0] || null
                        }))
                      }
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mt-3">Author Declaration</h3>
                    <p className="text-xs text-gray-500 mb-1">
                      Please confirm the following before submission.
                    </p>

                    {[
                      ["original", "This paper is original work"],
                      ["notSubmitted", "This paper is not submitted elsewhere"],
                      ["noPlagiarism", "This paper contains no plagiarism"],
                      ["approved", "All authors have approved this submission"]
                    ].map(([key, label]) => (
                      <label key={key} className="flex gap-2 text-sm items-center">
                        <input
                          type="checkbox"
                          onChange={e => setDeclarations(p => ({
                            ...p,
                            [confId]: { ...p[confId], [key]: e.target.checked }
                          }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <Button
                    disabled={uploading === confId}
                    onClick={() => uploadPaper(confId)}
                  >
                    {uploading === confId ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting…</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-1" /> Submit Paper for Review</>
                    )}
                  </Button>
                </div>
              )}

              {/* ═══════ POST-SUBMISSION DASHBOARD ═══════ */}
              {submission && (
                <div className="space-y-6">

                  {/* ── Submission Overview ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Paper Title</p>
                      <p className="font-semibold text-lg">{submission.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Submission ID</p>
                        <p className="text-sm font-mono text-gray-600">{submission.id?.slice(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
                        <p className="text-sm text-gray-600">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {submission.revision_number > 1 && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Revision</p>
                          <p className="text-sm text-gray-600">v{submission.revision_number}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Status Timeline ── */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Progress Timeline</h3>
                    <div className="flex flex-wrap gap-2">
                      <TimelineStep
                        label="Submitted"
                        done={!!submission.created_at}
                        date={submission.created_at}
                      />
                      <TimelineStep
                        label="Under Review"
                        done={!!submission.reviewed_at || !!submission.decision_at}
                      />
                      <TimelineStep
                        label="Reviewed"
                        done={!!submission.reviewed_at}
                        date={submission.reviewed_at}
                      />
                      <TimelineStep
                        label={submission.status === "rejected" ? "Rejected" : submission.status === "accepted" ? "Accepted" : "Decision"}
                        done={!!submission.decision_at}
                        date={submission.decision_at}
                        variant={submission.status === "rejected" ? "red" : submission.status === "accepted" ? "green" : undefined}
                      />
                      <TimelineStep
                        label="Camera Ready"
                        done={!!submission.camera_ready_url}
                      />
                      <TimelineStep
                        label="Certificate"
                        done={!!submission.certificate_generated}
                      />
                    </div>
                  </div>

                  {/* ── Quick Actions ── */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(submission.file_url)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Download Paper
                    </Button>
                    {submission.camera_ready_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(submission.camera_ready_url)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Camera Ready
                      </Button>
                    )}
                    {submission.status === "revision_required" && (
                      <Button size="sm" variant="outline" onClick={() => toggleSection(`rev-${confId}`)}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Upload Revision
                      </Button>
                    )}
                    {submission.status === "accepted" && submission.presentation_fee > 0 && submission.payment_status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => toggleSection(`pay-${confId}`)}>
                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Fee
                      </Button>
                    )}
                    {submission.status === "accepted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/dashboard/participant/payments")}
                      >
                        <ArrowRight className="h-3.5 w-3.5 mr-1" /> View Payment Details
                      </Button>
                    )}
                    {submission.status === "accepted" && submission.payment_status === "paid" && pptTemplateUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(pptTemplateUrl)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Presentation Template
                      </Button>
                    )}
                  </div>

                  {/* ── PPT Template Payment Hint ── */}
                  {submission.status === "accepted" && submission.payment_status !== "paid" && pptTemplateUrl && (
                    <p className="text-xs text-muted-foreground">
                      Complete payment to access the official presentation template.
                    </p>
                  )}

                  {/* ── Plagiarism Status ── */}
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Plagiarism Check:</span>
                    <PlagiarismBadge status={submission.plagiarism_status} />
                  </div>

                  {/* ── Email Notification ── */}
                  {submission.decision_email_sent && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                      <Mail className="h-4 w-4" />
                      Decision email has been sent.
                    </div>
                  )}

                  {/* ── Review & Decision Details ── */}
                  {(submission.review_comment || submission.decision_at) && (
                    <CollapsibleSection
                      title="Review & Decision"
                      defaultOpen={true}
                      id={`review-${confId}`}
                      expanded={expandedSections}
                      toggle={toggleSection}
                    >
                      {submission.review_comment && (
                        <div className="bg-white border rounded p-3 mb-3">
                          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Reviewer Comments</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.review_comment}</p>
                        </div>
                      )}
                      <div className="flex gap-6 text-sm text-gray-600">
                        {submission.reviewed_at && (
                          <span>Reviewed: {new Date(submission.reviewed_at).toLocaleDateString()}</span>
                        )}
                        {submission.decision_at && (
                          <span>Decision: {new Date(submission.decision_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* ── Authors ── */}
                  {authors[submission.id]?.length > 0 && (
                    <CollapsibleSection
                      title="Authors"
                      icon={<Users className="h-4 w-4" />}
                      id={`auth-${confId}`}
                      expanded={expandedSections}
                      toggle={toggleSection}
                    >
                      <div className="space-y-2">
                        {authors[submission.id].map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{a.name}</span>
                            {a.is_primary && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                            )}
                            {a.affiliation && (
                              <span className="text-gray-400">— {a.affiliation}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Corresponding Author */}
                      {submission.email && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          <span className="text-gray-400">Corresponding Author:</span>{" "}
                          <span className="text-gray-700">{submission.email}</span>
                          {submission.contact_number && (
                            <span className="text-gray-400 ml-3">| {submission.contact_number}</span>
                          )}
                        </div>
                      )}
                    </CollapsibleSection>
                  )}

                  {/* ── Presentation & Publication Details ── */}
                  {(submission.presentation_type || submission.publication_type || submission.presentation_fee > 0) && (
                    <CollapsibleSection
                      title="Presentation & Payment"
                      icon={<CreditCard className="h-4 w-4" />}
                      id={`pres-${confId}`}
                      expanded={expandedSections}
                      toggle={toggleSection}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {submission.presentation_type && (
                          <InfoItem label="Presentation" value={submission.presentation_type} />
                        )}
                        {submission.publication_type && (
                          <InfoItem label="Publication" value={submission.publication_type} />
                        )}
                        {submission.presentation_fee > 0 && (
                          <InfoItem label="Fee" value={`₹${Number(submission.presentation_fee).toLocaleString("en-IN")}`} />
                        )}
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Payment</p>
                          <PaymentBadge status={submission.payment_status} />
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* ── Revision Upload (only when revision_required) ── */}
                  {(submission.status === "revision_required" || expandedSections[`rev-${confId}`]) &&
                    submission.status === "revision_required" && (
                      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <p className="font-semibold text-sm text-orange-700">
                            Revision Required — please upload your updated paper
                          </p>
                        </div>

                        <Input
                          type="file"
                          accept=".pdf"
                          disabled={revisionUploading === confId}
                          onChange={e =>
                            setRevisionFiles(p => ({ ...p, [confId]: e.target.files?.[0] || null }))
                          }
                        />

                        <Button
                          disabled={!revisionFiles[confId] || revisionUploading === confId}
                          onClick={() => uploadRevision(confId, submission)}
                        >
                          {revisionUploading === confId ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading…</>
                          ) : (
                            <><Upload className="h-4 w-4 mr-1" /> Upload Revised Paper</>
                          )}
                        </Button>
                      </div>
                    )}

                  {/* ── Acceptance Congratulations Banner ── */}
                  {submission.status === "accepted" && (
                    <div className="border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 flex-shrink-0">
                          <PartyPopper className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-green-800 text-base">🎉 Your paper has been accepted!</h3>
                          <p className="text-sm text-green-700 mt-1">
                            {submission.payment_status === "paid"
                              ? "Payment completed. You are confirmed for the conference."
                              : "Complete payment to confirm your presentation & publication slot."}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">Payment Status:</span>
                            {submission.payment_status === "paid" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle2 className="h-3 w-3" /> Payment Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                <Clock className="h-3 w-3" /> Payment Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Payment Section (only when accepted + unpaid + fee > 0) ── */}
                  {submission.status === "accepted" &&
                    submission.presentation_fee > 0 &&
                    submission.payment_status !== "paid" && (
                      <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                            <span className="font-semibold text-indigo-700">Presentation / Publication Fee</span>
                          </div>
                          <span className="text-xl font-bold text-indigo-800">
                            ₹{Number(submission.presentation_fee).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Reminder notice */}
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span>Payment is required to include your paper in the conference schedule and proceedings.</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={paying === confId}
                            onClick={() => handlePayment(confId, submission)}
                          >
                            {paying === confId ? (
                              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing…</>
                            ) : (
                              <><CreditCard className="h-4 w-4 mr-1" /> Pay Now</>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push("/dashboard/participant/payments")}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" /> Proceed to Payment Page
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* ── Payment Completed Success State ── */}
                  {submission.status === "accepted" &&
                    submission.payment_status === "paid" && (
                      <div className="border border-green-200 bg-green-50 rounded-xl p-5 space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">✔ Payment Completed</p>
                            <p className="text-sm text-green-700">Your presentation slot is confirmed. Ready for the conference!</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-green-600 pt-1 border-t border-green-200">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Presentation & publication registration is complete.</span>
                        </div>
                      </div>
                    )}

                  {/* ── Camera Ready Upload (only after payment) ── */}
                  {submission.status === "accepted" &&
                    submission.payment_status === "paid" &&
                    !submission.camera_ready_url && (
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-blue-600" />
                          <p className="font-semibold text-sm text-blue-700">
                            Upload your final camera-ready paper
                          </p>
                        </div>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={e =>
                            setCameraReadyFiles(p => ({ ...p, [confId]: e.target.files?.[0] || null }))
                          }
                        />
                        <Button onClick={() => uploadCameraReady(confId, submission.id)}>
                          <Upload className="h-4 w-4 mr-1" /> Upload Camera Ready
                        </Button>
                      </div>
                    )}

                  {/* ── Final Submitted Confirmation ── */}
                  {submission.status === "final_submitted" && (
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-700" />
                        <h3 className="font-semibold text-green-800">Registration Complete</h3>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Your final paper has been submitted. Thank you for your contribution!
                      </p>
                    </div>
                  )}

                  {/* ── Certificate & Acceptance ── */}
                  {submission.certificate_generated && (
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-amber-700" />
                        <h3 className="font-semibold text-sm text-amber-800">Downloads Available</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3.5 w-3.5 mr-1" /> Download Certificate
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3.5 w-3.5 mr-1" /> Acceptance Letter
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════ SUB-COMPONENTS ═══════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
    under_review: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
    resubmitted: { label: "Resubmitted", cls: "bg-purple-100 text-purple-700" },
    revision_required: { label: "Revision Required", cls: "bg-orange-100 text-orange-700" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    final_submitted: { label: "Final Submitted", cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] || { label: status || "Pending", cls: "bg-yellow-100 text-yellow-700" };
  return <Badge className={s.cls}>{s.label}</Badge>;
}

function PlagiarismBadge({ status }: { status?: string }) {
  if (status === "passed") return <Badge className="bg-green-100 text-green-700">Passed</Badge>;
  if (status === "flagged") return <Badge className="bg-red-100 text-red-700">Flagged</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}

function PaymentBadge({ status }: { status?: string }) {
  if (status === "paid") return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}

function TimelineStep({ label, done, date, variant }: {
  label: string;
  done: boolean;
  date?: string;
  variant?: "green" | "red";
}) {
  const base = done
    ? variant === "red"
      ? "bg-red-100 text-red-700 border-red-200"
      : variant === "green"
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-blue-100 text-blue-700 border-blue-200"
    : "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${base}`}>
      {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      <span>{label}</span>
      {done && date && (
        <span className="text-[10px] opacity-70">
          {new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  id,
  expanded,
  toggle,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id: string;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  const isOpen = expanded[id] ?? defaultOpen;
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => toggle(id)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}