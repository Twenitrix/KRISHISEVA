"""
KRISHISEVA — Reference Data Router.

API endpoints to retrieve read-only lookup table data: villages, crop insured sums,
past events, past beneficiaries, and land registries.
"""

from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.land_registry_repository import LandRegistryRepository
from app.repositories.reference_data_repository import (
    VillageRepository,
    CropInsuredSumRepository,
    PastEventRepository,
    PastBeneficiaryRepository,
)
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.farmer import LandRegistryResponse
from app.schemas.reference_data import (
    VillageResponse,
    CropInsuredSumResponse,
    PastEventResponse,
    PastBeneficiaryResponse,
)

router = APIRouter()


@router.get("/villages/{id}", response_model=APIResponse[VillageResponse])
async def get_village(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details for a single village by ID."""
    repo = VillageRepository(db)
    from app.exceptions import NotFoundError
    item = await repo.get_by_id(id)
    if not item:
        raise NotFoundError("Village", str(id))
    return APIResponse.ok(data=VillageResponse.from_orm(item), message="Village retrieved successfully")


@router.get("/land-registries", response_model=APIResponse[PaginatedResponse[LandRegistryResponse]])
async def list_land_registries(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    farmer_id: Optional[uuid.UUID] = None,
    village_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all land registries, optionally filtered by farmer or village."""
    repo = LandRegistryRepository(db)
    filters = {}
    if farmer_id:
        filters["farmer_id"] = farmer_id
    if village_id:
        filters["village_id"] = village_id

    items, total = await repo.get_all(page=page, per_page=per_page, filters=filters)
    mapped_items = [LandRegistryResponse.from_orm(item) for item in items]

    return APIResponse.ok(
        data=PaginatedResponse.create(
            items=mapped_items,
            total=total,
            page=page,
            per_page=per_page
        ),
        message="Land registries list retrieved successfully"
    )


@router.get("/crop-insured-sums", response_model=APIResponse[list[CropInsuredSumResponse]])
async def list_crop_insured_sums(
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the complete crop insured sum pricing lookup table."""
    repo = CropInsuredSumRepository(db)
    items = await repo.get_all_crops()
    mapped_items = [CropInsuredSumResponse.from_orm(item) for item in items]
    return APIResponse.ok(data=mapped_items, message="Crop insured sums pricing list retrieved")


@router.get("/past-events", response_model=APIResponse[list[PastEventResponse]])
async def list_past_events(
    village_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve past disaster events, optionally filtered by village."""
    repo = PastEventRepository(db)
    if village_id:
        items = await repo.get_by_village(village_id)
    else:
        # Fetch all events (max 100)
        items, _ = await repo.get_all(page=1, per_page=100)
    
    mapped_items = [PastEventResponse.from_orm(item) for item in items]
    return APIResponse.ok(data=mapped_items, message="Past disaster events retrieved")


@router.get("/past-beneficiaries", response_model=APIResponse[list[PastBeneficiaryResponse]])
async def list_past_beneficiaries(
    farmer_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve past payout history records, optionally filtered by farmer."""
    repo = PastBeneficiaryRepository(db)
    if farmer_id:
        items = await repo.get_by_farmer(farmer_id)
    else:
        items, _ = await repo.get_all(page=1, per_page=100)
        
    mapped_items = [PastBeneficiaryResponse.from_orm(item) for item in items]
    return APIResponse.ok(data=mapped_items, message="Past beneficiary payouts retrieved")
