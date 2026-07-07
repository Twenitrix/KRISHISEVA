"""
KRISHISEVA — Custom Exception Classes.

All exceptions used across the application are defined here.
Never raise bare Exception or HTTPException directly in services.
Routers catch these and convert to proper HTTP responses.
"""


class KrishisevaException(Exception):
    """Base exception for all application-specific errors."""

    def __init__(self, message: str = "An unexpected error occurred", code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


# ── Auth Exceptions ──

class AuthenticationError(KrishisevaException):
    """Raised when authentication fails (bad credentials, expired token, etc.)."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, code="AUTHENTICATION_ERROR")


class AuthorizationError(KrishisevaException):
    """Raised when a user lacks permission for the requested action."""

    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message=message, code="AUTHORIZATION_ERROR")


class InvalidTokenError(KrishisevaException):
    """Raised when a JWT token is invalid or expired."""

    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(message=message, code="INVALID_TOKEN")


class InvalidOTPError(KrishisevaException):
    """Raised when OTP verification fails."""

    def __init__(self, message: str = "Invalid or expired OTP"):
        super().__init__(message=message, code="INVALID_OTP")


# ── Resource Exceptions ──

class NotFoundError(KrishisevaException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str = "Resource", identifier: str = ""):
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} with id '{identifier}' not found"
        super().__init__(message=msg, code="NOT_FOUND")


class DuplicateError(KrishisevaException):
    """Raised when attempting to create a resource that already exists."""

    def __init__(self, resource: str = "Resource", field: str = ""):
        msg = f"{resource} already exists"
        if field:
            msg = f"{resource} with this {field} already exists"
        super().__init__(message=msg, code="DUPLICATE_ERROR")


# ── Claim Exceptions ──

class ClaimValidationError(KrishisevaException):
    """Raised when a claim fails validation rules."""

    def __init__(self, message: str = "Claim validation failed"):
        super().__init__(message=message, code="CLAIM_VALIDATION_ERROR")


class ClaimAlreadyReviewedError(KrishisevaException):
    """Raised when attempting to modify an already-reviewed claim."""

    def __init__(self, message: str = "This claim has already been reviewed and cannot be modified"):
        super().__init__(message=message, code="CLAIM_ALREADY_REVIEWED")


# ── AI Exceptions ──

class AIServiceError(KrishisevaException):
    """Raised when the AI vision API call fails."""

    def __init__(self, message: str = "AI service is temporarily unavailable"):
        super().__init__(message=message, code="AI_SERVICE_ERROR")


# ── File Exceptions ──

class FileUploadError(KrishisevaException):
    """Raised when file upload fails (too large, wrong type, etc.)."""

    def __init__(self, message: str = "File upload failed"):
        super().__init__(message=message, code="FILE_UPLOAD_ERROR")


class FileTooLargeError(FileUploadError):
    """Raised when uploaded file exceeds size limit."""

    def __init__(self, max_size_mb: int = 10):
        super().__init__(message=f"File size exceeds the maximum allowed size of {max_size_mb}MB")
        self.code = "FILE_TOO_LARGE"
