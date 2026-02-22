"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

import { useProfile } from "@/lib/auth/useProfile";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { profile, loading } = useProfile();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* Determine role from URL only for UI */
  const dashboardRole =
    pathname.startsWith("/dashboard/admin")
      ? "admin"
      : pathname.startsWith("/dashboard/reviewer")
      ? "reviewer"
      : pathname.startsWith("/dashboard/organizer")
      ? "organizer"
      : "participant";

  /* 🔐 Only authentication guard here */
  useEffect(() => {
    if (!loading && !profile) {
      router.replace("/login");
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={dashboardRole}
      />

      {/* Main */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-0 md:ml-16" : "ml-0 md:ml-64"
        )}
      >
        <DashboardHeader
          userName={profile.name || "User"}
          userEmail={profile.email}
          userRole={dashboardRole}
          userAvatar={profile.avatar_url}
        />

        <main className="flex-1 p-6">{children}</main>

        <Toaster />
      </div>
    </div>
  );
}
