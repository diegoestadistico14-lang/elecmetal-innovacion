import type {
  UserProfile,
  Session,
  SessionsResponse,
  AgentType,
} from "./types";

// ─── Constants ────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Error class ──────────────────────────────────────────────

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ─── Internal helper ──────────────────────────────────────────

async function request<T>(
  token: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorBody: { error?: { code?: string; message?: string; details?: Record<string, unknown> } } = {};
    try {
      errorBody = await res.json();
    } catch {
      // respuesta sin JSON
    }
    throw new ApiError(
      res.status,
      errorBody?.error?.code || "UNKNOWN_ERROR",
      errorBody?.error?.message || "Error inesperado del servidor",
      errorBody?.error?.details,
    );
  }

  return res.json();
}

// ─── Public API functions ─────────────────────────────────────

export async function fetchMe(token: string): Promise<UserProfile> {
  return request<UserProfile>(token, "/api/v1/me");
}

export async function fetchSessions(token: string): Promise<SessionsResponse> {
  return request<SessionsResponse>(token, "/api/v1/sessions");
}

export async function createSession(
  token: string,
  agentType: AgentType,
): Promise<Session> {
  return request<Session>(token, "/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify({ agent_type: agentType }),
  });
}

export async function healthCheck() {
  const res = await fetch(`${API_URL}/api/v1/health`);
  return res.json();
}
