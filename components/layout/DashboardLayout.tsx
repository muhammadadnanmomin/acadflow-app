"use client";

import Link from "next/link";
import { useProfile } from "@/lib/auth/useProfile";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = useProfile();

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">

        {/* Logo */}
        <div className="p-5 text-xl font-bold text-indigo-600">
          AcadFlow
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2 text-sm">

          <NavLink href="/dashboard">
            Dashboard
          </NavLink>

          {profile?.role === "organizer" && (
            <NavLink href="/dashboard/organizer/conferences">
              My Conferences
            </NavLink>
          )}

          {profile?.role === "participant" && (
            <NavLink href="/dashboard/participant/submissions">
              My Submissions
            </NavLink>
          )}

          {profile?.role === "reviewer" && (
            <NavLink href="/dashboard/reviewer/reviews">
              Reviews
            </NavLink>
          )}

        </nav>

        {/* Footer */}
        <div className="p-4 border-t text-sm text-gray-500">
          {profile?.email}
        </div>

      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>

    </div>
  );
}

/* Helper Component */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        block px-3 py-2 rounded-md
        hover:bg-indigo-50
        hover:text-indigo-600
        transition
      "
    >
      {children}
    </Link>
  );
}
