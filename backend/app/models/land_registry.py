"""
KRISHISEVA — Land Registry Model.

Reference data linking a farmer to their registered land parcel.
Includes coordinates for GPS match verification and the crop on record.
"""

import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class LandRegistry(BaseModel):
    __tablename__ = "land_registries"

    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False
    )
    village_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False
    )
    survey_number: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True,
        comment="Government land survey number"
    )
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    crop_on_record: Mapped[str] = mapped_column(
        String(100), nullable=False,
        comment="Crop type registered for this land parcel"
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    polygon_coords: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        comment="GeoJSON polygon coordinates of the land boundary"
    )

    # Relationships
    farmer = relationship("Farmer", back_populates="land_registries")
    village = relationship("Village", back_populates="land_registries")
    claims = relationship("Claim", back_populates="land_registry", lazy="selectin")
