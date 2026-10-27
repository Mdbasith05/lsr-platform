import os
from typing import Optional
from fastapi import Header, HTTPException, status
from pydantic import BaseModel
from jose import jwt, JWTError
from app.core.config import settings


class AuthenticatedUser(BaseModel):
    user_id: str
    tenant_id: str
    email: Optional[str] = None
    role: str = "Senior Empaneled Advocate"
    name: str = "Adv. Rajesh Kumar"


async def get_current_user_stub(
    authorization: Optional[str] = Header(None)
) -> AuthenticatedUser:
    """
    Decodes Supabase JWT token from Authorization Bearer header.
    Provides graceful fallback for local development & automated test suites.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()

        # Check if Supabase JWT secret is configured
        jwt_secret = settings.SUPABASE_SERVICE_ROLE_KEY.strip() if settings.SUPABASE_SERVICE_ROLE_KEY else ""

        try:
            # If secret is available, verify signature; otherwise decode claims
            if jwt_secret and "placeholder" not in jwt_secret:
                payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
            else:
                payload = jwt.get_unverified_claims(token)

            user_id = payload.get("sub") or payload.get("user_id") or "adv-rajesh-001"
            email = payload.get("email", "advocate.rajesh@lsr-platform.in")
            user_metadata = payload.get("user_metadata", {})
            name = user_metadata.get("full_name") or user_metadata.get("name") or "Adv. Rajesh Kumar"

            return AuthenticatedUser(
                user_id=str(user_id),
                tenant_id=str(payload.get("app_metadata", {}).get("tenant_id", "chamber-001")),
                email=email,
                role="Senior Empaneled Advocate",
                name=name,
            )
        except JWTError as err:
            # In development, log and provide dev user; in production, raise 401
            if settings.APP_ENV == "production":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid authentication token: {err}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # Local development & testing default advocate
    return AuthenticatedUser(
        user_id="adv-rajesh-001",
        tenant_id="chamber-001",
        email="advocate.rajesh@lsr-platform.in",
        role="Senior Empaneled Advocate",
        name="Adv. Rajesh Kumar",
    )
