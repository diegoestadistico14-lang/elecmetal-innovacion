import { http, HttpResponse, delay } from "msw";

const API_URL = "http://localhost:8000";

// ─── Mock SSE helpers ──────────────────────────────────────────

const MOCK_CLARA_REPLY =
  "¡Hola! Soy Clara, tu asistente de innovación. " +
  "He analizado tu consulta y encuentro varias oportunidades interesantes. " +
  "Podemos explorar mejoras en eficiencia operativa, reducción de costos " +
  "y nuevas tecnologías aplicables a tu proceso. " +
  "¿Te gustaría que profundice en algún aspecto en particular?";

/**
 * Divide el texto en tokens simulados (palabras + espacios)
 * para el efecto typewriter.
 */
function tokenize(text: string): string[] {
  // Dividir por palabra manteniendo espacios como tokens independientes
  return text.split(/(\s+)/).filter(Boolean);
}

function createSSEResponse(
  tokens: string[],
  simulateErrorAfter?: number,
): HttpResponse {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < tokens.length; i++) {
        // Simular latencia de red (30-80ms por token)
        await delay(Math.floor(Math.random() * 50) + 30);

        // Simular error a mitad del stream si se solicita
        if (simulateErrorAfter !== undefined && i === simulateErrorAfter) {
          controller.error(new Error("Stream broken"));
          return;
        }

        const chunk = `data: ${JSON.stringify({ token: tokens[i] })}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const mockProfile = {
  id: "test-user-id",
  full_name: "Camila Gómez",
  role: "postulante" as const,
  avatar_url: null,
  created_at: "2026-06-17T10:00:00-04:00",
  updated_at: "2026-06-17T10:00:00-04:00",
};

export const mockMessages = [
  {
    id: 1,
    session_id: 1,
    role: "user" as const,
    content: "Hola Clara, necesito ayuda con mi postulación",
    metadata: null,
    created_at: "2026-06-17T15:30:00-04:00",
  },
  {
    id: 2,
    session_id: 1,
    role: "assistant" as const,
    content: "¡Hola! Claro que sí, cuéntame más sobre tu iniciativa.",
    metadata: null,
    created_at: "2026-06-17T15:30:30-04:00",
  },
];

let messageIdCounter = 10;

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

  // GET /api/v1/sessions/:sessionId/stream — SSE mock
  http.get(`${API_URL}/api/v1/sessions/:sessionId/stream`, ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const resumeFrom = url.searchParams.get("resume_from");
    const simulateError = url.searchParams.get("simulate_error");

    const allTokens = tokenize(MOCK_CLARA_REPLY);

    // Si es una reconexión, reanudar desde el token indicado
    const startIndex = resumeFrom ? Math.min(Number(resumeFrom), allTokens.length) : 0;
    const tokens = allTokens.slice(startIndex);

    // Si se pide simular error
    const errorAfter = simulateError !== null
      ? Math.min(Number(simulateError), tokens.length)
      : undefined;

    return createSSEResponse(tokens, errorAfter);
  }),

  // GET /api/v1/sessions/:sessionId
  http.get(`${API_URL}/api/v1/sessions/:sessionId`, ({ request, params }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    const session = mockSessions.find((s) => s.id === Number(params.sessionId));
    if (!session) {
      return HttpResponse.json(
        { error: { code: "SESSION_NOT_FOUND", message: "La sesión no existe" } },
        { status: 404 },
      );
    }
    return HttpResponse.json(session);
  }),

  // GET /api/v1/sessions/:sessionId/messages
  http.get(`${API_URL}/api/v1/sessions/:sessionId/messages`, ({ request, params }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    const sessionMessages = mockMessages.filter(
      (m) => m.session_id === Number(params.sessionId),
    );
    return HttpResponse.json({
      data: sessionMessages,
      pagination: { next_cursor: null, has_more: false },
    });
  }),

  // POST /api/v1/sessions/:sessionId/messages
  http.post(`${API_URL}/api/v1/sessions/:sessionId/messages`, async ({ request, params }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token inválido" } },
        { status: 401 },
      );
    }
    const body = (await request.json()) as { content: string };
    const now = new Date().toISOString();
    const userMsg = {
      id: ++messageIdCounter,
      session_id: Number(params.sessionId),
      role: "user" as const,
      content: body.content,
      metadata: null,
      created_at: now,
    };
    const assistantMsg = {
      id: ++messageIdCounter,
      session_id: Number(params.sessionId),
      role: "assistant" as const,
      content: "Clara no está disponible por ahora. Intentaremos conectarla pronto. Mientras tanto, tu mensaje ha sido registrado.",
      metadata: null,
      created_at: now,
    };
    return HttpResponse.json(
      { user_message: userMsg, assistant_message: assistantMsg },
      { status: 201 },
    );
  }),
];
