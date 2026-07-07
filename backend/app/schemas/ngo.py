"""
KRISHISEVA — NGO Schemas.

Pydantic validation schemas for NGO verifications and dashboard.
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NGOVerificationCreateForm(BaseModel):
    claim_id: uuid.UUID
    farmer_id: uuid.UUID
    remarks: Optional[str] = Field(None, max_length=1000)
    verification_type: str = Field("field_visit", description="field_visit / documentary_proof")


class NGOVerificationResponse(BaseModel):
    id: uuid.UUID
    ngo_id: uuid.UUID
    claim_id: uuid.UUID
    farmer_id: uuid.UUID
    photo_url: Optional[str] = None
    remarks: Optional[str] = None
    verification_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NGOResponse(BaseModel):
    id: uuid.UUID
    name: str
    license_number: str
    contact_person: str
    phone: str
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
