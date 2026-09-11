"""
Authentication and User Service.

Handles user lookup, credential verification, and token generation.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.domain import User, UserRole
from app.schemas.auth import TokenResponse, UserOut


class AuthService:
    """Service providing user authentication and token creation operations."""

    @classmethod
    async def authenticate(
        cls,
        db: AsyncSession,
        username: str,
        password: str
    ) -> Optional[User]:
        """Validates username and password against database user records."""
        stmt = (
            select(User)
            .options(selectinload(User.role))
            .where(User.username == username)
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    @classmethod
    def create_token_for_user(cls, user: User) -> TokenResponse:
        """Constructs TokenResponse with signed JWT token and user profile."""
        role_name = user.role.role_name if user.role else "PUBLIC_USER"
        token = create_access_token(subject=user.id, role=role_name)
        expires_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in_seconds=expires_seconds,
            user=UserOut(
                id=str(user.id),
                username=user.username,
                full_name=user.full_name,
                role=role_name,
                organization=user.organization
            )
        )
