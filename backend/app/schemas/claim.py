"""
KRISHISEVA — Claim Schemas.

Pydantic validation schemas for claim submissions, dashboard views, and reports.
"""

import uuid
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class ClaimCreateForm(BaseModel):
    """Schema for claim creation request body."""
    land_registry_id: uuid.UUID
    claimed_event_type: str = Field(..., description="flood/drought/hailstorm/famine")
    claimed_event_date: str = Field(..., description="Date of the event in YYYY-MM-DD format")
    description: Optional[str] = None


class ClaimReviewRequest(BaseModel):
    """Schema for government official claim review decision."""
    decision: str = Field(..., description="approved / denied")
    approved_amount: Optional[float] = Field(None, description="Official override payout amount")
    remarks: Optional[str] = Field(None, max_length=1000, description="Review notes")


class ClaimResponse(BaseModel):
    id: uuid.UUID
    farmer_id: uuid.UUID
    land_registry_id: uuid.UUID
    village_id: uuid.UUID
    photo_url: str
    photo_latitude: Optional[float] = None
    photo_longitude: Optional[float] = None
    photo_timestamp: Optional[datetime] = None
    claimed_event_type: str
    claimed_event_date: str
    description: Optional[str] = None
    ai_identified_crop: Optional[str] = None
    ai_damage_percentage: Optional[float] = None
    ai_crop_matches_record: Optional[bool] = None
    ai_call_status: Optional[str] = None
    gps_match_score: Optional[float] = None
    land_match_score: Optional[float] = None
    duplicate_check_result: Optional[str] = None
    overall_score: Optional[float] = None
    suggested_payout_amount: Optional[float] = None
    official_approved_amount: Optional[float] = None
    status: str
    reviewed_by_official_id: Optional[uuid.UUID] = None
    official_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClaimStatusLogResponse(BaseModel):
    id: uuid.UUID
    claim_id: uuid.UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by_role: str
    changed_by_id: Optional[uuid.UUID] = None
    remarks: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
