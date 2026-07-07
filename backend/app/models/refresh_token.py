"""
KRISHISEVA — Refresh Token Model.

Stores refresh tokens for JWT token rotation.
Supports all three actor roles (farmer, ngo, official).
"""

import uuid
from datetime import datetime, timezone


from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RefreshToken(Base):
    """
    Refresh token store. Uses plain Base — tokens are created and deleted,
    never soft-deleted. Old tokens are hard-deleted on rotation.
    """

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False,
        comment="ID from the relevant actor table (farmers/ngos/officials)"
    )
    user_role: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="farmer / ngo / official"
    )
    token: Mapped[str] = mapped_column(
        String(500), nullable=False, unique=True, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

