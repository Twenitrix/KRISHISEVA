"""
KRISHISEVA — Reference Data Schemas.

Pydantic validation schemas for seeded village, crop, event, and past payout records.
"""

import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class VillageResponse(BaseModel):
    id: uuid.UUID
    name: str
    district: str
    state: str
    taluka: str
    latitude: float
    longitude: float
    created_at: datetime

    class Config:
        from_attributes = True


class CropInsuredSumResponse(BaseModel):
    id: uuid.UUID
    crop_name: str
    insured_sum_per_hectare: float
    season: str
    year: int

    class Config:
        from_attributes = True


class PastEventResponse(BaseModel):
    id: uuid.UUID
    village_id: uuid.UUID
    event_type: str
    event_date: date
    severity: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PastBeneficiaryResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    event_id: uuid.UUID
    claim_amount: float
    payout_amount: float
    payout_date: date

    class Config:
        from_attributes = True
