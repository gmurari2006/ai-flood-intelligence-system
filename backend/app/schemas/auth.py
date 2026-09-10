"""
Authentication Request and Response Schemas.

Matches Document 05 Section 2.1 specifications.
"""

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):
    """User credentials login request payload."""
    username: str = Field(..., min_length=3, max_length=100, description="Username")
    password: str = Field(..., min_length=6, description="Plaintext password")

    model_config = ConfigDict(extra="forbid")


class UserOut(BaseModel):
    """Authenticated user profile metadata."""
    id: str
    username: str
    full_name: Optional[str] = None
    role: str
    organization: Optional[str] = None


class TokenResponse(BaseModel):
    """JWT Token bearer response payload."""
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int = 43200
    user: UserOut
