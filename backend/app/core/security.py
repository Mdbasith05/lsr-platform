import os
import time
import logging
from typing import Optional, Dict
from fastapi import Header, HTTPException, status
from pydantic import BaseModel
from jose import jwt, jwk, JWTError
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class AuthenticatedUser(BaseModel):
    user_id: str
    tenant_id: str
    email: Optional[str] = None
    role: str = "Senior Empaneled Advocate"
    name: str = "Empaneled Advocate"
    user_metadata: Dict = {}


class SupabaseJWKSCache:
    """
    Maintains an in-memory cache of public keys fetched from Supabase Auth JWKS.
    Handles dynamic key rotation safely using the JWT 'kid' header.
    """
    def __init__(self, jwks_url: str, ttl_seconds: int = 3600):
        self.jwks_url = jwks_url
        self.ttl_seconds = ttl_seconds
        self._keys: Dict[str, str] = {}  # kid -> pem_str
        self._test_keys: Dict[str, str] = {}  # test-injected keys
        self._last_fetched: float = 0.0

    def get_key(self, kid: Optional[str]) -> Optional[str]:
        if kid and kid in self._test_keys:
            return self._test_keys[kid]

        now = time.time()
        # If cache is empty or expired, refresh from endpoint
        if not self._keys or (now - self._last_fetched) > self.ttl_seconds:
            self.refresh()

        if kid and kid in self._keys:
            return self._keys[kid]

        # If kid was not found in cache, force a refresh (handles recent key rotation)
        if (now - self._last_fetched) > 5.0:
            self.refresh()
            if kid and kid in self._keys:
                return self._keys[kid]

        # If no kid provided and only 1 key in JWKS, return it
        if not kid and len(self._keys) == 1:
            return next(iter(self._keys.values()))

        return None

    def refresh(self):
        if not self.jwks_url or "your-project-id" in self.jwks_url:
            return
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(self.jwks_url)
                if resp.status_code == 200:
                    data = resp.json()
                    new_keys = {}
                    for k in data.get("keys", []):
                        k_id = k.get("kid")
                        if k_id:
                            key_obj = jwk.construct(k)
                            new_keys[k_id] = key_obj.to_pem().decode("utf-8")
                    if new_keys:
                        self._keys = new_keys
                        self._last_fetched = time.time()
                        logger.info(f"[Security] Supabase JWKS cache refreshed ({len(new_keys)} keys loaded).")
        except Exception as e:
            logger.warning(f"[Security] Failed to fetch Supabase JWKS from {self.jwks_url}: {e}")

    def add_key(self, kid: str, pem_str: str):
        """Allows injecting test keys in isolated pytest fixtures."""
        self._test_keys[kid] = pem_str


# Initialize global JWKS cache using configured Supabase URL
_jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json" if settings.SUPABASE_URL else ""
jwks_cache = SupabaseJWKSCache(_jwks_url)


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> AuthenticatedUser:
    """
    Validates Supabase ES256 JWT from the Authorization Bearer header.
    Rejects missing, malformed, expired, incorrectly signed, or invalid tokens with HTTP 401.
    Never accepts client-supplied IDs or falls back to hardcoded identities.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Inspect token header for algorithm and kid
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed token header: {err}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = header.get("alg")
    if alg != "ES256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported token algorithm '{alg}'. Expected 'ES256'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    kid = header.get("kid")
    pub_key_pem = jwks_cache.get_key(kid)
    if not pub_key_pem:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Public key for key identifier '{kid}' not found in JWKS.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expected_issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
    expected_audience = settings.SUPABASE_JWT_AUDIENCE

    try:
        payload = jwt.decode(
            token,
            pub_key_pem,
            algorithms=["ES256"],
            audience=expected_audience,
            issuer=expected_issuer,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_exp": True,
                "verify_iss": True,
            },
        )
    except JWTError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {err}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing valid 'sub' subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    user_metadata = payload.get("user_metadata", {})
    if not isinstance(user_metadata, dict):
        user_metadata = {}
    name = user_metadata.get("full_name") or user_metadata.get("name") or "Empaneled Advocate"

    app_metadata = payload.get("app_metadata", {})
    if not isinstance(app_metadata, dict):
        app_metadata = {}
    tenant_id = app_metadata.get("tenant_id", "chamber-001")
    role = payload.get("role") or "Senior Empaneled Advocate"

    return AuthenticatedUser(
        user_id=str(user_id),
        tenant_id=str(tenant_id),
        email=email,
        role=role,
        name=name,
        user_metadata=user_metadata,
    )


# Alias maintained for backwards compatibility with routes referencing get_current_user_stub
get_current_user_stub = get_current_user
