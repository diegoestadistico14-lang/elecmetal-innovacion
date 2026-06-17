from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.database import get_pool
from app.core.security import get_current_user

router = APIRouter()


class CreateSessionRequest(BaseModel):
    agent_type: str = Field(..., pattern="^(clara|analista_oportunidad)$")


@router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    """Lista las sesiones del usuario autenticado, ordenadas por mas reciente."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, user_id::text, agent_type, status, title,
                   started_at, ended_at, created_at, updated_at
            FROM sessions
            WHERE user_id = $1::uuid
            ORDER BY created_at DESC
            """,
            user["sub"],
        )

    return {
        "data": [
            {
                "id": row["id"],
                "user_id": row["user_id"],
                "agent_type": row["agent_type"],
                "status": row["status"],
                "title": row["title"],
                "started_at": row["started_at"].isoformat() if row["started_at"] else None,
                "ended_at": row["ended_at"].isoformat() if row["ended_at"] else None,
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            }
            for row in rows
        ]
    }


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(
    body: CreateSessionRequest,
    user: dict = Depends(get_current_user),
):
    """Crea una nueva sesion de chat con un agente IA."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO sessions (user_id, agent_type, status)
            VALUES ($1::uuid, $2, 'active')
            RETURNING id, user_id::text, agent_type, status, title,
                      started_at, ended_at, created_at, updated_at
            """,
            user["sub"],
            body.agent_type,
        )

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "agent_type": row["agent_type"],
        "status": row["status"],
        "title": row["title"],
        "started_at": row["started_at"].isoformat() if row["started_at"] else None,
        "ended_at": row["ended_at"].isoformat() if row["ended_at"] else None,
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }
