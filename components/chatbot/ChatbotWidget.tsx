"use client";

// ============================================================
// Confairo Chatbot — Root Widget
// Orchestrates button + window + initializes settings/session
// ============================================================
import { useEffect } from "react";
import { useChatbot } from "@/lib/chatbot/useChatbot";
import { ChatbotButton } from "./ChatbotButton";
import { ChatbotWindow } from "./ChatbotWindow";

interface ChatbotWidgetProps {
  /** Pass authenticated user role from server component if available */
  initialRole?: "guest" | "participant" | "organizer" | "reviewer" | "admin";
}

export function ChatbotWidget({ initialRole }: ChatbotWidgetProps) {
  const {
    isOpen,
    isMinimized,
    messages,
    isStreaming,
    settings,
    settingsLoaded,
    unreadCount,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    stopStreaming,
    clearHistory,
    setUserRole,
    resetUnread,
  } = useChatbot();

  // Set user role from server props
  useEffect(() => {
    if (initialRole) {
      setUserRole(initialRole);
    }
  }, [initialRole, setUserRole]);

  // Don't render if settings say chatbot is disabled
  if (settingsLoaded && settings && !settings.enabled) {
    return null;
  }

  // Handle minimize state — open chat clears minimize
  const handleToggle = () => {
    if (isMinimized || !isOpen) {
      openChat();
    } else {
      toggleChat();
    }
    resetUnread();
  };

  return (
    <>
      {/* Chat Window */}
      <ChatbotWindow
        isOpen={isOpen && !isMinimized}
        messages={messages}
        isStreaming={isStreaming}
        settings={settings}
        onClose={closeChat}
        onMinimize={() => {
          closeChat();
        }}
        onSendMessage={sendMessage}
        onStopStreaming={stopStreaming}
        onClearHistory={() => {
          clearHistory();
        }}
      />

      {/* Floating Button */}
      <ChatbotButton
        isOpen={isOpen && !isMinimized}
        unreadCount={unreadCount}
        onClick={handleToggle}
        primaryColor={settings?.primaryColor ?? "#4f46e5"}
      />
    </>
  );
}
