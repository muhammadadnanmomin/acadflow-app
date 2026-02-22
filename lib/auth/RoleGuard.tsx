"use client";

import { useProfile } from "./useProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  allowed: string[];
  children: React.ReactNode;
};

export default function RoleGuard({ allowed, children }: Props) {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!profile || !allowed.includes(profile.role))) {
      router.replace("/dashboard");
    }
  }, [profile, loading, allowed, router]);

  if (loading || !profile) return <p>Checking permissions...</p>;

  return <>{children}</>;
}
