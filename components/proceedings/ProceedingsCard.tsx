"use client";

import { Card } from "@/components/ui/card";
import { BookOpen, Clock, ShieldCheck } from "lucide-react";
import ProceedingsAccessBadge from "./ProceedingsAccessBadge";
import ProceedingsActions from "./ProceedingsActions";

interface Props {
  conferenceId: string;
  conferenceTitle: string;
  conferenceShortName?: string | null;
  proceedingsTitle: string;
  proceedingsDescription: string | null;
  proceedingsCreatedAt: string;
  accessReason: "author" | "attendee" | "organizer";
  lastAccessedAt: string | null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function ProceedingsCard({
  conferenceId,
  conferenceTitle,
  conferenceShortName,
  proceedingsTitle,
  proceedingsDescription,
  proceedingsCreatedAt,
  accessReason,
  lastAccessedAt,
}: Props) {
  return (
    <Card className="overflow-hidden">
      {/* Gradient header strip */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

      <div className="p-6 space-y-5">
        {/* Top row: icon + conference name + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                📚 Conference Proceedings
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {conferenceTitle}
                {conferenceShortName && (
                  <span className="ml-1 text-gray-400">
                    ({conferenceShortName})
                  </span>
                )}
              </p>
            </div>
          </div>

          <ProceedingsAccessBadge reason={accessReason} />
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-base font-medium text-gray-800">
            {proceedingsTitle}
          </h3>
          {proceedingsDescription && (
            <p className="text-sm text-gray-500 leading-relaxed">
              {proceedingsDescription}
            </p>
          )}
          <p className="text-xs text-gray-400 pt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Published{" "}
            {new Date(proceedingsCreatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Security notice */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>
            🔐 This document is protected. Access is logged and links expire
            after 5 minutes.
          </span>
        </div>

        {/* Actions */}
        <ProceedingsActions
          conferenceId={conferenceId}
          title={proceedingsTitle}
        />

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t">
          {lastAccessedAt ? (
            <span>Last accessed: {timeAgo(lastAccessedAt)}</span>
          ) : (
            <span>First time accessing</span>
          )}
          <span>Secure link expires in 5 minutes</span>
        </div>
      </div>
    </Card>
  );
}
