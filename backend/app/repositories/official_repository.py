"""
KRISHISEVA — Official Repository.

DB access for government official accounts.
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.official import Official
from app.repositories.base_repository import BaseRepository


class OfficialRepository(BaseRepository[Official]):
    def __init__(self, db: AsyncSession):
        super().__init__(Official, db)

    async def get_by_email(self, email: str) -> Optional[Official]:
        """Find an official by email (for login)."""
        query = self._base_query().where(Official.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
