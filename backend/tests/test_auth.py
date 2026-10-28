import time
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

from app.main import app
from app.core.config import settings
from app.core.security import jwks_cache

client = TestClient(app)

# Generate a fixture EC key pair for testing ES256 tokens
_test_ec_key = ec.generate_private_key(ec.SECP256R1())
TEST_PRIV_PEM = _test_ec_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode("utf-8")

TEST_PUB_PEM = _test_ec_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode("utf-8")

TEST_KID = "test-auth-kid-2026"
jwks_cache.add_key(TEST_KID, TEST_PUB_PEM)


def create_test_token(claims_override=None, kid=TEST_KID, priv_key=TEST_PRIV_PEM, alg="ES256"):
    now = int(time.time())
    claims = {
        "sub": "test-lawyer-uuid-001",
        "email": "lawyer.test@lsr-platform.in",
        "iss": f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1",
        "aud": settings.SUPABASE_JWT_AUDIENCE,
        "exp": now + 3600,
        "iat": now,
        "user_metadata": {"full_name": "Adv. Sreenivasan Iyer"},
        "app_metadata": {"tenant_id": "chamber-001"},
    }
    if claims_override:
        claims.update(claims_override)
    headers = {"kid": kid} if kid else {}
    return jwt.encode(claims, priv_key, algorithm=alg, headers=headers)


@pytest.mark.unauthenticated
def test_missing_authorization_header():
    """Verify that request with no Authorization header is rejected with 401."""
    res = client.get("/api/v1/cases")
    assert res.status_code == 401
    assert "Missing or malformed Authorization header" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_malformed_authorization_header():
    """Verify that non-Bearer or empty Authorization headers are rejected with 401."""
    res = client.get("/api/v1/cases", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert res.status_code == 401

    res = client.get("/api/v1/cases", headers={"Authorization": "Bearer "})
    assert res.status_code == 401


@pytest.mark.unauthenticated
def test_malformed_token_string():
    """Verify that garbage/corrupt token strings are rejected with 401."""
    res = client.get("/api/v1/cases", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert res.status_code == 401
    assert "Malformed token header" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_unsupported_algorithm():
    """Verify that tokens using algorithms other than ES256 (e.g. HS256) are rejected with 401."""
    # HS256 token
    hs_token = jwt.encode({"sub": "test"}, "secret", algorithm="HS256")
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {hs_token}"})
    assert res.status_code == 401
    assert "Unsupported token algorithm" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_unknown_kid():
    """Verify that token with unknown kid is rejected with 401."""
    token = create_test_token(kid="nonexistent-rotated-kid")
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "not found in JWKS" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_invalid_signature():
    """Verify that token signed with a different private key is rejected with 401."""
    other_key = ec.generate_private_key(ec.SECP256R1())
    other_priv_pem = other_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    # Signed with other key, but header specifies TEST_KID
    token = create_test_token(kid=TEST_KID, priv_key=other_priv_pem)
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "Signature verification failed" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_expired_token():
    """Verify that expired token is rejected with 401."""
    now = int(time.time())
    token = create_test_token(claims_override={"exp": now - 600, "iat": now - 1200})
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "Signature has expired" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_wrong_issuer():
    """Verify that token with mismatched issuer is rejected with 401."""
    token = create_test_token(claims_override={"iss": "https://malicious.supabase.co/auth/v1"})
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "Invalid issuer" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_wrong_audience():
    """Verify that token with mismatched audience is rejected with 401."""
    token = create_test_token(claims_override={"aud": "anon"})
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "Invalid audience" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_missing_sub_claim():
    """Verify that token without 'sub' subject claim is rejected with 401."""
    now = int(time.time())
    claims = {
        "iss": f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1",
        "aud": settings.SUPABASE_JWT_AUDIENCE,
        "exp": now + 3600,
        "iat": now,
    }
    token = jwt.encode(claims, TEST_PRIV_PEM, algorithm="ES256", headers={"kid": TEST_KID})
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401
    assert "missing valid 'sub'" in res.json()["detail"]


@pytest.mark.unauthenticated
def test_valid_es256_token_succeeds():
    """Verify that properly signed valid ES256 token is accepted and allows case access."""
    token = create_test_token()
    res = client.get("/api/v1/cases", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)


def test_live_supabase_jwks_cache():
    """Verify that the live Supabase JWKS cache fetches and contains the live key ID."""
    jwks_cache.refresh()
    live_kid = "e0643e0c-ecde-48a6-9d8e-212719091a04"
    key = jwks_cache.get_key(live_kid)
    assert key is not None, f"Live Supabase key {live_kid} not found in JWKS cache"
    assert "BEGIN PUBLIC KEY" in key
