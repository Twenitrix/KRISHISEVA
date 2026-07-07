"""
KRISHISEVA — Past Event Model.

Historical disaster events (flood, drought, hailstorm, famine) for a village.
Part of the Static DB (SDB) — reference data for the verification process.
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PastEvent(BaseModel):
    __tablename__ = "past_events"

    village_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="flood / drought / hailstorm / famine"
    )
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="low / medium / high / severe"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    village = relationship("Village", back_populates="past_events")
    past_beneficiaries = relationship("PastBeneficiary", back_populates="event", lazy="selectin")
