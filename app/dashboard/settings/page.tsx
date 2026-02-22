"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  User,
  Bell,
  Shield,
  CreditCard,
  LogOut,
} from "lucide-react";

const supabase = createClient();

export default function SettingsPage() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [emailNotif, setEmailNotif] = useState(true);

  useEffect(() => {
    if (!profile) return;

    setName(profile.name || "");
    setEmail(profile.email || "");
  }, [profile]);

  async function saveProfile() {
    if (!profile) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Account updated");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8 max-w-4xl">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          Account Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your account details and preferences.
        </p>
      </div>

      {/* ACCOUNT INFO */}
      <Card className="p-6 space-y-6">

        <SectionHeader
          icon={<User className="h-5 w-5" />}
          title="Account Information"
          description="Update your personal account details."
        />

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
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Email Address
              </label>
              <Input value={email} disabled />
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed.
              </p>
            </div>

          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

      </Card>

      {/* NOTIFICATIONS */}
      <Card className="p-6 space-y-6">

        <SectionHeader
          icon={<Bell className="h-5 w-5" />}
          title="Notifications"
          description="Control how you receive important updates."
        />

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Email Notifications
            </p>
            <p className="text-sm text-gray-500">
              Receive conference updates and alerts.
            </p>
          </div>

          <Switch
            checked={emailNotif}
            onCheckedChange={setEmailNotif}
          />
        </div>

      </Card>

      {/* BILLING (Organizer only) */}
      {profile?.role === "organizer" && (
        <Card className="p-6 space-y-6">

          <SectionHeader
            icon={<CreditCard className="h-5 w-5" />}
            title="Billing & Payouts"
            description="Manage payments and organizer payouts."
          />

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Payment Account
              </p>
              <p className="text-sm text-gray-500">
                Connect Razorpay to receive payouts.
              </p>
            </div>

            <Button variant="outline">
              Configure
            </Button>
          </div>

        </Card>
      )}

      {/* SECURITY */}
      <Card className="p-6 space-y-6">

        <SectionHeader
          icon={<Shield className="h-5 w-5" />}
          title="Security"
          description="Protect your account and manage sessions."
        />

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Sign out of this device
            </p>
            <p className="text-sm text-gray-500">
              You will need to login again.
            </p>
          </div>

          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>

      </Card>

    </div>
  );
}

/* SECTION HEADER */
function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="text-gray-500">
          {icon}
        </div>
        <h2 className="text-xl font-semibold">
          {title}
        </h2>
      </div>

      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
