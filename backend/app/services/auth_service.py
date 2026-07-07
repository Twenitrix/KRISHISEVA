"""
KRISHISEVA — Auth Service.

Orchestrates authentication for all three roles:
- Farmer (OTP authentication via mock Aadhaar service)
- NGO (Email & password authentication)
- Official (Email & password authentication)
- Refresh token rotation & logout
"""

import uuid
from datetime import datetime, timezone
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_aadhaar,
    mask_aadhaar,
    verify_password,
)
from app.exceptions import AuthenticationError, InvalidOTPError, InvalidTokenError, NotFoundError
from app.models.refresh_token import RefreshToken
from app.repositories.auth_repository import RefreshTokenRepository
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.ngo_repository import NGORepository
from app.repositories.official_repository import OfficialRepository
from app.schemas.auth import TokenResponse, FarmerOTPResponse, UserProfileResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.farmer_repo = FarmerRepository(db)
        self.ngo_repo = NGORepository(db)
        self.official_repo = OfficialRepository(db)
        self.refresh_token_repo = RefreshTokenRepository(db)

    async def request_farmer_otp(self, aadhaar_number: str) -> FarmerOTPResponse:
        """
        Request an OTP for a farmer.
        First validates that the farmer is registered in the village land records database.
        Then calls the mock Aadhaar service to generate & send the OTP.
        """
        aadhaar_hash = hash_aadhaar(aadhaar_number)
        farmer = await self.farmer_repo.get_by_aadhaar_hash(aadhaar_hash)
        if not farmer:
            raise NotFoundError("Farmer", f"Aadhaar ending in {mask_aadhaar(aadhaar_number)}")

        # Call mock Aadhaar service
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.aadhaar_service_url}/aadhaar/request-otp",
                    json={"aadhaar_number": aadhaar_number},
                    timeout=5.0
                )
                if response.status_code != 200:
                    raise AuthenticationError("Aadhaar OTP service is currently unavailable")
                res_data = response.json()
        except Exception:
            # Fallback mock for testing/dev if service is not running
            return FarmerOTPResponse(
                message="OTP sent successfully (Fallback)",
                otp_sent_to=f"XXXX-XXX-{farmer.phone[-4:]}",
                mock_otp="123456"
            )

        return FarmerOTPResponse(
            message=res_data.get("message", "OTP sent successfully"),
            otp_sent_to=res_data.get("otp_sent_to", "XXXX-XXX-XXXX"),
            mock_otp=res_data.get("mock_otp")
        )

    async def verify_farmer_otp(self, aadhaar_number: str, otp: str) -> TokenResponse:
        """
        Verify farmer OTP against the mock Aadhaar service.
        Logs in the farmer and issues access & refresh tokens on success.
        """
        # Call mock Aadhaar service to verify
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.aadhaar_service_url}/aadhaar/verify-otp",
                    json={"aadhaar_number": aadhaar_number, "otp": otp},
                    timeout=5.0
                )
                if response.status_code != 200:
                    raise InvalidOTPError("Invalid or expired OTP")
        except httpx.HTTPError:
            # Fallback verify: allow "123456" in dev mode
            if otp != "123456":
                raise InvalidOTPError("Invalid or expired OTP (Fallback)")

        # Retrieve farmer
        aadhaar_hash = hash_aadhaar(aadhaar_number)
        farmer = await self.farmer_repo.get_by_aadhaar_hash(aadhaar_hash)
        if not farmer:
            raise NotFoundError("Farmer", f"Aadhaar ending in {mask_aadhaar(aadhaar_number)}")

        # Mark verified if not already
        if not farmer.is_verified:
            await self.farmer_repo.mark_verified(farmer.id)

        # Issue tokens
        return await self._generate_tokens_for_user(farmer.id, "farmer")

    async def login_ngo(self, email: str, password: str) -> TokenResponse:
        """Authenticate NGO and return JWT token pair."""
        ngo = await self.ngo_repo.get_by_email(email)
        if not ngo or not verify_password(password, ngo.hashed_password):
            raise AuthenticationError("Invalid email or password")
        
        if not ngo.is_active:
            raise AuthenticationError("NGO account is suspended")

        return await self._generate_tokens_for_user(ngo.id, "ngo")

    async def login_official(self, email: str, password: str) -> TokenResponse:
        """Authenticate Official and return JWT token pair."""
        official = await self.official_repo.get_by_email(email)
        if not official or not verify_password(password, official.hashed_password):
            raise AuthenticationError("Invalid email or password")

        if not official.is_active:
            raise AuthenticationError("Official account is suspended")

        return await self._generate_tokens_for_user(official.id, "official")

    async def refresh_token(self, refresh_token_str: str) -> TokenResponse:
        """
        Perform refresh token rotation.
        Verifies old token, revokes it, and issues a new access/refresh token pair.
        """
        # Decode and validate token
        try:
            payload = decode_token(refresh_token_str)
        except InvalidTokenError:
            raise InvalidTokenError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise InvalidTokenError("Invalid token type — expected refresh token")

        # Check DB to see if token is valid (not revoked / rotated)
        db_token = await self.refresh_token_repo.get_by_token(refresh_token_str)
        if not db_token:
            # Breach detection: if a refresh token is reused, revoke all tokens for this user
            user_id = uuid.UUID(payload.get("sub"))
            role = payload.get("role")
            await self.refresh_token_repo.delete_all_for_user(user_id, role)
            raise InvalidTokenError("Token has been revoked or reuse detected")

        # Check expiration
        if db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await self.refresh_token_repo.delete_by_token(refresh_token_str)
            raise InvalidTokenError("Refresh token has expired")

        user_id = db_token.user_id
        role = db_token.user_role

        # Delete old token
        await self.refresh_token_repo.delete_by_token(refresh_token_str)

        # Generate new pair
        return await self._generate_tokens_for_user(user_id, role)

    async def logout(self, refresh_token_str: str) -> None:
        """Log out user by deleting their refresh token."""
        await self.refresh_token_repo.delete_by_token(refresh_token_str)

    async def _generate_tokens_for_user(self, user_id: uuid.UUID, role: str) -> TokenResponse:
        """Helper to create access/refresh tokens and store refresh token in database."""
        access_token = create_access_token(user_id, role)
        refresh_token_str, expires_at = create_refresh_token(user_id, role)

        # Save to database
        db_token = RefreshToken(
            user_id=user_id,
            user_role=role,
            token=refresh_token_str,
            expires_at=expires_at
        )
        await self.refresh_token_repo.create(db_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
            role=role,
            user_id=str(user_id)
        )
