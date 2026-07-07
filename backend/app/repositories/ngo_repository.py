"""
KRISHISEVA — NGO Repository.

DB access for NGO accounts and their verification submissions.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ngo import NGO
from app.models.ngo_verification import NGOVerification
from app.repositories.base_repository import BaseRepository


class NGORepository(BaseRepository[NGO]):
    def __init__(self, db: AsyncSession):
        super().__init__(NGO, db)

    async def get_by_email(self, email: str) -> Optional[NGO]:
        """Find an NGO by email (for login)."""
        query = self._base_query().where(NGO.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_license(self, license_number: str) -> Optional[NGO]:
        """Find an NGO by license number (for duplicate check)."""
        query = self._base_query().where(NGO.license_number == license_number)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class NGOVerificationRepository(BaseRepository[NGOVerification]):
    def __init__(self, db: AsyncSession):
        super().__init__(NGOVerification, db)

    async def get_by_claim(
        self, claim_id: uuid.UUID
    ) -> Sequence[NGOVerification]:
        """Get all NGO verifications for a specific claim."""
        query = (
            self._base_query()
            .where(NGOVerification.claim_id == claim_id)
            .order_by(NGOVerification.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_ngo(
        self, ngo_id: uuid.UUID, page: int = 1, per_page: int = 20
    ) -> tuple[Sequence[NGOVerification], int]:
        """Get all verifications submitted by a specific NGO, paginated."""
        return await self.get_all(
            page=page, per_page=per_page, filters={"ngo_id": ngo_id}
        )

    async def get_by_farmer(
        self, farmer_id: uuid.UUID
    ) -> Sequence[NGOVerification]:
        """Get all NGO verifications for a specific farmer."""
        query = (
            self._base_query()
            .where(NGOVerification.farmer_id == farmer_id)
            .order_by(NGOVerification.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()
