import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


class DevRegisterRequest(BaseModel):
    email: str
    password: str
    fullName: str
    barEnrollmentNumber: Optional[str] = ""
    chamberName: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""


class DevRegisterResponse(BaseModel):
    success: bool
    message: str
    requiresEmailConfirmation: bool = True
    confirmationLink: Optional[str] = None
    userId: Optional[str] = None


@router.post("/register", response_model=DevRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_advocate(payload: DevRegisterRequest):
    """
    Development-safe advocate registration flow.
    Utilizes Supabase Auth Admin 'generate_link' with type='signup' to create the account
    and generate the official email confirmation verification link cryptographically signed
    by Supabase, without exhausting the shared rate-limited SMTP quota.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase service role credentials not configured on backend."
        )

    admin_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/generate_link"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    admin_payload = {
        "type": "signup",
        "email": payload.email.strip(),
        "password": payload.password,
        "data": {
            "full_name": payload.fullName.strip(),
            "name": payload.fullName.strip(),
            "bar_enrollment_number": payload.barEnrollmentNumber or "",
            "chamber_name": payload.chamberName or f"Chamber of {payload.fullName}",
            "phone": payload.phone or "",
            "address": payload.address or "",
        }
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(admin_url, headers=headers, json=admin_payload)
            if resp.status_code not in [200, 201]:
                err_msg = resp.text
                try:
                    err_msg = resp.json().get("msg") or resp.json().get("message", resp.text)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=resp.status_code if resp.status_code in [400, 422, 429] else 400,
                    detail=f"Registration failed: {err_msg}"
                )

            data = resp.json()
            action_link = data.get("action_link")
            user = data.get("user", {})

            logger.info(f"[Auth] Registered new advocate {payload.email}. Confirmation link generated: {action_link}")

            return DevRegisterResponse(
                success=True,
                message="Chamber account created. Please verify your email using the confirmation link.",
                requiresEmailConfirmation=True,
                confirmationLink=action_link if settings.APP_ENV == "development" or settings.DEBUG else None,
                userId=user.get("id"),
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Auth] Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration service error: {str(e)}"
        )
