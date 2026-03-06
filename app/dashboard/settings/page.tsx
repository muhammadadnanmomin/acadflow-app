"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Mail,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  KeyRound,
  Moon,
  LayoutDashboard,
  CalendarClock,
  Settings,
} from "lucide-react";

export default function SettingsPage() {
  const { profile } = useProfile();
  const supabase = createClient();

  /* ── Account email (from auth, read-only) ── */
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  /* ── Notifications state ── */
  const [emailNotif, setEmailNotif] = useState(true);

  /* ── Preferences state (local) ── */
  const [darkMode, setDarkMode] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [reminderEmails, setReminderEmails] = useState(true);

  /* ── Actions ── */
  async function handleChangePassword() {
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for a link to reset your password.",
      });
    }
  }

  async function handleLogout() {
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
          Manage your account preferences and security.
        </p>
      </div>

      {/* ── ACCOUNT ── */}
      <Card className="p-6 space-y-6">

        <SectionHeader
          icon={<Mail className="h-5 w-5" />}
          title="Account"
          description="Your account email address."
        />

        <Separator />

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">
            Account Email
          </p>
          <p className="text-base font-medium">
            {email || "—"}
          </p>
          <p className="text-xs text-gray-400">
            Email is managed through authentication and cannot be changed.
          </p>
        </div>

      </Card>

      {/* ── NOTIFICATIONS ── */}
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

      {/* ── PREFERENCES ── */}
      <Card className="p-6 space-y-6">

        <SectionHeader
          icon={<Settings className="h-5 w-5" />}
          title="Preferences"
          description="Customize your dashboard experience."
        />

        <Separator />

        <div className="space-y-5">
          {/* <PreferenceRow
            icon={<Moon className="h-4 w-4" />}
            label="Dark Mode"
            description="Switch the interface to a dark color scheme."
            checked={darkMode}
            onChange={setDarkMode}
          /> */}

          {/* <PreferenceRow
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Compact Dashboard Layout"
            description="Use a denser layout with smaller cards."
            checked={compactLayout}
            onChange={setCompactLayout}
          /> */}

          <PreferenceRow
            icon={<CalendarClock className="h-4 w-4" />}
            label="Conference Reminder Emails"
            description="Get email reminders before upcoming conferences."
            checked={reminderEmails}
            onChange={setReminderEmails}
          />
        </div>

      </Card>

      {/* ── BILLING (Organizer only) ── */}
      {profile?.role === "organizer" && (
        <Card className="p-6 space-y-6">

          <SectionHeader
            icon={<CreditCard className="h-5 w-5" />}
            title="Billing & Organizer Payments"
            description="Connect your payout account to receive revenue from conference registrations."
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

      {/* ── SECURITY ── */}
      <Card className="p-6 space-y-6">

        <SectionHeader
          icon={<Shield className="h-5 w-5" />}
          title="Security"
          description="Protect your account and manage sessions."
        />

        <Separator />

        <div className="space-y-5">

          {/* Change Password */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Change Password
              </p>
              <p className="text-sm text-gray-500">
                Send a password reset link to your email.
              </p>
            </div>

            <Button variant="outline" onClick={handleChangePassword}>
              <KeyRound className="h-4 w-4 mr-1" />
              Reset Password
            </Button>
          </div>

          {/* Logout */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Sign out of this device
              </p>
              <p className="text-sm text-gray-500">
                You will need to login again.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to logout?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be signed out of your account and redirected to the login page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleLogout}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </div>

      </Card>

    </div>
  );
}

/* ── SECTION HEADER ── */
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

/* ── PREFERENCE ROW ── */
function PreferenceRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
