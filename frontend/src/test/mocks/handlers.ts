import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:8000";

export const mockProfile = {
  id: "test-user-id",
  full_name: "Camila Gómez",
  role: "postulante" as const,
  avatar_url: null,
  created_at: "2026-06-17T10:00:00-04:00",
  updated_at: "2026-06-17T10:00:00-04:00",
};

export const mockSessions = [
  {
    id: 1,
    user_id: "test-user-id",
    agent_type: "clara" as const,
    status: "active" as const,
    title: "Postulación de mejora en molinos",
    started_at: "2026-06-17T15:30:00-04:00",
    ended_at: null,
    created_at: "2026-06-17T15:30:00-04:00",
    updated_at: "2026-06-17T15:30:00-04:00",
  },
  {
    id: 2,
    user_id: "test-user-id",
    agent_type: "analista_oportunidad" as const,
    status: "active" as const,
    title: null,
    started_at: "2026-06-16T10:00:00-04:00",
    ended_at: null,
    created_at: "2026-06-16T10:00:00-04:00",
    updated_at: "2026-06-16T10:00:00-04:00",
  },
];

export const handlers = [
  // GET /api/v1/me
  http.get(`${API_URL}/api/v1/me`, ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    return HttpResponse.json(mockProfile);
  }),

  // GET /api/v1/sessions
  http.get(`${API_URL}/api/v1/sessions`, ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ data: mockSessions });
  }),

  // POST /api/v1/sessions
  http.post(`${API_URL}/api/v1/sessions`, async ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    const body = (await request.json()) as { agent_type: string };
    return HttpResponse.json(
      {
        id: 3,
        user_id: "test-user-id",
        agent_type: body.agent_type,
        status: "active",
        title: null,
        started_at: "2026-06-17T16:00:00-04:00",
        ended_at: null,
        created_at: "2026-06-17T16:00:00-04:00",
        updated_at: "2026-06-17T16:00:00-04:00",
      },
      { status: 201 },
    );
  }),
];
