"""
KRISHISEVA — NGO Verification Model.

NGOs upload supporting evidence (photos, remarks) for specific farmers' claims.
This acts as a second, cross-validating data point in the verification process.
"""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class NGOVerification(BaseModel):
    __tablename__ = "ngo_verifications"

    ngo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ngos.id"), nullable=False
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False
    )
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    verification_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="field_visit",
        comment="field_visit / document_review / interview"
    )

    # Relationships
    ngo = relationship("NGO", back_populates="verifications")
    claim = relationship("Claim", back_populates="ngo_verifications")
    farmer = relationship("Farmer", back_populates="ngo_verifications")
