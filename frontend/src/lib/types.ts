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

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
