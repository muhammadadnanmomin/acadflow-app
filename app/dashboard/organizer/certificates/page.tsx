"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Award, Download, FileText } from "lucide-react";

export default function OrganizerCertificates() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);

  const supabase = createClient();

  /* Load accepted papers */
  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        title,
        payment_status,
        user_id,
        conferences!inner (
          id,
          title,
          organizer_id
        ),
        certificate_url:file_url
      `)
      .eq("conferences.organizer_id", profile.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    console.log(data);

    if (error) {
      console.error("Supabase error:", JSON.stringify(error, null, 2));
      setLoading(false);
      return;
    }

    setPapers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  /* Generate certificate */
  async function generateCertificate(p: any) {
    if (p.payment_status !== "paid") return;

    const authorName = "Participant";
    const conferenceTitle = p.conferences?.title || "Conference";

    try {
      const res = await fetch("/api/generate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: p.id,
          authorName,
          conferenceTitle,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Error:", text);
        alert("Certificate generation failed");
        return;
      }

      const data = await res.json();

      if (!data.url) {
        alert("Certificate generation failed");
        return;
      }

      await supabase.from("certificates").insert({
        paper_id: p.id,
        user_id: p.user_id,
        conference_id: p.conferences?.id,
        file_url: data.url,
      });

      loadPapers();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="text-gray-500 mt-1">
          Generate and manage certificates
        </p>
      </div>

      {/* Main */}
      <Card className="p-6">
        {loading && (
          <p className="text-sm text-gray-500">
            Loading certificates...
          </p>
        )}

        {!loading && papers.length === 0 && (
          <p className="text-sm text-gray-500">
            No accepted papers yet.
          </p>
        )}

        {!loading && papers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="py-3 px-2">Paper</th>
                  <th className="py-3 px-2">Author</th>
                  <th className="py-3 px-2">Conference</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {papers.map((p) => {
                  // ✅ FIX: detect certificate from returned URL
                  const cert = p.certificate_url || null;

                  let statusBadge;

                  if (cert) {
                    statusBadge = (
                      <Badge className="bg-green-100 text-green-700">
                        Issued
                      </Badge>
                    );
                  } else if (p.payment_status !== "paid") {
                    statusBadge = (
                      <Badge className="bg-red-100 text-red-700">
                        Awaiting Payment
                      </Badge>
                    );
                  } else {
                    statusBadge = (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        Ready
                      </Badge>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      {/* Paper */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {p.title}
                          </span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-2 text-sm">
                        <p>{p.user_id}</p>
                        <p className="text-gray-500">Participant</p>
                      </td>

                      {/* Conference */}
                      <td className="py-3 px-2 text-sm">
                        {p.conferences?.title}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">{statusBadge}</td>

                      {/* Action */}
                      <td className="py-3 px-2 text-right">
                        {cert ? (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={cert}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        ) : p.payment_status !== "paid" ? (
                          <Button size="sm" disabled variant="outline">
                            Payment Pending
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => generateCertificate(p)}
                          >
                            <Award className="h-4 w-4 mr-1" />
                            Generate
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}