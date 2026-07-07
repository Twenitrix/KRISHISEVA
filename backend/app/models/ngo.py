"""
KRISHISEVA — NGO Model.

NGOs self-register with license number and use email/password auth.
They upload supporting evidence for specific farmers' claims.
"""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class NGO(BaseModel):
    __tablename__ = "ngos"

    name: Mapped[str] = mapped_column(String(300), nullable=False)
    license_number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    contact_person: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    verifications = relationship("NGOVerification", back_populates="ngo", lazy="selectin")
