"""
KRISHISEVA — Official Service.

Dashboard data aggregation and claim review for government officials.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import AuthorizationError, NotFoundError
from app.repositories.claim_repository import ClaimRepository
from app.repositories.official_repository import OfficialRepository
from app.repositories.reference_data_repository import VillageRepository
from app.services.claim_service import ClaimService


class OfficialService:
    """Business logic for government official operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.official_repo = OfficialRepository(db)
        self.claim_repo = ClaimRepository(db)
        self.village_repo = VillageRepository(db)
        self.claim_svc = ClaimService(db)

    async def get_dashboard(self, official_id: uuid.UUID) -> dict:
        """Build the village-level dashboard for an official."""
        official = await self.official_repo.get_by_id(official_id)
        if not official:
            raise NotFoundError("Official", str(official_id))

        if not official.assigned_village_id:
            raise AuthorizationError("No village assigned to this official")

        village = await self.village_repo.get_by_id(official.assigned_village_id)
        statistics = await self.claim_repo.get_village_statistics(
            official.assigned_village_id
        )

        return {
            "official": {
                "id": str(official.id),
                "name": official.name,
                "designation": official.designation,
            },
            "village": {
                "id": str(village.id) if village else None,
                "name": village.name if village else None,
                "district": village.district if village else None,
                "state": village.state if village else None,
            },
            "statistics": statistics,
        }

    async def review_claim(
        self,
        claim_id: uuid.UUID,
        official_id: uuid.UUID,
        decision: str,
        approved_amount: float | None = None,
        remarks: str | None = None,
    ) -> dict:
        """Official reviews a claim — approve/adjust/deny."""
        # Verify the official exists and is active
        official = await self.official_repo.get_by_id(official_id)
        if not official:
            raise NotFoundError("Official", str(official_id))
        if not official.is_active:
            raise AuthorizationError("Official account is inactive")

        # Delegate to claim service
        claim = await self.claim_svc.official_review(
            claim_id=claim_id,
            official_id=official_id,
            decision=decision,
            approved_amount=approved_amount,
            remarks=remarks,
        )

        return {
            "claim_id": str(claim.id),
            "status": claim.status.value,
            "official_approved_amount": claim.official_approved_amount,
            "official_remarks": claim.official_remarks,
        }
