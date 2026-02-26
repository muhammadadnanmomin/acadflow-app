"use client";

import { useEffect, useState } from "react";

import RoleGuard from "@/lib/auth/RoleGuard";
import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  Settings,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const [settings, setSettings] = useState<any>(null);

  /* Load settings */
  async function loadSettings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setSettings(data);
    setLoading(false);
  }

  /* Save settings */
  async function saveSettings() {
    if (!settings) return;

    setSaving(true);

    const { error } = await supabase
      .from("platform_settings")
      .update({
        platform_name: settings.platform_name,
        support_email: settings.support_email,
        registration_fee: settings.registration_fee,
        maintenance_mode: settings.maintenance_mode,
        allow_free_events: settings.allow_free_events,
        updated_at: new Date(),
      })
      .eq("id", settings.id);

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Settings saved!");
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <RoleGuard allowed={["admin"]}>

      <div className="space-y-8 max-w-4xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Platform Settings
          </h1>

          <p className="text-gray-500 mt-1">
            Configure system-wide options
          </p>
        </div>

        {/* General */}
        <Card className="p-6 space-y-6">

          <SectionTitle
            icon={<Settings />}
            title="General Settings"
          />

          <div className="grid gap-5">

            <div>
              <Label>Platform Name</Label>
              <Input
                value={settings.platform_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform_name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    support_email: e.target.value,
                  })
                }
              />
            </div>

          </div>

        </Card>

        {/* Payments */}
        <Card className="p-6 space-y-6">

          <SectionTitle
            icon={<ShieldCheck />}
            title="Payments & Fees"
          />

          <div className="grid gap-5">

            <div>
              <Label>Default Registration Fee (₹)</Label>

              <Input
                type="number"
                value={settings.registration_fee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    registration_fee: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">

              <div>
                <Label>Allow Free Events</Label>
                <p className="text-xs text-gray-500">
                  Organizers can create free conferences
                </p>
              </div>

              <Switch
                checked={settings.allow_free_events}
                onCheckedChange={(val) =>
                  setSettings({
                    ...settings,
                    allow_free_events: val,
                  })
                }
              />

            </div>

          </div>

        </Card>

        {/* System */}
        <Card className="p-6 space-y-6">

          <SectionTitle
            icon={<ShieldCheck />}
            title="System Controls"
          />

          <div className="flex items-center justify-between">

            <div>
              <Label>Maintenance Mode</Label>
              <p className="text-xs text-gray-500">
                Disable user access temporarily
              </p>
            </div>

            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(val) =>
                setSettings({
                  ...settings,
                  maintenance_mode: val,
                })
              }
            />

          </div>

        </Card>

        {/* Save */}
        <div className="flex justify-end">

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="px-6"
          >
            <Save className="h-4 w-4 mr-1" />

            {saving ? "Saving..." : "Save Changes"}
          </Button>

        </div>

      </div>

    </RoleGuard>
  );
}

/* Section Title */
function SectionTitle({
  icon,
  title,
}: any) {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold">
      {icon}
      {title}
    </div>
  );
}
