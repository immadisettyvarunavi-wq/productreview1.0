"""Pydantic schemas for authentication endpoints."""

from pydantic import BaseModel, EmailStr, field_validator
import re


class SignUpRequest(BaseModel):
    """Request body for user registration."""
    username: str
    email: str
    password: str
    full_name: str = ""

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 100:
            raise ValueError("Username must be at most 100 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        return v


class SignInRequest(BaseModel):
    """Request body for user login (accepts username or email)."""
    login: str  # username or email
    password: str


class AuthResponse(BaseModel):
    """Response body for successful authentication."""
    access_token: str
    token_type: str = "bearer"
    user: "UserInfo"


class UserInfo(BaseModel):
    """Public user information returned in auth responses."""
    id: int
    username: str
    email: str
    full_name: str

    model_config = {"from_attributes": True}
