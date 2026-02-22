"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Award,
  Download,
  FileText,
} from "lucide-react";

export default function OrganizerCertificates() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<any[]>([]);

  /* Load accepted papers */
  async function loadPapers() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("paper_submissions")
      .select(`
        id,
        title,
        certificate_url,
        status,
        profiles ( name, email ),
        conferences ( title )
      `)
      .eq("organizer_id", profile.id)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPapers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPapers();
  }, [profile]);

  /* Generate certificate (placeholder) */
  async function generateCertificate(id: string) {

    // Temporary fake URL (later we generate PDF)
    const fakeUrl = `/certificates/${id}.pdf`;

    await supabase
      .from("paper_submissions")
      .update({
        certificate_url: fakeUrl,
      })
      .eq("id", id);

    loadPapers();
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Certificates
        </h1>

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

                {papers.map((p) => (

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

                      <div>
                        <p>{p.profiles?.name}</p>
                        <p className="text-gray-500">
                          {p.profiles?.email}
                        </p>
                      </div>

                    </td>

                    {/* Conference */}
                    <td className="py-3 px-2 text-sm">
                      {p.conferences?.title}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">

                      {p.certificate_url ? (
                        <Badge className="bg-green-100 text-green-700">
                          Issued
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          Pending
                        </Badge>
                      )}

                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-right">

                      {p.certificate_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={p.certificate_url}
                            target="_blank"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            generateCertificate(p.id)
                          }
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Generate
                        </Button>
                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </Card>

    </div>
  );
}
