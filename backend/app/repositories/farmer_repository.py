"""
KRISHISEVA — Farmer Repository.

DB access for farmer records. Includes Aadhaar-hash lookup for OTP auth.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.farmer import Farmer
from app.repositories.base_repository import BaseRepository


class FarmerRepository(BaseRepository[Farmer]):
    def __init__(self, db: AsyncSession):
        super().__init__(Farmer, db)

    async def get_by_aadhaar_hash(self, aadhaar_hash: str) -> Optional[Farmer]:
        """Find a farmer by their Aadhaar hash (used during OTP login)."""
        query = (
            self._base_query()
            .where(Farmer.aadhaar_hash == aadhaar_hash)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Optional[Farmer]:
        """Find a farmer by phone number."""
        query = self._base_query().where(Farmer.phone == phone)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_land(self, farmer_id: uuid.UUID) -> Optional[Farmer]:
        """Get farmer with eagerly-loaded land registry records."""
        query = (
            self._base_query()
            .where(Farmer.id == farmer_id)
            .options(selectinload(Farmer.land_registries))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_village(
        self, village_id: uuid.UUID, page: int = 1, per_page: int = 20
    ) -> tuple[Sequence[Farmer], int]:
        """Get all farmers in a village, paginated."""
        return await self.get_all(
            page=page, per_page=per_page, filters={"village_id": village_id}
        )

    async def mark_verified(self, farmer_id: uuid.UUID) -> Optional[Farmer]:
        """Mark a farmer as Aadhaar-verified after successful OTP."""
        return await self.update_fields(farmer_id, is_verified=True)
