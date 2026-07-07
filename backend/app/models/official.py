"""
KRISHISEVA — Government Official Model.

Officials (SDM/DM) use email/password auth and have final authority
over claim approval, adjustment, or denial.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Official(BaseModel):
    __tablename__ = "officials"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    designation: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="Role designation: SDM or DM"
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), nullable=True)
    assigned_village_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("villages.id"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    assigned_village = relationship("Village", back_populates="officials")
    reviewed_claims = relationship("Claim", back_populates="reviewed_by_official", lazy="selectin")
