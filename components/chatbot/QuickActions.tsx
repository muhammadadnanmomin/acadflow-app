"use client";

// ============================================================
// AcadFlow Chatbot — Quick Action Buttons
// ============================================================
import { Search, FileText, BarChart2, CalendarClock, HelpCircle } from "lucide-react";
import type { QuickAction } from "@/lib/chatbot/types";

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "find-conferences",
    label: "Find Conferences",
    icon: "search",
    query: "Show me upcoming conferences in AI and machine learning",
  },
  {
    id: "submit-paper",
    label: "Submit Paper",
    icon: "file",
    query: "How do I submit a paper on AcadFlow?",
  },
  {
    id: "track-status",
    label: "Track Status",
    icon: "chart",
    query: "How do I check the status of my paper submission?",
  },
  {
    id: "deadlines",
    label: "Deadlines",
    icon: "calendar",
    query: "Show me submission deadlines coming up this month",
  },
  {
    id: "help",
    label: "Get Help",
    icon: "help",
    query: "What can you help me with?",
  },
];

const ICONS: Record<string, React.ReactNode> = {
  search: <Search className="h-3 w-3" />,
  file: <FileText className="h-3 w-3" />,
  chart: <BarChart2 className="h-3 w-3" />,
  calendar: <CalendarClock className="h-3 w-3" />,
  help: <HelpCircle className="h-3 w-3" />,
};

interface QuickActionsProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="px-3 pb-2 flex flex-wrap gap-1.5">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          id={`chatbot-quick-${action.id}`}
          onClick={() => onSelect(action.query)}
          disabled={disabled}
          className="
            inline-flex items-center gap-1.5 rounded-full
            border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-800
            px-2.5 py-1
            text-xs font-medium text-gray-600 dark:text-gray-300
            hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700
            dark:hover:bg-indigo-950 dark:hover:border-indigo-600 dark:hover:text-indigo-300
            transition-all duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-sm
          "
        >
          {ICONS[action.icon]}
          {action.label}
        </button>
      ))}
    </div>
  );
}
