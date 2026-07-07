"""
KRISHISEVA — Auth Schemas.

Request/response schemas for all auth endpoints.
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Farmer Auth (OTP-based) ──

class FarmerOTPRequest(BaseModel):
    """Farmer requests OTP by providing Aadhaar number."""
    aadhaar_number: str = Field(
        ..., min_length=12, max_length=12,
        description="12-digit Aadhaar number",
        examples=["123456789012"],
    )


class FarmerOTPResponse(BaseModel):
    """Response after OTP is sent (mocked)."""
    message: str = "OTP sent successfully"
    otp_sent_to: str = Field(
        description="Masked phone number OTP was sent to",
        examples=["XXXX-XXX-1234"],
    )
    # In dev/mock mode, we include the OTP for testing
    mock_otp: Optional[str] = Field(
        None, description="Mock OTP (only in dev mode)"
    )


class FarmerOTPVerify(BaseModel):
    """Farmer verifies OTP to get JWT tokens."""
    aadhaar_number: str = Field(
        ..., min_length=12, max_length=12,
        description="12-digit Aadhaar number",
    )
    otp: str = Field(
        ..., min_length=6, max_length=6,
        description="6-digit OTP",
        examples=["123456"],
    )


# ── NGO Auth (email/password) ──

class NGORegisterRequest(BaseModel):
    """NGO self-registration."""
    name: str = Field(..., min_length=2, max_length=300)
    license_number: str = Field(..., min_length=2, max_length=100)
    contact_person: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=10, max_length=15)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class NGOLoginRequest(BaseModel):
    """NGO login with email and password."""
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1)


# ── Official Auth (email/password) ──

class OfficialLoginRequest(BaseModel):
    """Official login with email and password."""
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1)


# ── Common Auth Response ──

class TokenResponse(BaseModel):
    """JWT token pair returned on successful auth."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Access token TTL in seconds")
    role: str = Field(description="User role: farmer / ngo / official")
    user_id: str


class RefreshRequest(BaseModel):
    """Request to refresh an access token."""
    refresh_token: str


class UserProfileResponse(BaseModel):
    """Response for /auth/me endpoint."""
    id: str
    role: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    is_verified: Optional[bool] = None
    designation: Optional[str] = None
