"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Award,
  Download,
  Calendar,
} from "lucide-react";

const supabase = createClient();

export default function ParticipantCertificatesPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);

  /* Load certificates */
  async function loadData() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("certificates")
      .select(`
        id,
        file_url,
        issued_at,
        conferences (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq("user_id", profile.id)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCertificates(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [profile]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Certificates
        </h1>

        <p className="text-gray-500 mt-1">
          Download your participation certificates
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-gray-500">
          Loading certificates...
        </p>
      )}

      {/* Empty */}
      {!loading && certificates.length === 0 && (
        <p className="text-sm text-gray-500">
          No certificates available yet.
        </p>
      )}

      {/* List */}
      {!loading && certificates.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((c) => {
            const conf = c.conferences;

            return (
              <Card key={c.id} className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">
                      {conf?.title}
                    </span>
                  </div>

                  <Badge className="bg-green-100 text-green-700">
                    Available
                  </Badge>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {conf?.start_date} → {conf?.end_date}
                </div>

                {/* Date */}
                <div className="text-sm text-gray-500">
                  Issued on:{" "}
                  {new Date(c.issued_at).toLocaleDateString()}
                </div>

                {/* Action */}
                <div className="pt-2">
                  {c.file_url ? (
                    <Button size="sm" asChild>
                      <a
                        href={c.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Not Available Yet
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}