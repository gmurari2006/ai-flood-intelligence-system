"""
Authentication API Endpoint Handlers.

Implements POST /api/v1/auth/login matching Document 05 Section 2.1 (FR-01, NFR-09).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.auth import LoginRequest, TokenResponse
from backend.app.services.auth_service import AuthService
from backend.app.core.logging import logger

router = APIRouter()


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="User Login & JWT Token Issuance",
    description="Authenticates user credentials and issues a signed JWT bearer token with user role metadata."
)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Authenticate user with username and password."""
    user = await AuthService.authenticate(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return AuthService.create_token_for_user(user)
