"""
KRISHISEVA — Auth Repository.

DB access for refresh tokens and claim status logs.
These tables use plain Base (not BaseModel) — no soft deletes.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim_status_log import ClaimStatusLog
from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    """Manages refresh tokens — hard create/delete, no soft-delete."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, token: RefreshToken) -> RefreshToken:
        """Store a new refresh token."""
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_by_token(self, token_str: str) -> Optional[RefreshToken]:
        """Find a refresh token by its value."""
        query = select(RefreshToken).where(RefreshToken.token == token_str)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_by_token(self, token_str: str) -> bool:
        """Hard-delete a refresh token (used on logout or rotation)."""
        stmt = delete(RefreshToken).where(RefreshToken.token == token_str)
        result = await self.db.execute(stmt)
        self.db.expire_all()
        await self.db.flush()
        return result.rowcount > 0

    async def delete_all_for_user(self, user_id: uuid.UUID, user_role: str) -> int:
        """Hard-delete all refresh tokens for a user (used on logout-all)."""
        stmt = delete(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.user_role == user_role,
        )
        result = await self.db.execute(stmt)
        self.db.expire_all()
        await self.db.flush()
        return result.rowcount


    async def cleanup_expired(self) -> int:
        """Remove all expired refresh tokens."""
        stmt = delete(RefreshToken).where(
            RefreshToken.expires_at < datetime.now(timezone.utc)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount


class ClaimStatusLogRepository:
    """Manages immutable audit log entries — create only, never update or delete."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log_entry: ClaimStatusLog) -> ClaimStatusLog:
        """Insert a new status change log entry."""
        self.db.add(log_entry)
        await self.db.flush()
        return log_entry

    async def get_by_claim(self, claim_id: uuid.UUID) -> list[ClaimStatusLog]:
        """Get full status history for a claim, oldest first."""
        query = (
            select(ClaimStatusLog)
            .where(ClaimStatusLog.claim_id == claim_id)
            .order_by(ClaimStatusLog.timestamp.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
