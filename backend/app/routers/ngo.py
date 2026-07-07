"""
KRISHISEVA — NGO Router.

API endpoints for NGOs to view pending farmers, submit field verification evidence, and retrieve upload history.
"""

import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_ngo
from app.exceptions import ClaimValidationError
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.ngo import NGOVerificationResponse
from app.schemas.claim import ClaimResponse
from app.services.ngo_service import NGOService

router = APIRouter(dependencies=[Depends(get_current_ngo)])


@router.post("/verifications", response_model=APIResponse[NGOVerificationResponse])
async def submit_verification(
    file: Optional[UploadFile] = File(None),
    claim_id: uuid.UUID = Form(...),
    farmer_id: uuid.UUID = Form(...),
    remarks: Optional[str] = Form(None),
    verification_type: str = Form("field_visit"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_ngo)
):
    """
    NGO uploads field verification evidence (field photo + remarks) for a claim.
    """
    ngo_id = current_user["id"]
    ngo_svc = NGOService(db)
    
    photo_url = None
    
    # Save file if provided
    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in (".jpg", ".jpeg", ".png"):
            raise ClaimValidationError("Invalid photo format — only JPG/PNG allowed")
            
        os.makedirs(settings.upload_dir, exist_ok=True)
        filename = f"ngo_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(settings.upload_dir, filename)
        
        try:
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            photo_url = f"/static/uploads/{filename}"
        except Exception as e:
            raise ClaimValidationError(f"Failed to save verification photo: {str(e)}")

    # Submit verification
    verification = await ngo_svc.submit_verification(
        ngo_id=ngo_id,
        claim_id=claim_id,
        farmer_id=farmer_id,
        photo_url=photo_url,
        remarks=remarks,
        verification_type=verification_type
    )

    return APIResponse.ok(
        data=NGOVerificationResponse.from_orm(verification),
        message="NGO verification evidence submitted successfully"
    )


@router.get("/verifications", response_model=APIResponse[PaginatedResponse[NGOVerificationResponse]])
async def list_verifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_ngo)
):
    """List all verification evidence uploaded by the current NGO, paginated."""
    ngo_id = current_user["id"]
    ngo_svc = NGOService(db)
    items, total = await ngo_svc.get_ngo_verifications(ngo_id, page, per_page)
    mapped_items = [NGOVerificationResponse.from_orm(item) for item in items]
    
    return APIResponse.ok(
        data=PaginatedResponse.create(
            items=mapped_items,
            total=total,
            page=page,
            per_page=per_page
        ),
        message="Verification uploads history retrieved"
    )


@router.get("/dashboard", response_model=APIResponse[PaginatedResponse[ClaimResponse]])
async def get_ngo_dashboard(
    village_id: uuid.UUID = Query(..., description="Village ID to filter pending claims"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """NGO dashboard lists all pending claims (filed state) in a village that require verification."""
    ngo_svc = NGOService(db)
    items, total = await ngo_svc.get_pending_farmers(village_id, page, per_page)
    mapped_items = [ClaimResponse.from_orm(item) for item in items]
    
    return APIResponse.ok(
        data=PaginatedResponse.create(
            items=mapped_items,
            total=total,
            page=page,
            per_page=per_page
        ),
        message="Pending village claims for verification retrieved successfully"
    )
