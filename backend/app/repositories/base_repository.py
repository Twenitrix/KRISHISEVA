"""
KRISHISEVA — Base Repository.

Generic async CRUD operations for all domain models.
All entity-specific repositories extend this base.

Rules:
- No business logic here — only DB operations.
- All methods are async.
- All queries filter out soft-deleted records by default.
"""

import uuid
from typing import Any, Generic, List, Optional, Sequence, Type, TypeVar

from sqlalchemy import Select, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseRepository(Generic[T]):
    """Generic async repository with CRUD operations and soft-delete support."""

    def __init__(self, model: Type[T], db: AsyncSession):
        self.model = model
        self.db = db

    def _base_query(self) -> Select:
        """Base query that filters out soft-deleted records."""
        return select(self.model).where(self.model.is_deleted == False)  # noqa: E712

    async def get_by_id(self, entity_id: uuid.UUID) -> Optional[T]:
        """Get a single record by ID, excluding soft-deleted."""
        query = self._base_query().where(self.model.id == entity_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        page: int = 1,
        per_page: int = 20,
        filters: Optional[dict] = None,
    ) -> tuple[Sequence[T], int]:
        """
        Get paginated records with optional filters.

        Returns: (items, total_count)
        """
        query = self._base_query()

        # Apply dynamic filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.where(getattr(self.model, field) == value)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page).order_by(self.model.created_at.desc())

        result = await self.db.execute(query)
        items = result.scalars().all()

        return items, total

    async def create(self, entity: T) -> T:
        """Insert a new record."""
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity

    async def update_fields(self, entity_id: uuid.UUID, **kwargs: Any) -> Optional[T]:
        """Update specific fields on a record."""
        stmt = (
            update(self.model)
            .where(self.model.id == entity_id)
            .where(self.model.is_deleted == False)  # noqa: E712
            .values(**kwargs)
        )
        await self.db.execute(stmt)
        await self.db.flush()
        return await self.get_by_id(entity_id)

    async def soft_delete(self, entity_id: uuid.UUID) -> bool:
        """Soft-delete a record by setting is_deleted=True."""
        from datetime import datetime, timezone
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False
        entity.is_deleted = True
        entity.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        return True

    async def exists(self, **kwargs: Any) -> bool:
        """Check if a record matching the given filters exists."""
        query = self._base_query()
        for field, value in kwargs.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)
        result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        count = result.scalar() or 0
        return count > 0
