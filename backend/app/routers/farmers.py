"""
KRISHISEVA — Farmers Router.

API endpoints for looking up farmers, their land registries, and historical claims.
Restricted to NGOs and Government Officials.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.land_registry_repository import LandRegistryRepository
from app.repositories.claim_repository import ClaimRepository
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.farmer import FarmerResponse, LandRegistryResponse
from app.schemas.claim import ClaimResponse

router = APIRouter(dependencies=[Depends(require_role("ngo", "official"))])


@router.get("/", response_model=APIResponse[PaginatedResponse[FarmerResponse]])
async def list_farmers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    village_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """List registered farmers, optionally filtered by village."""
    repo = FarmerRepository(db)

    filters = {}
    if village_id:
        filters["village_id"] = village_id

    items, total = await repo.get_all(page=page, per_page=per_page, filters=filters)
    
    # Map to schema
    mapped_items = [FarmerResponse.from_orm(item) for item in items]
    
    return APIResponse.ok(
        data=PaginatedResponse.create(
            items=mapped_items,
            total=total,
            page=page,
            per_page=per_page
        ),
        message="Farmers list retrieved successfully"
    )


@router.get("/{id}", response_model=APIResponse[FarmerResponse])
async def get_farmer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details for a single farmer by ID."""
    repo = FarmerRepository(db)
    from app.exceptions import NotFoundError
    farmer = await repo.get_by_id(id)
    if not farmer:
        raise NotFoundError("Farmer", str(id))
    return APIResponse.ok(data=FarmerResponse.from_orm(farmer), message="Farmer details retrieved")


@router.get("/{id}/land", response_model=APIResponse[list[LandRegistryResponse]])
async def get_farmer_land(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all land registry records registered to a farmer."""
    repo = LandRegistryRepository(db)
    items = await repo.get_by_farmer(id)
    mapped_items = [LandRegistryResponse.from_orm(item) for item in items]
    return APIResponse.ok(data=mapped_items, message="Farmer land registries retrieved")


@router.get("/{id}/claims", response_model=APIResponse[list[ClaimResponse]])
async def get_farmer_claims(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all claims submitted by a farmer."""
    repo = ClaimRepository(db)
    # Fetch all claims without pagination for simple list
    items, _ = await repo.get_all(page=1, per_page=100, filters={"farmer_id": id})
    mapped_items = [ClaimResponse.from_orm(item) for item in items]
    return APIResponse.ok(data=mapped_items, message="Farmer claims list retrieved")
