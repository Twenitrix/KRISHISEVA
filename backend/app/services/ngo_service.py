"""
KRISHISEVA — NGO Service.

Handles NGO registration and verification uploads.
"""

import uuid
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import DuplicateError, NotFoundError
from app.models.ngo import NGO
from app.models.ngo_verification import NGOVerification
from app.repositories.claim_repository import ClaimRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.ngo_repository import NGORepository, NGOVerificationRepository


class NGOService:
    """Business logic for NGO operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ngo_repo = NGORepository(db)
        self.verification_repo = NGOVerificationRepository(db)
        self.farmer_repo = FarmerRepository(db)
        self.claim_repo = ClaimRepository(db)

    async def register_ngo(
        self,
        name: str,
        license_number: str,
        contact_person: str,
        phone: str,
        email: str,
        hashed_password: str,
    ) -> NGO:
        """Register a new NGO after checking for duplicates."""
        # Check email uniqueness
        existing = await self.ngo_repo.get_by_email(email)
        if existing:
            raise DuplicateError("NGO", "email")

        # Check license uniqueness
        existing = await self.ngo_repo.get_by_license(license_number)
        if existing:
            raise DuplicateError("NGO", "license number")

        ngo = NGO(
            name=name,
            license_number=license_number,
            contact_person=contact_person,
            phone=phone,
            email=email,
            hashed_password=hashed_password,
        )
        return await self.ngo_repo.create(ngo)

    async def submit_verification(
        self,
        ngo_id: uuid.UUID,
        claim_id: uuid.UUID,
        farmer_id: uuid.UUID,
        photo_url: str | None = None,
        remarks: str | None = None,
        verification_type: str = "field_visit",
    ) -> NGOVerification:
        """NGO uploads supporting evidence for a farmer's claim."""
        # Validate claim exists
        claim = await self.claim_repo.get_by_id(claim_id)
        if not claim:
            raise NotFoundError("Claim", str(claim_id))

        # Validate farmer exists
        farmer = await self.farmer_repo.get_by_id(farmer_id)
        if not farmer:
            raise NotFoundError("Farmer", str(farmer_id))

        verification = NGOVerification(
            ngo_id=ngo_id,
            claim_id=claim_id,
            farmer_id=farmer_id,
            photo_url=photo_url,
            remarks=remarks,
            verification_type=verification_type,
        )
        return await self.verification_repo.create(verification)

    async def get_ngo_verifications(
        self, ngo_id: uuid.UUID, page: int = 1, per_page: int = 20
    ) -> tuple[Sequence[NGOVerification], int]:
        """Get all verifications by this NGO, paginated."""
        return await self.verification_repo.get_by_ngo(ngo_id, page, per_page)

    async def get_pending_farmers(
        self, village_id: uuid.UUID, page: int = 1, per_page: int = 20
    ) -> tuple[Sequence, int]:
        """Get farmers with active claims that need NGO verification."""
        from app.models.claim import ClaimStatus
        return await self.claim_repo.get_by_village(
            village_id, status=ClaimStatus.FILED, page=page, per_page=per_page
        )
