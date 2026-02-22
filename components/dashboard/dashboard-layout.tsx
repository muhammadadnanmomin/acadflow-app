"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";

import { useProfile } from "@/lib/auth/useProfile";
import { cn } from "@/lib/utils";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, loading } = useProfile();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [activeRole, setActiveRole] = useState<string | null>(null);

  /* Sync active role */
  useEffect(() => {
    if (!profile) return;

    const stored = localStorage.getItem("activeRole");
    if (stored) {
      setActiveRole(stored);
    } else {
      setActiveRole(profile.role);
    }
  }, [profile]);

  /* Loading */
  if (loading || !activeRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  /* Not logged in */
  if (!profile) {
    router.push("/login");
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={activeRole}   // ✅ use activeRole
      />

      {/* Main Layout */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        {/* Header */}
        <DashboardHeader
          userName={profile.name || "User"}
          userEmail={profile.email}
          userRole={activeRole}   // ✅ use activeRole
          userAvatar={profile.avatar_url}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
