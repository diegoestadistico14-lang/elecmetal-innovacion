# Development Conventions: Plataforma de Innovacion Elecmetal

## Stack

| Componente | Tecnologia | Version |
|------------|-----------|---------|
| Frontend | Next.js | 14+ (App Router) |
| Backend | FastAPI | 0.110+ |
| Base de datos | PostgreSQL via Supabase | 15+ |
| Autenticacion | Supabase Auth | — |
| Migraciones | Goose | v3+ |
| Agentes IA | OpenAI GPT-4o | — |
| Email | Resend o SendGrid | — |

## Estructura del Proyecto

```
elecmetal-innovacion/
├── frontend/                  # Next.js App Router
│   ├── app/
│   │   ├── (auth)/            # Login, Magic Link
│   │   ├── (dashboard)/       # Sidebar + chat Clara / Analista
│   │   └── (admin)/           # Panel directora
│   ├── components/
│   │   ├── chat/              # Componentes de interfaz conversacional
│   │   ├── initiatives/       # Cards, listados, DBI viewer
│   │   └── ui/                # Design system compartido
│   └── lib/
│       ├── supabase/          # Cliente Supabase (auth + DB)
│       └── api/               # Cliente FastAPI
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── agents/    # Endpoints de agentes IA
│   │   │       ├── initiatives/
│   │   │       ├── evaluations/
│   │   │       └── notifications/
│   │   ├── core/
│   │   │   ├── config.py      # Settings desde variables de entorno
│   │   │   ├── security.py    # Validacion JWT Supabase
│   │   │   └── database.py    # Pool de conexiones asyncpg
│   │   ├── models/            # Modelos Pydantic / SQLAlchemy
│   │   ├── services/          # Logica de negocio
│   │   │   ├── clara.py       # Orquestacion de Clara
│   │   │   ├── analista.py    # Orquestacion Analista de Oportunidad
│   │   │   ├── evaluador.py   # Orquestacion Evaluador
│   │   │   ├── dbi_parser.py  # Parseo DBI → 25 campos
│   │   │   └── notifications.py
│   │   └── agents/            # Definiciones de agentes IA
│   └── tests/
├── migrations/                # Archivos Goose .sql
└── skills/                    # Skills de agentes (.skill, .md)
```

## Convenciones de Codigo

### General
- **Lenguaje**: nombres de dominio en espanol, codigo en ingles
- **Formato**: Prettier (frontend), Black (backend)
- **Linting**: ESLint (frontend), Ruff (backend)
- **Tipado**: TypeScript estricto (frontend), type hints + Pydantic (backend)

### Backend (Python/FastAPI)
- **Modelos**: SQLAlchemy 2.0 + asyncpg. No usar ORM para queries complejas — usar `text()` con parametros.
- **Validacion**: Pydantic v2 para request/response schemas
- **Async**: async/await en todos los endpoints que tocan DB o API externa
- **Errores**: formato `{"error": {"code": "INITIATIVE_NOT_FOUND", "message": "...", "details": {}}}`
- **Logging**: structlog con correlation_id por request

### Frontend (Next.js/TypeScript)
- **Estado del chat**: `useChat` de Vercel AI SDK o implementacion propia con Server-Sent Events
- **Componentes**: Server Components por defecto, Client Components solo cuando se necesita interactividad
- **Estilos**: Tailwind CSS
- **Rutas**: App Router con layouts anidados: `(auth)` publico, `(dashboard)` autenticado, `(admin)` solo directora

### Base de Datos
- **Naming**: tablas en plural snake_case, columnas snake_case, PK `id`, FK `[tabla]_id`
- **Constraints**: siempre con nombre explicito (`pk_`, `fk_`, `uq_`, `ck_`)
- **Migraciones**: Goose. Una migracion por cambio de schema. Nunca editar migraciones ya aplicadas.
- **Queries**: siempre parametrizadas (`$1`, `$2`). Nunca concatenar strings.

## API Design

### RESTful
- Base path: `/api/v1/`
- Recursos en plural: `/api/v1/initiatives`, `/api/v1/sessions`
- Sub-recursos anidados maximo 1 nivel: `/api/v1/sessions/{id}/messages`
- Paginacion: cursor-based con `?cursor=<id>&limit=50`
- Ordenamiento: `?sort=created_at&order=desc`

### Endpoints principales

| Metodo | Path | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/sessions` | Crear sesion con Clara o Analista |
| GET | `/api/v1/sessions/{id}` | Obtener sesion con metadata |
| GET | `/api/v1/sessions/{id}/messages` | Paginar mensajes de sesion |
| POST | `/api/v1/sessions/{id}/messages` | Enviar mensaje (streaming SSE) |
| GET | `/api/v1/initiatives` | Listar iniciativas del usuario |
| GET | `/api/v1/initiatives/{id}` | Obtener iniciativa + DBI completo |
| POST | `/api/v1/initiatives/{id}/evaluation` | Activar evaluacion (solo directora) |
| GET | `/api/v1/evaluations/{id}` | Obtener resultados de evaluacion |
| PATCH | `/api/v1/evaluations/{id}` | Actualizar resultados (solo directora) |

### Autenticacion
- JWT de Supabase en header `Authorization: Bearer <token>`
- Backend valida el JWT contra la clave publica de Supabase
- RLS en PostgreSQL como segunda capa (opcional para MVP)

## Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repo-url> elecmetal-innovacion
cd elecmetal-innovacion

# 2. Frontend
cd frontend
cp .env.example .env.local
# Editar .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev

# 3. Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Editar .env: DATABASE_URL, SUPABASE_JWT_SECRET, OPENAI_API_KEY
uvicorn app.main:app --reload

# 4. Migraciones
cd migrations
goose -dir . postgres "$DATABASE_URL" up

# 5. Supabase Auth
# Configurar Google OAuth y Magic Link en Supabase Dashboard
# El trigger handle_new_user() crea profiles automaticamente
```

## Testing

- **Backend**: pytest + asyncpg para tests de integracion contra PostgreSQL real
- **Frontend**: Vitest + React Testing Library para componentes
- **Migraciones**: verificar Up (schema correcto), verificar Down (limpieza total)
- **Agentes IA**: tests con fixtures de conversacion, sin llamadas reales a OpenAI

## Agentes IA

### Configuracion
Los agentes se configuran en `agent_configs` con versionado. El backend carga la version activa al iniciar:
```python
agent = await db.fetchrow(
    "SELECT * FROM agent_configs WHERE agent_name = $1 AND is_active = true",
    "clara"
)
```

### Streaming
Los mensajes del usuario se envian al agente correspondiente via OpenAI API con `stream: true`. La respuesta se streamea al frontend via Server-Sent Events.

### Parseo del DBI
Cuando Clara indica que la conversacion termino (palabra clave o flag en metadata del mensaje), el backend:
1. Recupera todos los mensajes de la sesion
2. Busca el mensaje que contiene la plantilla DBI
3. Parsea los bloques A-G usando los delimitadores de la plantilla
4. Escribe los 25 campos en `initiatives`
5. Transiciona el estado a `persistido`
6. Dispara notificaciones

## Variables de Entorno

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (.env)
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_JWT_SECRET=<jwt-secret>
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
```
