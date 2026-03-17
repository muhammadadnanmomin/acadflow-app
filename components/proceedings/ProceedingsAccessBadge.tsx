"use client";

import { Badge } from "@/components/ui/badge";
import { UserCheck, Users, Shield } from "lucide-react";

interface Props {
  reason: "author" | "attendee" | "organizer";
}

const config = {
  author: {
    label: "Access: Author",
    icon: UserCheck,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  attendee: {
    label: "Access: Attendee",
    icon: Users,
    className:
      "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
  organizer: {
    label: "Access: Organizer",
    icon: Shield,
    className:
      "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
  },
};

export default function ProceedingsAccessBadge({ reason }: Props) {
  const { label, icon: Icon, className } = config[reason];

  return (
    <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
