"""
KRISHISEVA — Farmer Schemas.

Pydantic validation schemas for farmer entities.
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FarmerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=10, max_length=15)
    bank_account_number: Optional[str] = Field(None, max_length=20)
    bank_ifsc: Optional[str] = Field(None, max_length=11)


class FarmerCreate(FarmerBase):
    village_id: uuid.UUID
    aadhaar_number: str = Field(..., min_length=12, max_length=12)


class FarmerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    bank_account_number: Optional[str] = Field(None, max_length=20)
    bank_ifsc: Optional[str] = Field(None, max_length=11)


class FarmerResponse(FarmerBase):
    id: uuid.UUID
    village_id: uuid.UUID
    aadhaar_masked: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
        
class LandRegistryResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    village_id: uuid.UUID
    survey_number: str
    area_hectares: float
    crop_on_record: str
    latitude: float
    longitude: float
    polygon_coords: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
