"""
KRISHISEVA — Reference Data Repository.

DB access for seeded reference data: villages, crop insured sums,
past events, past beneficiaries. These are read-only in the MVP.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crop_insured_sum import CropInsuredSum
from app.models.past_beneficiary import PastBeneficiary
from app.models.past_event import PastEvent
from app.models.village import Village
from app.repositories.base_repository import BaseRepository


class VillageRepository(BaseRepository[Village]):
    def __init__(self, db: AsyncSession):
        super().__init__(Village, db)

    async def get_by_name(self, name: str) -> Optional[Village]:
        """Find a village by name."""
        query = self._base_query().where(Village.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class CropInsuredSumRepository(BaseRepository[CropInsuredSum]):
    def __init__(self, db: AsyncSession):
        super().__init__(CropInsuredSum, db)

    async def get_by_crop_name(self, crop_name: str) -> Optional[CropInsuredSum]:
        """Find the insured sum for a specific crop."""
        query = self._base_query().where(CropInsuredSum.crop_name == crop_name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_crops(self) -> Sequence[CropInsuredSum]:
        """Get the full crop insured sum lookup table."""
        query = self._base_query().order_by(CropInsuredSum.crop_name)
        result = await self.db.execute(query)
        return result.scalars().all()


class PastEventRepository(BaseRepository[PastEvent]):
    def __init__(self, db: AsyncSession):
        super().__init__(PastEvent, db)

    async def get_by_village(
        self, village_id: uuid.UUID
    ) -> Sequence[PastEvent]:
        """Get all past events for a village, ordered by date desc."""
        query = (
            self._base_query()
            .where(PastEvent.village_id == village_id)
            .order_by(PastEvent.event_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class PastBeneficiaryRepository(BaseRepository[PastBeneficiary]):
    def __init__(self, db: AsyncSession):
        super().__init__(PastBeneficiary, db)

    async def get_by_farmer(
        self, farmer_id: uuid.UUID
    ) -> Sequence[PastBeneficiary]:
        """Get all past payouts received by a farmer (for duplicate check)."""
        query = (
            self._base_query()
            .where(PastBeneficiary.farmer_id == farmer_id)
            .order_by(PastBeneficiary.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_by_farmer(self, farmer_id: uuid.UUID) -> int:
        """Count how many times a farmer received past payouts."""
        from sqlalchemy import func
        query = select(func.count()).where(
            PastBeneficiary.farmer_id == farmer_id,
            PastBeneficiary.is_deleted == False,  # noqa: E712
        )
        result = await self.db.execute(query)
        return result.scalar() or 0
