"use client";

// ============================================================
// AcadFlow Chatbot — Typing Indicator
// Three animated dots (CSS bounce animation)
// ============================================================

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3">
        <span className="sr-only">AcadFlow AI is typing…</span>
        <span className="chatbot-dot" style={{ animationDelay: "0ms" }} />
        <span className="chatbot-dot" style={{ animationDelay: "160ms" }} />
        <span className="chatbot-dot" style={{ animationDelay: "320ms" }} />
      </div>
    </div>
  );
}
