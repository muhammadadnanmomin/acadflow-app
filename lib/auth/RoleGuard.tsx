"use client";

import { useProfile } from "./useProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleGuard({
  adminOnly = false,
  children,
}: {
  adminOnly?: boolean;
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (loading || !profile) return;

    if (adminOnly && profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [profile, loading, adminOnly, router]);

  if (loading || !profile) return null;

  return <>{children}</>;
}