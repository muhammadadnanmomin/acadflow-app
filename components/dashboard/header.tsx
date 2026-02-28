"use client";

import {
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  Repeat,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface HeaderProps {
  userName: string;
  userEmail: string;
  userRole: string; // role from route
  userAvatar?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({
  userName,
  userEmail,
  userRole,
  userAvatar,
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>(userRole);

  /* ✅ sync active role with route */
  useEffect(() => {
    setActiveRole(userRole);
    localStorage.setItem("activeRole", userRole);
  }, [userRole]);

  /* ✅ load roles user actually has */
  /* ✅ load roles user actually has */
  useEffect(() => {
    async function loadRoles() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const roles = new Set<string>();

      // everyone is participant
      roles.add("participant");

      // 🔹 get profile role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "organizer" || profile?.role === "admin") {
        roles.add("organizer");
      }

      if (profile?.role === "admin") {
        roles.add("admin");
      }

      // 🔹 reviewer role
      const { data: reviewerRegs } = await supabase
        .from("conference_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "reviewer")
        .limit(1);

      if (reviewerRegs?.length) {
        roles.add("reviewer");
      }

      // 🔹 organization membership roles
      const { data: orgMemberships } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id);

      if (orgMemberships?.length) {
        // member of any organization can organize
        roles.add("organizer");

        // check if any org role is admin
        const isOrgAdmin = orgMemberships.some(
          (org) => org.role === "admin"
        );

        if (isOrgAdmin) {
          roles.add("admin");
        }
      }

      setAvailableRoles(Array.from(roles));
    }

    loadRoles();
  }, []);

  /* ✅ switch dashboard role */
  function switchRole(role: string) {
    if (role === activeRole) return;

    localStorage.setItem("activeRole", role);
    router.push(`/dashboard/${role}`);
  }

  /* ✅ logout */
  async function handleLogout() {
    localStorage.removeItem("activeRole");
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => {
            onMenuClick?.();
          }}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-gray-800 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar || ""} />
                <AvatarFallback className="bg-indigo-600 text-white text-sm">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-indigo-600 font-medium capitalize">
                  {activeRole}
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info */}
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Role Switcher */}
            {availableRoles.length > 1 && (
              <>
                <DropdownMenuLabel className="text-xs text-gray-400">
                  Switch Role
                </DropdownMenuLabel>

                {availableRoles
                  .filter((role) => role !== activeRole) // hide current role
                  .map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => switchRole(role)}
                      className="cursor-pointer"
                    >
                      <Repeat className="mr-2 h-4 w-4" />
                      {role}
                    </DropdownMenuItem>
                  ))}

                <DropdownMenuSeparator />
              </>
            )}

            {/* Profile */}
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard/profile")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>

            {/* Settings */}
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>


            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 cursor-pointer hover:bg-red-500 focus:bg-red-500 hover:text-red-50 focus:text-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
