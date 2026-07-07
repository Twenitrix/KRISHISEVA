"""
KRISHISEVA — Claim Service.

Orchestrates the full claim lifecycle:
1. Farmer submits claim → save + create status log
2. Run VP (AI call + rule engine + payout calc)
3. Update claim with all results
4. Official reviews → approve/adjust/deny

This is the main business logic orchestrator. Calls:
- VerificationService (rule engine)
- PayoutService (payout calculation)
- AI service is called separately from the router (Step 7)
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    ClaimAlreadyReviewedError,
    ClaimValidationError,
    NotFoundError,
)
from app.models.claim import Claim, ClaimStatus
from app.models.claim_status_log import ClaimStatusLog
from app.repositories.auth_repository import ClaimStatusLogRepository
from app.repositories.claim_repository import ClaimRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.land_registry_repository import LandRegistryRepository
from app.services.payout_service import PayoutService
from app.services.verification_service import VerificationService


class ClaimService:
    """Orchestrates the claim lifecycle through the Verification Process."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.claim_repo = ClaimRepository(db)
        self.farmer_repo = FarmerRepository(db)
        self.land_repo = LandRegistryRepository(db)
        self.status_log_repo = ClaimStatusLogRepository(db)
        self.verification_svc = VerificationService(db)
        self.payout_svc = PayoutService(db)

    async def submit_claim(
        self,
        farmer_id: uuid.UUID,
        land_registry_id: uuid.UUID,
        village_id: uuid.UUID,
        photo_url: str,
        photo_latitude: float | None,
        photo_longitude: float | None,
        photo_timestamp: datetime | None,
        claimed_event_type: str,
        claimed_event_date: str,
        description: str | None = None,
    ) -> Claim:
        """
        Step 1: Farmer submits a new claim.
        Validates inputs, creates the claim, logs the status.
        """
        # Validate farmer exists
        farmer = await self.farmer_repo.get_by_id(farmer_id)
        if not farmer:
            raise NotFoundError("Farmer", str(farmer_id))

        # Validate land registry exists and belongs to farmer
        land = await self.land_repo.get_by_id(land_registry_id)
        if not land:
            raise NotFoundError("Land registry", str(land_registry_id))
        if land.farmer_id != farmer_id:
            raise ClaimValidationError("This land parcel is not registered to you")

        # Check for duplicate active claim on same parcel
        has_duplicate = await self.claim_repo.check_duplicate(farmer_id, land_registry_id)
        if has_duplicate:
            raise ClaimValidationError(
                "You already have an active claim on this land parcel"
            )

        # Create the claim
        claim = Claim(
            farmer_id=farmer_id,
            land_registry_id=land_registry_id,
            village_id=village_id,
            photo_url=photo_url,
            photo_latitude=photo_latitude,
            photo_longitude=photo_longitude,
            photo_timestamp=photo_timestamp,
            claimed_event_type=claimed_event_type,
            claimed_event_date=claimed_event_date,
            description=description,
            status=ClaimStatus.FILED,
            ai_call_status="pending",
        )
        claim = await self.claim_repo.create(claim)

        # Log status change
        await self._log_status_change(
            claim_id=claim.id,
            old_status=None,
            new_status=ClaimStatus.FILED.value,
            changed_by_role="farmer",
            changed_by_id=farmer_id,
            remarks="Claim filed by farmer",
        )

        return claim

    async def process_verification(
        self,
        claim_id: uuid.UUID,
        ai_identified_crop: str | None,
        ai_damage_percentage: float | None,
        ai_justification: str | None,
        ai_call_status: str,
    ) -> Claim:
        """
        Step 2: Run the Verification Process after AI call completes.
        Updates the claim with AI results, rule engine scores, and payout.
        """
        claim = await self.claim_repo.get_by_id(claim_id)
        if not claim:
            raise NotFoundError("Claim", str(claim_id))

        land = await self.land_repo.get_by_id(claim.land_registry_id)
        if not land:
            raise NotFoundError("Land registry", str(claim.land_registry_id))

        # Determine crop match
        ai_crop_matches = None
        if ai_identified_crop and land.crop_on_record:
            ai_crop_matches = (
                ai_identified_crop.lower().strip()
                == land.crop_on_record.lower().strip()
            )

        # Run rule engine
        verification = await self.verification_svc.run_verification(
            claim_id=claim_id,
            photo_lat=claim.photo_latitude,
            photo_lon=claim.photo_longitude,
            land_registry_id=claim.land_registry_id,
            farmer_id=claim.farmer_id,
            ai_crop_matches=ai_crop_matches,
        )

        # Calculate payout
        payout = await self.payout_svc.calculate_payout(
            land_registry_id=claim.land_registry_id,
            ai_identified_crop=ai_identified_crop,
            ai_damage_percentage=ai_damage_percentage,
            ai_crop_matches_record=ai_crop_matches,
        )

        # Update claim with all results
        update_data = {
            "ai_identified_crop": ai_identified_crop,
            "ai_damage_percentage": ai_damage_percentage,
            "ai_justification": ai_justification,
            "ai_crop_matches_record": ai_crop_matches,
            "ai_call_status": ai_call_status,
            "gps_match_score": verification["gps_match_score"],
            "land_match_score": verification["land_match_score"],
            "duplicate_check_result": verification["duplicate_check_result"],
            "fraud_flags": verification["fraud_flags"],
            "overall_score": verification["overall_score"],
            "suggested_payout_amount": payout["suggested_payout_amount"],
            "status": ClaimStatus.VERIFIED,
        }
        claim = await self.claim_repo.update_fields(claim_id, **update_data)

        # Log status change
        await self._log_status_change(
            claim_id=claim_id,
            old_status=ClaimStatus.FILED.value,
            new_status=ClaimStatus.VERIFIED.value,
            changed_by_role="system",
            changed_by_id=None,
            remarks=(
                f"Verification complete. Score: {verification['overall_score']}. "
                + (f"Suggested payout: ₹{payout['suggested_payout_amount']}" if payout["suggested_payout_amount"] else "Manual review required")
            ),
        )

        return claim

    async def official_review(
        self,
        claim_id: uuid.UUID,
        official_id: uuid.UUID,
        decision: str,  # "approved" or "denied"
        approved_amount: float | None = None,
        remarks: str | None = None,
    ) -> Claim:
        """
        Step 3: Official reviews and makes final decision.
        """
        claim = await self.claim_repo.get_by_id(claim_id)
        if not claim:
            raise NotFoundError("Claim", str(claim_id))

        if claim.status in (ClaimStatus.APPROVED, ClaimStatus.DENIED, ClaimStatus.PAYOUT):
            raise ClaimAlreadyReviewedError()

        if decision not in ("approved", "denied"):
            raise ClaimValidationError("Decision must be 'approved' or 'denied'")

        old_status = claim.status.value if hasattr(claim.status, "value") else claim.status
        new_status = ClaimStatus.APPROVED if decision == "approved" else ClaimStatus.DENIED

        update_data: dict[str, Any] = {
            "status": new_status,
            "reviewed_by_official_id": official_id,
            "official_remarks": remarks,
        }

        if decision == "approved":
            # Official can override the suggested amount
            if approved_amount is not None:
                update_data["official_approved_amount"] = approved_amount
            elif claim.suggested_payout_amount is not None:
                update_data["official_approved_amount"] = claim.suggested_payout_amount

        claim = await self.claim_repo.update_fields(claim_id, **update_data)

        await self._log_status_change(
            claim_id=claim_id,
            old_status=old_status,
            new_status=new_status.value,
            changed_by_role="official",
            changed_by_id=official_id,
            remarks=remarks or f"Claim {decision} by official",
        )

        return claim

    async def get_claim_report(self, claim_id: uuid.UUID) -> dict:
        """Build the full verification report for a claim."""
        claim = await self.claim_repo.get_with_details(claim_id)
        if not claim:
            raise NotFoundError("Claim", str(claim_id))

        status_logs = await self.status_log_repo.get_by_claim(claim_id)

        return {
            "claim_id": str(claim.id),
            "farmer_name": claim.farmer.name if claim.farmer else None,
            "village_name": claim.village.name if claim.village else None,
            "status": claim.status.value if hasattr(claim.status, "value") else claim.status,
            "submission": {
                "photo_url": claim.photo_url,
                "photo_latitude": claim.photo_latitude,
                "photo_longitude": claim.photo_longitude,
                "photo_timestamp": claim.photo_timestamp.isoformat() if claim.photo_timestamp else None,
                "claimed_event_type": claim.claimed_event_type,
                "claimed_event_date": claim.claimed_event_date,
                "description": claim.description,
            },
            "ai_analysis": {
                "identified_crop": claim.ai_identified_crop,
                "damage_percentage": claim.ai_damage_percentage,
                "justification": claim.ai_justification,
                "crop_matches_record": claim.ai_crop_matches_record,
                "call_status": claim.ai_call_status,
            },
            "rule_engine": {
                "gps_match_score": claim.gps_match_score,
                "land_match_score": claim.land_match_score,
                "duplicate_check_result": claim.duplicate_check_result,
                "fraud_flags": claim.fraud_flags or [],
                "overall_score": claim.overall_score,
            },
            "payout": {
                "suggested_amount": claim.suggested_payout_amount,
                "approved_amount": claim.official_approved_amount,
            },
            "review": {
                "reviewed_by": claim.reviewed_by_official.name if claim.reviewed_by_official else None,
                "official_remarks": claim.official_remarks,
            },
            "ngo_verifications": [
                {
                    "ngo_id": str(v.ngo_id),
                    "photo_url": v.photo_url,
                    "remarks": v.remarks,
                    "type": v.verification_type,
                    "date": v.created_at.isoformat(),
                }
                for v in (claim.ngo_verifications or [])
            ],
            "status_history": [
                {
                    "old_status": log.old_status,
                    "new_status": log.new_status,
                    "changed_by": log.changed_by_role,
                    "remarks": log.remarks,
                    "timestamp": log.timestamp.isoformat(),
                }
                for log in status_logs
            ],
        }

    async def _log_status_change(
        self,
        claim_id: uuid.UUID,
        old_status: str | None,
        new_status: str,
        changed_by_role: str,
        changed_by_id: uuid.UUID | None,
        remarks: str | None = None,
    ) -> ClaimStatusLog:
        """Create an immutable status log entry."""
        log = ClaimStatusLog(
            claim_id=claim_id,
            old_status=old_status,
            new_status=new_status,
            changed_by_role=changed_by_role,
            changed_by_id=changed_by_id,
            remarks=remarks,
        )
        return await self.status_log_repo.create(log)
