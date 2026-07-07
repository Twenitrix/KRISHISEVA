"""
KRISHISEVA — Official Schemas.

Pydantic validation schemas for official profiles and dashboard statistics.
"""

import uuid
from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel


class OfficialResponse(BaseModel):
    id: uuid.UUID
    name: str
    designation: str
    email: str
    phone: str
    assigned_village_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OfficialDashboardResponse(BaseModel):
    official: dict
    village: dict
    statistics: dict
