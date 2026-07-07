"""
KRISHISEVA — Crop Insured Sum Model.

Lookup table mapping crop names to their insured sum per hectare.
Used for payout calculation: insured_sum × damage_percentage.
"""

from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class CropInsuredSum(BaseModel):
    __tablename__ = "crop_insured_sums"

    crop_name: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True,
        comment="Crop name matching land_registries.crop_on_record"
    )
    insured_sum_per_hectare: Mapped[float] = mapped_column(
        Float, nullable=False,
        comment="Insurance sum in INR per hectare for this crop"
    )
    season: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="Kharif / Rabi / Zaid"
    )
    year: Mapped[int] = mapped_column(
        Integer, nullable=False,
        comment="Policy year"
    )
