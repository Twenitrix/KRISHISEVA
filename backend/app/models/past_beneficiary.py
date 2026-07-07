"""
KRISHISEVA — Past Beneficiary Model.

Records of farmers who received payouts in previous disaster events.
Used for duplicate/fraud checking in the verification process.
"""

import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PastBeneficiary(BaseModel):
    __tablename__ = "past_beneficiaries"

    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("past_events.id"), nullable=False
    )
    claim_amount: Mapped[float] = mapped_column(Float, nullable=False)
    payout_amount: Mapped[float] = mapped_column(Float, nullable=False)
    payout_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    farmer = relationship("Farmer", back_populates="past_beneficiaries")
    event = relationship("PastEvent", back_populates="past_beneficiaries")
