"use client";

// ============================================================
// Confairo Chatbot — Floating Button (bottom-right)
// ============================================================
import { MessageCircle, X } from "lucide-react";

interface ChatbotButtonProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
  primaryColor?: string;
}

export function ChatbotButton({
  isOpen,
  unreadCount,
  onClick,
  primaryColor = "#4f46e5",
}: ChatbotButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-2">
      {/* Pulse ring (shown when closed) */}
      {!isOpen && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      <button
        id="chatbot-toggle-button"
        onClick={onClick}
        aria-label={isOpen ? "Close chat" : "Open Confairo AI chat"}
        className="
          relative h-14 w-14 rounded-full
          shadow-[0_8px_30px_rgba(79,70,229,0.4)]
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        "
        style={{ backgroundColor: primaryColor }}
      >
        {/* Icon swap */}
        <span
          className={`absolute transition-all duration-200 ${isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
            }`}
        >
          <X className="h-6 w-6 text-white" />
        </span>
        <span
          className={`absolute transition-all duration-200 ${isOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
            }`}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </span>

        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="
            absolute -top-1 -right-1
            h-5 w-5 rounded-full
            bg-red-500 text-white
            text-[10px] font-bold
            flex items-center justify-center
            shadow-sm animate-bounce
          ">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
