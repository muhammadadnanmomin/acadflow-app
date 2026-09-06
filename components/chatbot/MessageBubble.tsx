"use client";

// ============================================================
// Confairo Chatbot — Message Bubble
// User vs AI message bubbles with Markdown support + copy
// ============================================================
import { useState, useEffect } from "react";
import { Copy, Check, Bot } from "lucide-react";
import type { ChatMessage } from "@/lib/chatbot/types";

// Lightweight markdown → HTML (avoids heavy deps)
function parseMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="chatbot-code-inline">$1</code>')
    // Headers h3
    .replace(/^### (.+)$/gm, '<h3 class="chatbot-h3">$1</h3>')
    // Headers h2
    .replace(/^## (.+)$/gm, '<h2 class="chatbot-h2">$1</h2>')
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li class="chatbot-li-num">$1</li>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<li class="chatbot-li">$1</li>')
    // Wrap consecutive <li> elements in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="chatbot-ul">${match}</ul>`)
    // Line breaks
    .replace(/\n\n/g, '<br class="chatbot-br" />')
    .replace(/\n/g, "<br />");
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!isUser) {
      setHtml(parseMarkdown(message.content));
    }
  }, [message.content, isUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1 group">
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div className="
            rounded-2xl rounded-br-sm
            bg-indigo-600 text-white
            px-4 py-2.5 text-sm leading-relaxed
            shadow-sm
          ">
            {message.content}
          </div>
          <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  // Assistant bubble
  return (
    <div className="flex items-start gap-2.5 px-4 py-1 group">
      {/* Avatar */}
      <div className="
        shrink-0 h-7 w-7 rounded-full
        bg-gradient-to-br from-indigo-500 to-violet-600
        flex items-center justify-center
        shadow-sm mt-0.5
      ">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>

      <div className="flex flex-col gap-1 max-w-[85%]">
        <div className="
          rounded-2xl rounded-bl-sm
          bg-gray-100 dark:bg-gray-800
          px-4 py-3 text-sm leading-relaxed
          text-gray-800 dark:text-gray-100
          shadow-sm
        ">
          {message.isStreaming ? (
            <span>
              <span dangerouslySetInnerHTML={{ __html: html || parseMarkdown(message.content) }} />
              <span className="chatbot-cursor inline-block ml-0.5 h-4 w-0.5 bg-indigo-500 align-middle" />
            </span>
          ) : (
            <div
              className="chatbot-prose"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>

        {/* Bottom row: time + copy */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {!message.isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
              aria-label="Copy message"
            >
              {copied ? (
                <><Check className="h-3 w-3" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
