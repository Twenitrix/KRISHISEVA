"""
KRISHISEVA — Land Registry Repository.

DB access for land parcel records. Used for GPS coordinate matching.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.land_registry import LandRegistry
from app.repositories.base_repository import BaseRepository


class LandRegistryRepository(BaseRepository[LandRegistry]):
    def __init__(self, db: AsyncSession):
        super().__init__(LandRegistry, db)

    async def get_by_farmer(self, farmer_id: uuid.UUID) -> Sequence[LandRegistry]:
        """Get all land parcels registered to a farmer."""
        query = (
            self._base_query()
            .where(LandRegistry.farmer_id == farmer_id)
            .order_by(LandRegistry.survey_number)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_survey_number(self, survey_number: str) -> Optional[LandRegistry]:
        """Find a land parcel by its government survey number."""
        query = self._base_query().where(LandRegistry.survey_number == survey_number)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_village(
        self, village_id: uuid.UUID, page: int = 1, per_page: int = 20
    ) -> tuple[Sequence[LandRegistry], int]:
        """Get all land registries in a village, paginated."""
        return await self.get_all(
            page=page, per_page=per_page, filters={"village_id": village_id}
        )
