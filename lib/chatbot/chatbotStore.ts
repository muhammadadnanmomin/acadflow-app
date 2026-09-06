// ============================================================
// Confairo Chatbot — Zustand Store
// ============================================================
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatbotSettings, UserRole } from "./types";

interface ChatbotState {
  // UI state
  isOpen: boolean;
  isMinimized: boolean;

  // Chat state
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  userRole: UserRole;

  // Settings (fetched from API)
  settings: ChatbotSettings | null;
  settingsLoaded: boolean;

  // Unread badge
  unreadCount: number;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;

  setSessionId: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string, done?: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setSettings: (settings: ChatbotSettings) => void;
  setSettingsLoaded: (loaded: boolean) => void;
  clearHistory: () => void;
  resetUnread: () => void;
  incrementUnread: () => void;
}

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      // Initial UI state
      isOpen: false,
      isMinimized: false,

      // Initial chat state
      sessionId: null,
      messages: [],
      isStreaming: false,
      userRole: "guest",

      // Initial settings
      settings: null,
      settingsLoaded: false,

      // Unread
      unreadCount: 0,

      // ── UI Actions ──────────────────────────────────────────
      openChat: () =>
        set({ isOpen: true, isMinimized: false, unreadCount: 0 }),

      closeChat: () => set({ isOpen: false, isMinimized: false }),

      toggleChat: () =>
        set((state) => ({
          isOpen: !state.isOpen,
          isMinimized: false,
          unreadCount: state.isOpen ? state.unreadCount : 0,
        })),

      minimizeChat: () =>
        set({ isMinimized: true, isOpen: false }),

      // ── Session / Message Actions ────────────────────────────
      setSessionId: (id) => set({ sessionId: id }),

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastMessage: (content, done = false) =>
        set((state) => {
          const msgs = [...state.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant") {
            msgs[msgs.length - 1] = {
              ...last,
              content,
              isStreaming: !done,
            };
          }
          return { messages: msgs };
        }),

      setIsStreaming: (streaming) => set({ isStreaming: streaming }),

      setUserRole: (role) => set({ userRole: role }),

      // ── Settings ────────────────────────────────────────────
      setSettings: (settings) => set({ settings }),
      setSettingsLoaded: (loaded) => set({ settingsLoaded: loaded }),

      // ── History ─────────────────────────────────────────────
      clearHistory: () =>
        set({ messages: [], sessionId: null }),

      // ── Unread ──────────────────────────────────────────────
      resetUnread: () => set({ unreadCount: 0 }),
      incrementUnread: () =>
        set((state) => ({
          unreadCount: state.isOpen ? 0 : state.unreadCount + 1,
        })),
    }),
    {
      name: "Confairo-chatbot",
      // Only persist session ID and user role; don't persist messages (reload from API)
      partialize: (state: ChatbotState) => ({
        sessionId: state.sessionId,
        userRole: state.userRole,
      }),
    }
  )
);
