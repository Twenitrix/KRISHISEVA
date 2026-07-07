"""
KRISHISEVA — Claim Model.

Central entity in the system. A claim is filed by a farmer, processed through
the Verification Pipeline (VP), and reviewed by an official.

Contains:
- Submission data (photo, coordinates, event info)
- AI results (crop identified, damage %, justification)
- Rule engine results (GPS match, land match, duplicate check, fraud flags)
- Payout calculation (suggested + official-approved amounts)
- Status tracking (filed → under_review → verified → approved/denied → payout)
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ClaimStatus(str, enum.Enum):
    """Claim lifecycle statuses."""
    FILED = "filed"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    APPROVED = "approved"
    DENIED = "denied"
    PAYOUT = "payout"


class Claim(BaseModel):
    __tablename__ = "claims"

    # ── Submission Data ──
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False
    )
    land_registry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("land_registries.id"), nullable=False
    )
    village_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False
    )
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    photo_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    photo_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    photo_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Timestamp extracted from photo metadata (mocked)"
    )
    claimed_event_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="flood / drought / hailstorm / famine"
    )
    claimed_event_date: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="Date the farmer claims the event occurred"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── AI Vision Results ──
    ai_identified_crop: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_damage_percentage: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="0.0 to 100.0 — estimated damage severity from AI"
    )
    ai_justification: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="AI's reasoning for crop ID and damage assessment"
    )
    ai_crop_matches_record: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True,
        comment="True if AI crop matches land registry crop_on_record"
    )
    ai_call_status: Mapped[str | None] = mapped_column(
        String(20), nullable=True,
        comment="success / failed / pending"
    )

    # ── Rule Engine Results ──
    gps_match_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="0.0 to 1.0 — how close the photo GPS is to land parcel"
    )
    land_match_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="0.0 to 1.0 — overall land coordinate match confidence"
    )
    duplicate_check_result: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
        comment="clean / duplicate_suspected / flagged"
    )
    fraud_flags: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        comment="List of fraud indicators found"
    )
    overall_score: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="0.0 to 100.0 — composite verification score"
    )

    # ── Payout ──
    suggested_payout_amount: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="System-calculated payout: insured_sum × damage_% × area"
    )
    official_approved_amount: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="Final amount approved by official (may differ from suggested)"
    )

    # ── Status & Review ──
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_status", create_constraint=True),
        default=ClaimStatus.FILED,
        nullable=False,
    )
    reviewed_by_official_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("officials.id"), nullable=True
    )
    official_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    farmer = relationship("Farmer", back_populates="claims")
    land_registry = relationship("LandRegistry", back_populates="claims")
    village = relationship("Village", back_populates="claims")
    reviewed_by_official = relationship("Official", back_populates="reviewed_claims")
    ngo_verifications = relationship("NGOVerification", back_populates="claim", lazy="selectin")
    status_logs = relationship("ClaimStatusLog", back_populates="claim", lazy="selectin")
