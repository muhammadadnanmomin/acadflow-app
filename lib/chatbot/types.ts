// ============================================================
// Confairo Chatbot — TypeScript Types
// ============================================================

export type UserRole = "guest" | "participant" | "organizer" | "reviewer" | "admin";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean; // ephemeral — only on client during stream
}

export interface ChatSession {
  id: string;
  userId: string | null;
  userRole: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotSettings {
  enabled: boolean;
  welcomeMessage: string;
  botName: string;
  primaryColor: string;
}

export interface ChatDocument {
  id: string;
  content: string;
  metadata: {
    type: "faq" | "conference" | "guide" | "deadline";
    title?: string;
    source?: string;
    tags?: string[];
  };
  similarity?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  query: string;
}

// API request / response shapes
export interface ChatRequest {
  message: string;
  sessionId: string | null;
}

export interface ChatStreamEvent {
  type: "token" | "done" | "error";
  content?: string;
  error?: string;
}

export interface SessionCreateResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface SettingsUpdateRequest {
  enabled?: boolean;
  welcomeMessage?: string;
  botName?: string;
}

export interface KnowledgeSeedRequest {
  documents: Array<{
    content: string;
    metadata: ChatDocument["metadata"];
  }>;
}
