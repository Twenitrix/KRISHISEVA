"""
KRISHISEVA — Claim Repository.

DB access for claims. Supports status-filtered queries, per-farmer queries,
and village-level aggregations for the official dashboard.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.claim import Claim, ClaimStatus
from app.repositories.base_repository import BaseRepository


class ClaimRepository(BaseRepository[Claim]):
    def __init__(self, db: AsyncSession):
        super().__init__(Claim, db)

    async def get_by_farmer(
        self, farmer_id: uuid.UUID, page: int = 1, per_page: int = 20
    ) -> tuple[Sequence[Claim], int]:
        """Get all claims for a specific farmer, paginated."""
        return await self.get_all(
            page=page, per_page=per_page, filters={"farmer_id": farmer_id}
        )

    async def get_by_village(
        self,
        village_id: uuid.UUID,
        status: Optional[ClaimStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[Sequence[Claim], int]:
        """Get all claims in a village, optionally filtered by status."""
        filters = {"village_id": village_id}
        if status:
            filters["status"] = status
        return await self.get_all(page=page, per_page=per_page, filters=filters)

    async def get_with_details(self, claim_id: uuid.UUID) -> Optional[Claim]:
        """Get a claim with all relationships eagerly loaded."""
        query = (
            self._base_query()
            .where(Claim.id == claim_id)
            .options(
                selectinload(Claim.farmer),
                selectinload(Claim.land_registry),
                selectinload(Claim.village),
                selectinload(Claim.ngo_verifications),
                selectinload(Claim.status_logs),
                selectinload(Claim.reviewed_by_official),
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_village_statistics(self, village_id: uuid.UUID) -> dict:
        """Aggregate statistics for the official dashboard."""
        base = select(Claim).where(
            Claim.village_id == village_id,
            Claim.is_deleted == False,  # noqa: E712
        )

        # Total claims
        total_result = await self.db.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = total_result.scalar() or 0

        # By status
        status_counts = {}
        for status in ClaimStatus:
            count_q = select(func.count()).select_from(
                base.where(Claim.status == status).subquery()
            )
            result = await self.db.execute(count_q)
            status_counts[status.value] = result.scalar() or 0

        # Total suggested payout
        payout_q = select(func.sum(Claim.suggested_payout_amount)).where(
            Claim.village_id == village_id,
            Claim.is_deleted == False,  # noqa: E712
            Claim.suggested_payout_amount.isnot(None),
        )
        payout_result = await self.db.execute(payout_q)
        total_suggested = payout_result.scalar() or 0.0

        # Total approved payout
        approved_q = select(func.sum(Claim.official_approved_amount)).where(
            Claim.village_id == village_id,
            Claim.is_deleted == False,  # noqa: E712
            Claim.official_approved_amount.isnot(None),
        )
        approved_result = await self.db.execute(approved_q)
        total_approved = approved_result.scalar() or 0.0

        return {
            "total_claims": total,
            "by_status": status_counts,
            "total_suggested_payout": total_suggested,
            "total_approved_payout": total_approved,
        }

    async def check_duplicate(
        self, farmer_id: uuid.UUID, land_registry_id: uuid.UUID
    ) -> bool:
        """Check if a farmer has an active (non-denied) claim on this land parcel."""
        query = (
            self._base_query()
            .where(
                Claim.farmer_id == farmer_id,
                Claim.land_registry_id == land_registry_id,
                Claim.status.notin_([ClaimStatus.DENIED, ClaimStatus.PAYOUT]),
            )
        )
        result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        count = result.scalar() or 0
        return count > 0
