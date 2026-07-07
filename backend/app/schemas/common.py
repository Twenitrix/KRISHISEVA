"""
KRISHISEVA — Common Pydantic Schemas.

Standard response wrappers used by ALL endpoints.
Every API response uses APIResponse or PaginatedResponse — no exceptions.
"""

from datetime import datetime, timezone
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standard API response envelope.

    Success: { "success": true, "data": {...}, "message": "...", "timestamp": "..." }
    Error:   { "success": false, "error": "CODE", "message": "...", "timestamp": "..." }
    """

    success: bool = True
    data: Optional[T] = None
    message: str = ""
    error: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @classmethod
    def ok(cls, data: Any = None, message: str = "Success") -> "APIResponse":
        """Create a success response."""
        return cls(success=True, data=data, message=message)

    @classmethod
    def fail(cls, message: str, error_code: str = "ERROR") -> "APIResponse":
        """Create an error response."""
        return cls(success=False, message=message, error=error_code)


class PaginationMeta(BaseModel):
    """Pagination metadata included in paginated responses."""

    total: int = 0
    page: int = 1
    per_page: int = 20
    pages: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Paginated response wrapper.

    Format: { "items": [...], "total": N, "page": 1, "per_page": 20, "pages": N }
    Always wrapped inside APIResponse.data.
    """

    items: List[T] = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    pages: int = 0

    @classmethod
    def create(
        cls,
        items: List[Any],
        total: int,
        page: int = 1,
        per_page: int = 20,
    ) -> "PaginatedResponse":
        """Build paginated response with computed page count."""
        pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        )
