"""
Security and authentication boundaries.
Will be integrated with Supabase JWT validation and Tenant RLS in Milestone 1.
"""
from typing import Optional
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    user_id: str
    tenant_id: str
    email: Optional[str] = None
    role: str = "lawyer"


async def get_current_user_stub() -> AuthenticatedUser:
    """
    Temporary security dependency stub for Milestone 0.
    Milestone 1 will replace this with Supabase Bearer JWT token decoding.
    """
    return AuthenticatedUser(
        user_id="dev-user-001",
        tenant_id="dev-tenant-001",
        email="dev-lawyer@lsr-platform.local",
        role="lawyer",
    )
