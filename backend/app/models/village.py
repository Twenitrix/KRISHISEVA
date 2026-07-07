"""
KRISHISEVA — Village Model.

Represents a single village unit. MVP is scoped to one village.
"""

from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Village(BaseModel):
    __tablename__ = "villages"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    district: Mapped[str] = mapped_column(String(200), nullable=False)
    state: Mapped[str] = mapped_column(String(200), nullable=False)
    taluka: Mapped[str] = mapped_column(String(200), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)

    # Relationships
    farmers = relationship("Farmer", back_populates="village", lazy="selectin")
    land_registries = relationship("LandRegistry", back_populates="village", lazy="selectin")
    past_events = relationship("PastEvent", back_populates="village", lazy="selectin")
    claims = relationship("Claim", back_populates="village", lazy="selectin")
    officials = relationship("Official", back_populates="assigned_village", lazy="selectin")
