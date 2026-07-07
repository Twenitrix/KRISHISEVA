"""
KRISHISEVA — Payout Service.

Calculates the suggested payout amount based on:
  payout = insured_sum_per_hectare × area_hectares × (damage_percentage / 100)

If the AI-identified crop does NOT match the crop on record,
the claim is flagged for manual review and payout is NOT auto-calculated.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ClaimValidationError
from app.repositories.land_registry_repository import LandRegistryRepository
from app.repositories.reference_data_repository import CropInsuredSumRepository


class PayoutService:
    """Calculates differentiated payout based on crop insured sum and damage %."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.land_repo = LandRegistryRepository(db)
        self.crop_repo = CropInsuredSumRepository(db)

    async def calculate_payout(
        self,
        land_registry_id: uuid.UUID,
        ai_identified_crop: str | None,
        ai_damage_percentage: float | None,
        ai_crop_matches_record: bool | None,
    ) -> dict:
        """
        Calculate the suggested payout amount.

        Returns:
            {
                "suggested_payout_amount": float or None,
                "calculation_details": { ... },
                "requires_manual_review": bool,
                "review_reason": str or None,
            }
        """
        land = await self.land_repo.get_by_id(land_registry_id)
        if not land:
            raise ClaimValidationError("Land registry record not found")

        # If AI failed or crop doesn't match, flag for manual review
        if ai_identified_crop is None or ai_damage_percentage is None:
            return {
                "suggested_payout_amount": None,
                "calculation_details": {
                    "crop_on_record": land.crop_on_record,
                    "ai_identified_crop": ai_identified_crop,
                    "ai_damage_percentage": ai_damage_percentage,
                    "area_hectares": land.area_hectares,
                },
                "requires_manual_review": True,
                "review_reason": "AI analysis incomplete — crop identification or damage estimation failed",
            }

        if ai_crop_matches_record is False:
            return {
                "suggested_payout_amount": None,
                "calculation_details": {
                    "crop_on_record": land.crop_on_record,
                    "ai_identified_crop": ai_identified_crop,
                    "ai_damage_percentage": ai_damage_percentage,
                    "area_hectares": land.area_hectares,
                },
                "requires_manual_review": True,
                "review_reason": (
                    f"Crop mismatch: AI identified '{ai_identified_crop}' "
                    f"but land registry shows '{land.crop_on_record}'"
                ),
            }

        # Look up the insured sum for the crop
        crop_sum = await self.crop_repo.get_by_crop_name(land.crop_on_record)
        if not crop_sum:
            return {
                "suggested_payout_amount": None,
                "calculation_details": {
                    "crop_on_record": land.crop_on_record,
                    "ai_identified_crop": ai_identified_crop,
                    "ai_damage_percentage": ai_damage_percentage,
                    "area_hectares": land.area_hectares,
                },
                "requires_manual_review": True,
                "review_reason": f"No insured sum found for crop '{land.crop_on_record}'",
            }

        # Calculate: insured_sum_per_hectare × area × (damage% / 100)
        payout = (
            crop_sum.insured_sum_per_hectare
            * land.area_hectares
            * (ai_damage_percentage / 100.0)
        )

        return {
            "suggested_payout_amount": round(payout, 2),
            "calculation_details": {
                "crop_on_record": land.crop_on_record,
                "ai_identified_crop": ai_identified_crop,
                "insured_sum_per_hectare": crop_sum.insured_sum_per_hectare,
                "area_hectares": land.area_hectares,
                "ai_damage_percentage": ai_damage_percentage,
                "formula": "insured_sum_per_hectare × area_hectares × (damage% / 100)",
                "calculated_payout": round(payout, 2),
            },
            "requires_manual_review": False,
            "review_reason": None,
        }
