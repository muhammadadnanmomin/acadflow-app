"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface EmailStatusBarProps {
  paper: any;
  submitting: boolean;
  onResend: () => void;
}

export default function EmailStatusBar({ paper, submitting, onResend }: EmailStatusBarProps) {
  if (!paper.decision_email_sent) return null;

  return (
    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-green-700">
        <Mail className="h-4 w-4" />
        Decision email has been sent to all authors.
      </div>
      <Button size="sm" variant="outline" className="text-xs" disabled={submitting} onClick={onResend}>
        Resend Email
      </Button>
    </div>
  );
}
