"""
KRISHISEVA — Claim Status Log Model.

Immutable audit trail of every status change on a claim.
Ensures full traceability: who changed what, when, and why.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ClaimStatusLog(Base):
    """
    Immutable log entry — no soft delete, no update.
    Uses plain Base (not BaseModel) because audit logs are never deleted or edited.
    """

    __tablename__ = "claim_status_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    old_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by_role: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="farmer / ngo / official / system"
    )
    changed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True,
        comment="ID of the actor who made the change"
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )


    # Relationships
    claim = relationship("Claim", back_populates="status_logs")
