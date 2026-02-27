"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  User,
  Bell,
  Shield,
  Trash2,
} from "lucide-react";

export default function OrganizerSettings() {
  const { profile } = useProfile();

  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  /* Profile */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  /* Preferences */
  const [emailNotif, setEmailNotif] = useState(true);

  /* Load */
  useEffect(() => {
    if (!profile) return;

    setName(profile.name || "");
    setEmail(profile.email || "");
  }, [profile]);

  /* Save profile */
  async function saveProfile() {
    if (!profile) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
      })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Profile updated");
    }
  }

  /* Logout */
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Settings
        </h1>

        <p className="text-gray-500 mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Profile */}
      <Card className="p-6 space-y-6">

        <div className="flex items-center gap-3">

          <User className="h-5 w-5 text-gray-500" />

          <h2 className="text-xl font-semibold">
            Profile Information
          </h2>

        </div>

        <Separator />

        <div className="flex items-center gap-6">

          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>
              {name?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">

            <div>
              <label className="text-sm font-medium">
                Name
              </label>

              <Input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Email
              </label>

              <Input
                value={email}
                disabled
              />
            </div>

          </div>

        </div>

        <div className="flex justify-end">

          <Button
            onClick={saveProfile}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>

        </div>

      </Card>

      {/* Preferences */}
      <Card className="p-6 space-y-6">

        <div className="flex items-center gap-3">

          <Bell className="h-5 w-5 text-gray-500" />

          <h2 className="text-xl font-semibold">
            Preferences
          </h2>

        </div>

        <Separator />

        <div className="flex items-center justify-between">

          <div>
            <p className="font-medium">
              Email Notifications
            </p>

            <p className="text-sm text-gray-500">
              Receive updates via email
            </p>
          </div>

          <Switch
            checked={emailNotif}
            onCheckedChange={setEmailNotif}
          />

        </div>

      </Card>

      {/* Security */}
      <Card className="p-6 space-y-6">

        <div className="flex items-center gap-3">

          <Shield className="h-5 w-5 text-gray-500" />

          <h2 className="text-xl font-semibold">
            Account
          </h2>

        </div>

        <Separator />

        <div className="flex items-center justify-between">

          <div>
            <p className="font-medium">
              Logout
            </p>

            <p className="text-sm text-gray-500">
              Sign out from your account
            </p>
          </div>

          <Button
            variant="outline"
            onClick={logout}
          >
            Logout
          </Button>

        </div>

      </Card>

      {/* Danger Zone */}
      <Card className="p-6 space-y-6 border-red-200">

        <div className="flex items-center gap-3 text-red-600">

          <Trash2 className="h-5 w-5" />

          <h2 className="text-xl font-semibold">
            Danger Zone
          </h2>

        </div>

        <Separator />

        <div className="flex items-center justify-between">

          <div>
            <p className="font-medium text-red-600">
              Delete Account
            </p>

            <p className="text-sm text-gray-500">
              This action cannot be undone
            </p>
          </div>

          <Button
            variant="destructive"
            disabled
          >
            Delete Account
          </Button>

        </div>

      </Card>

    </div>
  );
}
