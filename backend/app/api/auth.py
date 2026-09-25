"""Authentication API endpoints — Sign Up and Sign In."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database_mysql import get_mysql_db
from app.models.user import User
from app.schemas.auth import SignUpRequest, SignInRequest, AuthResponse, UserInfo
from app.services.auth_service import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest, db: AsyncSession = Depends(get_mysql_db)):
    """Register a new user account."""
    # Check if username or email already exists
    result = await db.execute(
        select(User).where(
            or_(User.username == body.username, User.email == body.email)
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.username == body.username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    await db.flush()  # get the auto-generated id
    await db.refresh(user)

    logger.info(f"New user registered: {user.username} (id={user.id})")

    # Generate JWT token
    token = create_access_token(user.id, user.username)

    return AuthResponse(
        access_token=token,
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
        ),
    )


@router.post("/signin", response_model=AuthResponse)
async def signin(body: SignInRequest, db: AsyncSession = Depends(get_mysql_db)):
    """Authenticate an existing user with username/email + password."""
    login_value = body.login.strip().lower()

    # Find user by username or email
    result = await db.execute(
        select(User).where(
            or_(User.username == login_value, User.email == login_value)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
        )

    logger.info(f"User signed in: {user.username} (id={user.id})")

    token = create_access_token(user.id, user.username)

    return AuthResponse(
        access_token=token,
        user=UserInfo(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
        ),
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user(
    token: str = "",
    db: AsyncSession = Depends(get_mysql_db),
):
    """Get current user info from JWT token (passed as query param or header)."""
    from app.services.auth_service import decode_access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserInfo(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
    )
