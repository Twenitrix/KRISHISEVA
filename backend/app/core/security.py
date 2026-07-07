"""
KRISHISEVA — Security Utilities.

JWT token creation/verification and password hashing.
Used by auth_service.py — never called directly from routers.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings
from app.exceptions import InvalidTokenError

# ── Password Hashing ──


def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pw_bytes = plain.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        pw_bytes = plain.encode("utf-8")
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hashed_bytes)
    except Exception:
        return False



# ── JWT Token Management ──

def create_access_token(
    user_id: uuid.UUID,
    role: str,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    """
    Create a JWT access token.

    Claims:
        sub: user ID (string)
        role: farmer / ngo / official
        exp: expiration time
        iat: issued at
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": expire,
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: uuid.UUID, role: str) -> tuple[str, datetime]:
    """
    Create a JWT refresh token.

    Returns: (token_string, expiration_datetime)
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.jwt_refresh_token_expire_days)

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expire



def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Raises InvalidTokenError if the token is expired, malformed, or invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        raise InvalidTokenError(f"Token validation failed: {str(e)}")


def hash_aadhaar(aadhaar_number: str) -> str:
    """
    Create a SHA-256 hash of an Aadhaar number for privacy-safe lookup.
    Used instead of storing the full Aadhaar.
    """
    import hashlib
    return hashlib.sha256(aadhaar_number.encode()).hexdigest()


def mask_aadhaar(aadhaar_number: str) -> str:
    """Extract last 4 digits of Aadhaar for masked display."""
    return aadhaar_number[-4:] if len(aadhaar_number) >= 4 else aadhaar_number
