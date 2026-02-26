"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const supabase = createClient();

export default function ParticipantNotificationsPage() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  async function loadData() {
    if (!profile) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  }

  /* mark single read */
  async function markRead(id: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
    );
  }

  async function markAllRead() {
    if (!profile) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id);

    loadData();
  }

  /* realtime subscription */
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile?.id}`,
        },
        (payload) => {
          setNotifications((prev) => [
            payload.new,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            Stay updated with your activities
          </p>
        </div>

        <div className="flex gap-3">
          {unreadCount > 0 && (
            <Badge>{unreadCount} unread</Badge>
          )}
          <Button size="sm" variant="outline" onClick={markAllRead}>
            Mark all as read
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {!loading && notifications.length === 0 && (
          <p className="text-sm text-gray-500">
            No notifications yet.
          </p>
        )}

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`cursor-pointer flex gap-4 rounded-lg border p-4 transition ${
                n.is_read ? "bg-white" : "bg-muted/40"
              }`}
            >
              <NotificationIcon type={n.type} />

              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{n.title}</h3>
                  {!n.is_read && <Badge>New</Badge>}
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
      </Card>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "success") {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  }
  if (type === "warning") {
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  }
  return <Info className="h-5 w-5 text-blue-600" />;
}