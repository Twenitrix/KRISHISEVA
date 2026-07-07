"""
KRISHISEVA — Farmer Model.

Farmers authenticate via mock Aadhaar OTP, not email/password.
Aadhaar is stored masked (last 4 digits only).
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Farmer(BaseModel):
    __tablename__ = "farmers"

    village_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False
    )
    aadhaar_masked: Mapped[str] = mapped_column(
        String(4), nullable=False, comment="Last 4 digits of Aadhaar"
    )
    aadhaar_hash: Mapped[str] = mapped_column(
        String(256), nullable=False, unique=True,
        comment="SHA-256 hash of full Aadhaar for lookup without storing it"
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), nullable=False, unique=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(11), nullable=True)
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
        comment="True after successful Aadhaar OTP verification"
    )

    # Relationships
    village = relationship("Village", back_populates="farmers")
    land_registries = relationship("LandRegistry", back_populates="farmer", lazy="selectin")
    claims = relationship("Claim", back_populates="farmer", lazy="selectin")
    past_beneficiaries = relationship("PastBeneficiary", back_populates="farmer", lazy="selectin")
    ngo_verifications = relationship("NGOVerification", back_populates="farmer", lazy="selectin")
