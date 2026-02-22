"use client";

import { useEffect, useState } from "react";

import RoleGuard from "@/lib/auth/RoleGuard";
import { supabase } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminConferencesPage() {
  const [loading, setLoading] = useState(true);
  const [conferences, setConferences] = useState<any[]>([]);

  /* Load conferences */
  async function loadConferences() {
    setLoading(true);

    const { data, error } = await supabase
      .from("conferences")
      .select(`
        id,
        title,
        start_date,
        end_date,
        is_published,
        created_at,
        organizer_id,
        profiles (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setConferences(data || []);
    setLoading(false);
  }

  /* Toggle publish */
  async function togglePublish(id: string, value: boolean) {
    await supabase
      .from("conferences")
      .update({ is_published: value })
      .eq("id", id);

    loadConferences();
  }

  useEffect(() => {
    loadConferences();
  }, []);

  return (
    <RoleGuard allowed={["admin"]}>

      <div className="space-y-8 max-w-7xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Conference Moderation
          </h1>

          <p className="text-gray-500 mt-1">
            Manage and review all conferences
          </p>
        </div>

        {/* Main */}
        <Card className="p-4 overflow-x-auto">

          {loading && (
            <p className="text-sm text-gray-500 p-4">
              Loading conferences...
            </p>
          )}

          {!loading && conferences.length === 0 && (
            <p className="text-sm text-gray-500 p-4">
              No conferences found.
            </p>
          )}

          {!loading && conferences.length > 0 && (

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b text-left text-gray-500">

                  <th className="py-3 px-2">
                    Title
                  </th>

                  <th className="py-3 px-2">
                    Organizer
                  </th>

                  <th className="py-3 px-2">
                    Dates
                  </th>

                  <th className="py-3 px-2">
                    Status
                  </th>

                  <th className="py-3 px-2 text-right">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {conferences.map((c) => (

                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >

                    {/* Title */}
                    <td className="py-3 px-2 font-medium">
                      {c.title}
                    </td>

                    {/* Organizer */}
                    <td className="py-3 px-2">

                      <div className="flex items-center gap-2">

                        <User className="h-4 w-4 text-gray-400" />

                        <div className="text-xs">

                          <p>
                            {c.profiles?.full_name || "—"}
                          </p>

                          <p className="text-gray-400">
                            {c.profiles?.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* Dates */}
                    <td className="py-3 px-2 text-xs text-gray-500">

                      <div className="flex items-center gap-1">

                        <Calendar className="h-3 w-3" />

                        {c.start_date} → {c.end_date}

                      </div>

                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">

                      {c.is_published ? (

                        <Badge className="bg-green-100 text-green-700">
                          Published
                        </Badge>

                      ) : (

                        <Badge className="bg-yellow-100 text-yellow-700">
                          Draft
                        </Badge>

                      )}

                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-right">

                      {c.is_published ? (

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            togglePublish(c.id, false)
                          }
                        >

                          <EyeOff className="h-4 w-4 mr-1" />
                          Unpublish

                        </Button>

                      ) : (

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            togglePublish(c.id, true)
                          }
                        >

                          <Eye className="h-4 w-4 mr-1" />
                          Publish

                        </Button>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </Card>

      </div>

    </RoleGuard>
  );
}
