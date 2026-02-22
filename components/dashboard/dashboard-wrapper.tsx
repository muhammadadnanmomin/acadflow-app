"use client";

import { DashboardLayout } from "./dashboard-layout";

export function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
