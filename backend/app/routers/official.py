"""
KRISHISEVA — Official Router.

API endpoints for government officials to view dashboards, statistics, and list village claims.
"""

from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_official
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.claim import ClaimResponse
from app.schemas.official import OfficialDashboardResponse
from app.services.official_service import OfficialService
from app.services.claim_service import ClaimService

router = APIRouter(dependencies=[Depends(get_current_official)])


@router.get("/dashboard", response_model=APIResponse[OfficialDashboardResponse])
async def get_official_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_official)
):
    """Retrieve official's village dashboard containing statistics and designations."""
    official_id = current_user["id"]
    service = OfficialService(db)
    result = await service.get_dashboard(official_id)
    return APIResponse.ok(data=result, message="Official dashboard statistics loaded")


@router.get("/claims", response_model=APIResponse[PaginatedResponse[ClaimResponse]])
async def list_village_claims(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_official)
):
    """List all claims for the official's assigned village, paginated and filterable by status."""
    official = current_user["user"]
    claim_svc = ClaimService(db)

    filters = {}
    if official.assigned_village_id:
        filters["village_id"] = official.assigned_village_id
    if status:
        filters["status"] = status

    items, total = await claim_svc.claim_repo.get_all(page=page, per_page=per_page, filters=filters)
    mapped_items = [ClaimResponse.from_orm(item) for item in items]

    return APIResponse.ok(
        data=PaginatedResponse.create(
            items=mapped_items,
            total=total,
            page=page,
            per_page=per_page
        ),
        message="Village claims list retrieved successfully"
    )


@router.get("/statistics", response_model=APIResponse[dict])
async def get_village_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_official)
):
    """Retrieve detailed aggregate payout and status count statistics for the official's village."""
    official = current_user["user"]
    claim_svc = ClaimService(db)

    if not official.assigned_village_id:
        return APIResponse.ok(
            data={"total_claims": 0, "by_status": {}, "total_suggested_payout": 0, "total_approved_payout": 0},
            message="No village assigned"
        )

    stats = await claim_svc.claim_repo.get_village_statistics(official.assigned_village_id)
    return APIResponse.ok(data=stats, message="Village claims statistics loaded")
