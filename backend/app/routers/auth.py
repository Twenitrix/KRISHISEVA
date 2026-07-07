"""
KRISHISEVA — Auth Router.

Defines HTTP routes for login, registration, OTP checks, JWT refresh, and profile endpoints.
"""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.schemas.common import APIResponse
from app.schemas.auth import (
    FarmerOTPRequest,
    FarmerOTPVerify,
    FarmerOTPResponse,
    NGORegisterRequest,
    NGOLoginRequest,
    OfficialLoginRequest,
    RefreshRequest,
    TokenResponse,
    UserProfileResponse,
)
from app.services.auth_service import AuthService
from app.services.ngo_service import NGOService


router = APIRouter()


@router.post("/farmer/request-otp", response_model=APIResponse[FarmerOTPResponse])

async def farmer_request_otp(
    payload: FarmerOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """Farmer requests Aadhaar verification OTP."""
    service = AuthService(db)
    result = await service.request_farmer_otp(payload.aadhaar_number)
    return APIResponse.ok(data=result, message="OTP sent successfully")


@router.post("/farmer/verify-otp", response_model=APIResponse[TokenResponse])

async def farmer_verify_otp(
    payload: FarmerOTPVerify,
    db: AsyncSession = Depends(get_db)
):
    """Farmer submits OTP and receives JWT tokens."""
    service = AuthService(db)
    result = await service.verify_farmer_otp(payload.aadhaar_number, payload.otp)
    return APIResponse.ok(data=result, message="OTP verified and logged in successfully")


@router.post("/ngo/register", response_model=APIResponse[TokenResponse])

async def ngo_register(
    payload: NGORegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register NGO and log in immediately."""
    ngo_svc = NGOService(db)
    auth_svc = AuthService(db)

    # Hash the password before saving
    hashed = hash_password(payload.password)
    
    # Register NGO
    ngo = await ngo_svc.register_ngo(
        name=payload.name,
        license_number=payload.license_number,
        contact_person=payload.contact_person,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hashed
    )

    # Automatically log them in after registration
    tokens = await auth_svc._generate_tokens_for_user(ngo.id, "ngo")
    return APIResponse.ok(data=tokens, message="NGO registered and logged in successfully")


@router.post("/ngo/login", response_model=APIResponse[TokenResponse])

async def ngo_login(
    payload: NGOLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate NGO and receive JWT tokens."""
    service = AuthService(db)
    result = await service.login_ngo(payload.email, payload.password)
    return APIResponse.ok(data=result, message="Logged in successfully")


@router.post("/official/login", response_model=APIResponse[TokenResponse])

async def official_login(
    payload: OfficialLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate government official and receive JWT tokens."""
    service = AuthService(db)
    result = await service.login_official(payload.email, payload.password)
    return APIResponse.ok(data=result, message="Logged in successfully")


@router.post("/refresh", response_model=APIResponse[TokenResponse])

async def refresh_tokens(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """Rotate and refresh access & refresh tokens."""
    service = AuthService(db)
    result = await service.refresh_token(payload.refresh_token)
    return APIResponse.ok(data=result, message="Tokens refreshed successfully")


@router.post("/logout", response_model=APIResponse)
async def logout(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """Log out a user by revoking their refresh token."""
    service = AuthService(db)
    await service.logout(payload.refresh_token)
    return APIResponse.ok(message="Logged out successfully")


@router.get("/me", response_model=APIResponse[UserProfileResponse])

async def get_profile(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's profile details."""
    user = current_user["user"]
    role = current_user["role"]

    # Build response depending on role
    profile = UserProfileResponse(
        id=str(user.id),
        role=role,
        name=user.name
    )

    if role == "farmer":
        profile.phone = user.phone
        profile.is_verified = user.is_verified
    elif role == "ngo":
        profile.email = user.email
        profile.phone = user.phone
    elif role == "official":
        profile.email = user.email
        profile.designation = user.designation
        profile.phone = user.phone

    return APIResponse.ok(data=profile, message="Profile fetched successfully")
