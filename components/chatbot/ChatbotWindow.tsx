"use client";

// ============================================================
// AcadFlow Chatbot — Chat Window
// Expandable glassmorphism chat panel
// ============================================================
import { useRef, useEffect, useState, KeyboardEvent } from "react";
import {
  Bot,
  X,
  Minus,
  Trash2,
  Send,
  StopCircle,
  Sparkles,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { QuickActions } from "./QuickActions";
import type { ChatMessage, ChatbotSettings } from "@/lib/chatbot/types";

interface ChatbotWindowProps {
  isOpen: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  settings: ChatbotSettings | null;
  onClose: () => void;
  onMinimize: () => void;
  onSendMessage: (msg: string) => void;
  onStopStreaming: () => void;
  onClearHistory: () => void;
}

export function ChatbotWindow({
  isOpen,
  messages,
  isStreaming,
  settings,
  onClose,
  onMinimize,
  onSendMessage,
  onStopStreaming,
  onClearHistory,
}: ChatbotWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (query: string) => {
    onSendMessage(query);
  };

  // Welome message (shown when no messages yet)
  const showWelcome = messages.length === 0;

  return (
    <div
      id="chatbot-window"
      role="dialog"
      aria-label="AcadFlow AI Chat"
      aria-modal="true"
      className={`
        fixed bottom-24 right-6 z-[9997]
        w-[380px] max-w-[calc(100vw-2rem)]
        flex flex-col
        rounded-2xl
        border border-gray-200/60 dark:border-gray-700/60
        bg-white/95 dark:bg-gray-900/95
        backdrop-blur-xl
        shadow-[0_20px_60px_rgba(0,0,0,0.18)]
        transition-all duration-300 ease-out origin-bottom-right
        ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }
      `}
      style={{ height: "clamp(440px, 70vh, 620px)" }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="
        flex items-center justify-between
        px-4 py-3
        border-b border-gray-100 dark:border-gray-800
        rounded-t-2xl
        bg-gradient-to-r from-indigo-600 to-violet-600
        shrink-0
      ">
        <div className="flex items-center gap-2.5">
          <div className="
            h-8 w-8 rounded-full
            bg-white/20 backdrop-blur-sm
            flex items-center justify-center
          ">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">
              {settings?.botName ?? "AcadFlow AI"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-indigo-100">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Clear history */}
          <button
            id="chatbot-clear-btn"
            onClick={onClearHistory}
            title="Clear chat history"
            className="
              h-7 w-7 rounded-lg
              flex items-center justify-center
              text-white/70 hover:text-white hover:bg-white/20
              transition-colors
            "
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Minimize */}
          <button
            id="chatbot-minimize-btn"
            onClick={onMinimize}
            title="Minimize"
            className="
              h-7 w-7 rounded-lg
              flex items-center justify-center
              text-white/70 hover:text-white hover:bg-white/20
              transition-colors
            "
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          {/* Close */}
          <button
            id="chatbot-close-btn"
            onClick={onClose}
            title="Close"
            className="
              h-7 w-7 rounded-lg
              flex items-center justify-center
              text-white/70 hover:text-white hover:bg-white/20
              transition-colors
            "
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Message List ──────────────────────────────────────── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto py-3 space-y-0.5 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
            <div className="
              h-16 w-16 rounded-2xl
              bg-gradient-to-br from-indigo-500 to-violet-600
              flex items-center justify-center
              shadow-lg
            ">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {settings?.botName ?? "AcadFlow AI"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {settings?.welcomeMessage ??
                  "Hi! I can help you discover conferences, track submissions, check deadlines, and navigate the platform."}
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Ask me anything or try a quick action below ↓
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator — only when streaming AND last message isn't streaming yet */}
        {isStreaming &&
          messages.length > 0 &&
          !messages[messages.length - 1]?.isStreaming &&
          messages[messages.length - 1]?.role !== "assistant" && (
            <TypingIndicator />
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 pt-2">
        <QuickActions onSelect={handleQuickAction} disabled={isStreaming} />
      </div>

      {/* ── Input Bar ─────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-3">
        <div className="
          flex items-end gap-2
          rounded-xl
          border border-gray-200 dark:border-gray-700
          bg-gray-50 dark:bg-gray-800
          px-3 py-2
          focus-within:border-indigo-400 dark:focus-within:border-indigo-500
          focus-within:ring-1 focus-within:ring-indigo-400/20
          transition-all duration-150
        ">
          <textarea
            ref={inputRef}
            id="chatbot-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything…"
            rows={1}
            disabled={isStreaming}
            aria-label="Chat message input"
            className="
              flex-1 resize-none bg-transparent
              text-sm text-gray-800 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              outline-none leading-5
              max-h-32 overflow-y-auto
              disabled:opacity-50
            "
            style={{
              height: "auto",
              minHeight: "20px",
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />

          {isStreaming ? (
            <button
              id="chatbot-stop-btn"
              onClick={onStopStreaming}
              aria-label="Stop generating"
              className="
                shrink-0 h-8 w-8 rounded-lg
                bg-red-500 hover:bg-red-600
                flex items-center justify-center
                transition-colors
              "
            >
              <StopCircle className="h-4 w-4 text-white" />
            </button>
          ) : (
            <button
              id="chatbot-send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="Send message"
              className="
                shrink-0 h-8 w-8 rounded-lg
                bg-indigo-600 hover:bg-indigo-700
                flex items-center justify-center
                transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-1.5">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
