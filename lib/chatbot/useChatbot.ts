// ============================================================
// Confairo Chatbot — useChatbot Hook
// Central hook consumed by all chatbot components
// ============================================================
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChatbotStore } from "./chatbotStore";
import type { ChatMessage, UserRole } from "./types";

export function useChatbot() {
  const store = useChatbotStore();
  const abortRef = useRef<AbortController | null>(null);

  // ── Load settings on mount ────────────────────────────────
  useEffect(() => {
    if (store.settingsLoaded) return;

    fetch("/api/chatbot/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          store.setSettings(data.settings);
        }
        store.setSettingsLoaded(true);
      })
      .catch(() => {
        // Fallback settings
        store.setSettings({
          enabled: true,
          welcomeMessage:
            "Hi! I'm Confairo AI 👋 I can help you discover conferences, track submissions, check deadlines, and navigate the platform. How can I assist you today?",
          botName: "Confairo AI",
          primaryColor: "#3b4fd4",
        });
        store.setSettingsLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initialize session ────────────────────────────────────
  const initSession = useCallback(
    async (role?: UserRole) => {
      try {
        const res = await fetch("/api/chatbot/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: role ?? store.userRole }),
        });
        const data = await res.json();
        if (data.session) {
          store.setSessionId(data.session.id);
          if (data.messages?.length) {
            store.setMessages(data.messages);
          }
          return data.session.id as string;
        }
      } catch (e) {
        console.error("Failed to init chatbot session", e);
      }
      return null;
    },
    [store]
  );

  // ── Load existing session messages ───────────────────────
  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(`/api/chatbot/sessions?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.messages) {
          store.setMessages(data.messages);
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    },
    [store]
  );

  // ── Send message with SSE streaming ──────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || store.isStreaming) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // Ensure we have a session
      let sessionId = store.sessionId;
      if (!sessionId) {
        sessionId = await initSession();
        if (!sessionId) return;
      }

      // Optimistically add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sessionId,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      store.addMessage(userMsg);
      store.setIsStreaming(true);

      // Add placeholder for assistant response
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sessionId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };
      store.addMessage(assistantMsg);

      try {
        const res = await fetch("/api/chatbot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content.trim(), sessionId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        if (!res.body) throw new Error("No response body");

        // Read SSE stream
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") {
                store.updateLastMessage(accumulated, true);
                store.incrementUnread();
                break;
              }
              try {
                const event = JSON.parse(raw);
                if (event.type === "token" && event.content) {
                  accumulated += event.content;
                  store.updateLastMessage(accumulated, false);
                } else if (event.type === "error") {
                  throw new Error(event.error);
                }
              } catch {
                // Ignore parse errors from incomplete SSE chunks
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        // Show error in chat
        store.updateLastMessage(
          "⚠️ Sorry, I encountered an error. Please try again or refresh the page.",
          true
        );
        console.error("Chatbot stream error:", err);
      } finally {
        store.setIsStreaming(false);
      }
    },
    [store, initSession]
  );

  // ── Open chat + auto-init session ────────────────────────
  const openAndInit = useCallback(async () => {
    store.openChat();
    if (!store.sessionId) {
      await initSession();
    } else {
      await loadSession(store.sessionId);
    }
  }, [store, initSession, loadSession]);

  // ── Stop streaming ────────────────────────────────────────
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    store.setIsStreaming(false);
    store.updateLastMessage(
      store.messages[store.messages.length - 1]?.content ?? "",
      true
    );
  }, [store]);

  return {
    // State
    isOpen: store.isOpen,
    isMinimized: store.isMinimized,
    sessionId: store.sessionId,
    messages: store.messages,
    isStreaming: store.isStreaming,
    userRole: store.userRole,
    settings: store.settings,
    settingsLoaded: store.settingsLoaded,
    unreadCount: store.unreadCount,

    // Actions
    openChat: openAndInit,
    closeChat: store.closeChat,
    toggleChat: store.toggleChat,
    sendMessage,
    stopStreaming,
    clearHistory: store.clearHistory,
    setUserRole: store.setUserRole,
    resetUnread: store.resetUnread,
  };
}
