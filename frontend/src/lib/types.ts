// ─── API Response Types ──────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string;
  role: "postulante" | "directora" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AgentType = "clara" | "analista_oportunidad";

export type SessionStatus = "active" | "completed" | "abandoned";

export interface Session {
  id: number;
  user_id: string;
  agent_type: AgentType;
  status: SessionStatus;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionsResponse {
  data: Session[];
}

// ─── Message Types ────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: number;
  session_id: number;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MessagesResponse {
  data: Message[];
  pagination: {
    next_cursor: number | null;
    has_more: boolean;
  };
}

export interface SendMessageResponse {
  user_message: Message;
  /** Solo presente en modo placeholder (sin OpenAI). Con OpenAI real, la
   * respuesta del asistente llega via SSE stream y se persiste al final. */
  assistant_message?: Message;
}

// ─── Error Types ──────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
