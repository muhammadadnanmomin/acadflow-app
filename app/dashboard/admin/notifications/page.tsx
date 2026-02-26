"use client";

import { useEffect, useState } from "react";

import RoleGuard from "@/lib/auth/RoleGuard";
import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Bell, Send } from "lucide-react";

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");

  /* Load notifications */
  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  /* Create notification */
  async function sendNotification() {
    if (!title || !message) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        target_role: target,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Notification sent!");

      setTitle("");
      setMessage("");

      loadNotifications();
    }
  }

  return (
    <RoleGuard allowed={["admin"]}>

      <div className="space-y-8 max-w-5xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            System Notifications
          </h1>

          <p className="text-gray-500 mt-1">
            Send announcements to users
          </p>
        </div>

        {/* Create Notification */}
        <Card className="p-6 space-y-5">

          <div className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="h-5 w-5" />
            New Notification
          </div>

          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Target */}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Users</option>
            <option value="organizer">Organizers</option>
            <option value="reviewer">Reviewers</option>
            <option value="participant">Participants</option>
          </select>

          <div className="flex justify-end">
            <Button
              onClick={sendNotification}
              disabled={loading}
            >
              <Send className="h-4 w-4 mr-1" />
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

        </Card>

        {/* Notification History */}
        <Card className="p-4">

          <h2 className="text-lg font-semibold mb-4">
            Sent Notifications
          </h2>

          {notifications.length === 0 && (
            <p className="text-sm text-gray-500 p-2">
              No notifications yet.
            </p>
          )}

          <div className="space-y-3">

            {notifications.map((n) => (

              <div
                key={n.id}
                className="border rounded-lg p-4 space-y-2"
              >

                <div className="flex items-center justify-between">

                  <h3 className="font-semibold">
                    {n.title}
                  </h3>

                  <Badge>
                    {n.target_role}
                  </Badge>

                </div>

                <p className="text-sm text-gray-600">
                  {n.message}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>

              </div>

            ))}

          </div>

        </Card>

      </div>

    </RoleGuard>
  );
}
