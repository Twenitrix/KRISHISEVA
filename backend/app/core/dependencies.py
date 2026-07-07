"""
KRISHISEVA — FastAPI Dependencies.

Reusable dependency functions for:
- Database session injection
- Current user extraction from JWT
- Role-based access control
"""

import uuid
from typing import Optional

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.exceptions import AuthenticationError, AuthorizationError, InvalidTokenError
from app.repositories.farmer_repository import FarmerRepository
from app.repositories.ngo_repository import NGORepository
from app.repositories.official_repository import OfficialRepository


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Extract and validate the current user from the Authorization header.

    Returns a dict with: id, role, and the user object.
    """
    if not authorization:
        raise AuthenticationError("Authorization header is required")

    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Invalid authorization format. Use 'Bearer <token>'")

    token = parts[1]

    try:
        payload = decode_token(token)
    except InvalidTokenError:
        raise AuthenticationError("Invalid or expired access token")

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type — expected access token")

    user_id = payload.get("sub")
    role = payload.get("role")

    if not user_id or not role:
        raise AuthenticationError("Token is missing required claims")

    user_uuid = uuid.UUID(user_id)

    # Fetch user from the appropriate table based on role
    user_obj = None
    if role == "farmer":
        repo = FarmerRepository(db)
        user_obj = await repo.get_by_id(user_uuid)
    elif role == "ngo":
        repo = NGORepository(db)
        user_obj = await repo.get_by_id(user_uuid)
    elif role == "official":
        repo = OfficialRepository(db)
        user_obj = await repo.get_by_id(user_uuid)

    if not user_obj:
        raise AuthenticationError("User account not found or deleted")

    return {
        "id": user_uuid,
        "role": role,
        "user": user_obj,
    }


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-based access control.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("official"))])
        async def admin_endpoint(current_user = Depends(get_current_user)):
            ...
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise AuthorizationError(
                f"This endpoint requires one of these roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


# ── Convenience role-specific dependencies ──

async def get_current_farmer(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure the current user is a farmer."""
    if current_user["role"] != "farmer":
        raise AuthorizationError("This endpoint is for farmers only")
    return current_user


async def get_current_ngo(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure the current user is an NGO."""
    if current_user["role"] != "ngo":
        raise AuthorizationError("This endpoint is for NGOs only")
    return current_user


async def get_current_official(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Ensure the current user is a government official."""
    if current_user["role"] != "official":
        raise AuthorizationError("This endpoint is for government officials only")
    return current_user
