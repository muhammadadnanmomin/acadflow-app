"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrganization } from "@/lib/organizations/useOrganization";

import { cn } from "@/lib/utils";
import {
  Home,
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  CreditCard,
  Award,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LogOut,
  BarChart3,
  Shield,
  X,
  PlusCircle,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface SidebarProps {
  collapsed: boolean;
  role: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggle: () => void;
}

/* ---------------- NAV CONFIG ---------------- */

const adminNav = [
  { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Conferences", href: "/dashboard/admin/conferences", icon: Calendar },
  { name: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { name: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
  { name: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { name: "Security", href: "/dashboard/admin/security", icon: Shield },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const organizerNav = [
  { name: "Overview", href: "/dashboard/overview", icon: Home },
  { name: "Dashboard", href: "/dashboard/organizer", icon: LayoutDashboard },
  { name: "Create Conference", href: "/dashboard/organizer/conferences/new", icon: PlusCircle },
  { name: "Conferences", href: "/dashboard/organizer/conferences", icon: Calendar },
  { name: "Submissions", href: "/dashboard/organizer/submissions", icon: FileText },
  { name: "Reviewers", href: "/dashboard/organizer/reviewers", icon: Users },
  { name: "Payments", href: "/dashboard/organizer/payments", icon: CreditCard },
  { name: "Certificates", href: "/dashboard/organizer/certificates", icon: Award },
  { name: "Notifications", href: "/dashboard/organizer/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const reviewerNav = [
  { name: "Overview", href: "/dashboard/overview", icon: Home },
  { name: "Dashboard", href: "/dashboard/reviewer", icon: LayoutDashboard },
  { name: "Assigned Papers", href: "/dashboard/reviewer/papers", icon: FileText },
  { name: "Reviews", href: "/dashboard/reviewer/reviews", icon: Users },
  { name: "Notifications", href: "/dashboard/reviewer/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const participantNav = [
  { name: "Overview", href: "/dashboard/overview", icon: Home },
  { name: "Dashboard", href: "/dashboard/participant", icon: LayoutDashboard },
  { name: "My Submissions", href: "/dashboard/participant/submissions", icon: FileText },
  { name: "Conferences", href: "/dashboard/participant/conferences", icon: Calendar },
  { name: "Payments", href: "/dashboard/participant/payments", icon: CreditCard },
  { name: "Certificates", href: "/dashboard/participant/certificates", icon: Award },
  { name: "Notifications", href: "/dashboard/participant/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

/* ---------------- COMPONENT ---------------- */

export function DashboardSidebar({
  collapsed,
  role,
  mobileOpen,
  onMobileClose,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const organization = useOrganization();

  const [activeRole, setActiveRole] = useState(role);

  /* Sync with localStorage */
  useEffect(() => {
    const stored = localStorage.getItem("activeRole");

    // detect role from URL
    if (pathname.includes("/organizer")) {
      setActiveRole("organizer");
      localStorage.setItem("activeRole", "organizer");
      return;
    }

    if (pathname.includes("/reviewer")) {
      setActiveRole("reviewer");
      localStorage.setItem("activeRole", "reviewer");
      return;
    }

    if (pathname.includes("/admin")) {
      setActiveRole("admin");
      localStorage.setItem("activeRole", "admin");
      return;
    }

    if (stored) {
      setActiveRole(stored);
    } else {
      setActiveRole(role);
    }
  }, [pathname, role]);

  let navItems =
    activeRole === "admin"
      ? adminNav
      : activeRole === "organizer"
        ? organizerNav
        : activeRole === "reviewer"
          ? reviewerNav
          : participantNav;

  // ⭐ add create organization for participants without org
  if (activeRole === "participant" && !organization) {
    navItems = [
      ...navItems,
      {
        name: "Create Organization",
        href: "/onboarding/organization",
        icon: PlusCircle,
      },
    ];
  }

  async function handleLogout() {
    localStorage.removeItem("activeRole");
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 flex h-screen flex-col bg-white border-r transition-all duration-300",
        collapsed ? "md:w-16" : "md:w-64",
        mobileOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>

        {!collapsed && (
          <Link href="/dashboard/overview" className="text-lg font-semibold">
            AcadFlow
          </Link>
        )}

        <button onClick={onMobileClose} className="ml-auto md:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Organization Workspace */}

      {activeRole === "participant" && organization && (
        <div className="px-3 pt-4 pb-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">
              Organization
            </p>
          )}

          <Link
            href="/dashboard/organizer"
            onClick={() => localStorage.setItem("activeRole", "organizer")}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-gray-100",
              collapsed && "justify-center"
            )}
          >
            {/* Org Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 font-semibold">
              {organization.name.charAt(0)}
            </div>

            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-medium truncate">
                  {organization.name}
                </span>
                <span className="text-xs text-gray-500">
                  Organizer workspace
                </span>
              </div>
            )}
          </Link>
        </div>
      )}
      <div className="mx-3 my-3 border-t border-gray-200" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-indigo-50 text-indigo-600"
                    : item.name === "Create Organization"
                      ? "text-indigo-600 bg-indigo-50 font-semibold"
                      : "text-gray-600 hover:bg-gray-100",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t p-2 space-y-2">

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hidden md:flex w-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>

      </div>
    </aside>
  );
}
