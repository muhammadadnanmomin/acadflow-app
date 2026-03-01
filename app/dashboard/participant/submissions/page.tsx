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
} from "lucide-react";

export default function ParticipantSubmissionsPage() {
  const { profile } = useProfile();
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const [affiliations, setAffiliations] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [declarations, setDeclarations] = useState<Record<string, any>>({});
  const [coAuthors, setCoAuthors] = useState<Record<string, any[]>>({});

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    const { data: regs } = await supabase
      .from("conference_registrations")
      .select(`
        id,
        conference_id,
        conferences ( title )
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
        name: profile.full_name || "Primary Author",
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

    toast({ title: "Paper submitted successfully ✅" });

    setUploading(null);
    loadData();
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <p className="text-gray-500 mt-1">
          Upload and track your paper submissions
        </p>
      </div>

      {!loading && registrations.map(reg => {
        const submission = submissions[reg.conference_id];

        return (
          <Card key={reg.id} className="p-5 space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">
                  {reg.conferences?.title}
                </span>
              </div>
              {submission && <StatusBadge status={submission.status} />}
            </div>

            {!submission && (
              <div className="space-y-4">

                <div>
                  <label className="text-sm font-medium">Paper Title *</label>
                  <Input
                    placeholder="Enter full paper title"
                    onChange={e => setTitles(p => ({ ...p, [reg.conference_id]: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Primary Author Affiliation</label>
                  <Input
                    placeholder="e.g. ABC College of Engineering"
                    onChange={e => setAffiliations(p => ({ ...p, [reg.conference_id]: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Primary Author Email *</label>
                  <Input
                    type="email"
                    placeholder="author@email.com"
                    onChange={e => setEmails(p => ({ ...p, [reg.conference_id]: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Contact Number</label>
                  <Input
                    placeholder="+91 9876543210"
                    onChange={e => setContacts(p => ({ ...p, [reg.conference_id]: e.target.value }))}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-base mt-2">Co-Authors (Optional)</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Add co-authors in the order they should appear in the publication.
                  </p>

                  {(coAuthors[reg.conference_id] || []).map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input placeholder="Author Name"
                        onChange={e => updateAuthor(reg.conference_id, i, "name", e.target.value)} />
                      <Input placeholder="Email Address"
                        onChange={e => updateAuthor(reg.conference_id, i, "email", e.target.value)} />
                      <Input placeholder="Affiliation"
                        onChange={e => updateAuthor(reg.conference_id, i, "affiliation", e.target.value)} />
                      <Button size="sm" onClick={() => removeAuthor(reg.conference_id, i)}>✕</Button>
                    </div>
                  ))}

                  <Button size="sm" onClick={() => addAuthor(reg.conference_id)}>
                    + Add Co-Author
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Upload Paper (PDF only) *
                  </label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      setFiles(prev => ({
                        ...prev,
                        [reg.conference_id]: e.target.files?.[0] || null
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
                    ["original","This paper is original work"],
                    ["notSubmitted","This paper is not submitted elsewhere"],
                    ["noPlagiarism","This paper contains no plagiarism"],
                    ["approved","All authors have approved this submission"]
                  ].map(([key,label]) => (
                    <label key={key} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        onChange={e => setDeclarations(p => ({
                          ...p,
                          [reg.conference_id]: {
                            ...p[reg.conference_id],
                            [key]: e.target.checked
                          }
                        }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <Button
                  disabled={uploading === reg.conference_id}
                  onClick={() => uploadPaper(reg.conference_id)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Submit Paper for Review
                </Button>

              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
  if (status === "submitted")
    return <Badge className="bg-blue-100 text-blue-700">Under Review</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}