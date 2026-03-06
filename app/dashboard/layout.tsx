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
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Determine role from URL (UI context only) */
  let dashboardRole: "admin" | "organizer" | "reviewer" | "participant" =
    "participant";

  if (pathname.startsWith("/dashboard/admin")) {
    dashboardRole = "admin";
  } else if (pathname.startsWith("/dashboard/organizer")) {
    dashboardRole = "organizer";
  } else if (pathname.startsWith("/dashboard/reviewer")) {
    dashboardRole = "reviewer";
  }

  /* 🔐 Authentication guard */
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
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
          userEmail={profile.email ?? ""}
          userRole={dashboardRole}
          userAvatar={profile.avatar_url ?? undefined}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-6">{children}</main>

        <Toaster />
      </div>
    </div>
  );
}