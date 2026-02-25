"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Cossette_Texte } from "next/font/google";

export default function ReviewerNotificationsPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const supabase = createClient()

  /* Load notifications */
  async function loadNotifications() {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  /* Mark all read */
  async function markAllRead() {
    if (!profile) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id);

    loadNotifications();
  }

  useEffect(() => {
    loadNotifications();
  }, [profile]);

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Notifications
          </h1>

          <p className="text-gray-500 mt-1">
            Review updates and alerts
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={markAllRead}
        >
          Mark all as read
        </Button>

      </div>

      {/* Main */}
      <Card className="p-6">

        {loading && (
          <p className="text-sm text-gray-500">
            Loading notifications...
          </p>
        )}

        {!loading && notifications.length === 0 && (
          <p className="text-sm text-gray-500">
            No notifications yet.
          </p>
        )}

        {!loading && notifications.length > 0 && (

          <div className="space-y-3">

            {notifications.map((n) => (

              <div
                key={n.id}
                className={`flex gap-4 rounded-lg border p-4 transition ${
                  n.is_read
                    ? "bg-white"
                    : "bg-muted/40"
                }`}
              >

                {/* Icon */}
                <div className="mt-1">
                  <NotificationIcon type={n.type} />
                </div>

                {/* Content */}
                <div className="flex-1">

                  <div className="flex items-center justify-between">

                    <h3 className="font-medium">
                      {n.title}
                    </h3>

                    {!n.is_read && (
                      <Badge>
                        New
                      </Badge>
                    )}

                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    {n.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </Card>

    </div>
  );
}

/* Icon Selector */
function NotificationIcon({ type }: { type: string }) {

  if (type === "success") {
    return (
      <CheckCircle className="h-5 w-5 text-green-600" />
    );
  }

  if (type === "warning") {
    return (
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
    );
  }

  return (
    <Info className="h-5 w-5 text-blue-600" />
  );
}
