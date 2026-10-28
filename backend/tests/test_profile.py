import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import ProfileModel
from app.core.security import get_current_user, AuthenticatedUser

client = TestClient(app)


@pytest.mark.unauthenticated
def test_unauthenticated_profile_access_rejected():
    """Verify unauthenticated GET/PUT requests to /profile/me are rejected with 401."""
    app.dependency_overrides.pop(get_current_user, None)
    res_get = client.get("/api/v1/profile/me")
    assert res_get.status_code == 401

    res_put = client.put("/api/v1/profile/me", json={"fullName": "Test Advocate"})
    assert res_put.status_code == 401


def test_get_and_update_my_profile():
    """
    Verify that an authenticated user can fetch and update their own profile,
    and the profile is tied strictly to their user_id without touching other profiles.
    """
    unique_user_id = f"usr-{uuid.uuid4().hex[:12]}"
    test_user = AuthenticatedUser(
        user_id=unique_user_id,
        tenant_id="chamber-test",
        email=f"{unique_user_id}@testchamber.in",
        role="Senior Empaneled Advocate",
        name="Adv. Dynamic Test User",
    )
    app.dependency_overrides[get_current_user] = lambda: test_user

    try:
        # 1. Initial GET prior to creation in DB returns identity-driven stub
        res = client.get("/api/v1/profile/me")
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["id"] == unique_user_id
        assert data["email"] == f"{unique_user_id}@testchamber.in"
        assert data["fullName"] == "Adv. Dynamic Test User"

        # 2. PUT creates/upserts their profile in the database
        update_payload = {
            "fullName": "Adv. Verified Name",
            "barEnrollmentNumber": "MAH/2026/8899",
            "chamberName": "Chamber of Adv. Verified Name",
            "chamberAddress": "Chamber 101, High Court Bombay",
            "phone": "+91 98765 43210"
        }
        res_put = client.put("/api/v1/profile/me", json=update_payload)
        assert res_put.status_code == 200, res_put.text
        updated = res_put.json()
        assert updated["id"] == unique_user_id
        assert updated["fullName"] == "Adv. Verified Name"
        assert updated["barEnrollmentNumber"] == "MAH/2026/8899"
        assert updated["email"] == f"{unique_user_id}@testchamber.in"

        # 3. GET retrieves the stored profile
        res_get2 = client.get("/api/v1/profile/me")
        assert res_get2.status_code == 200
        assert res_get2.json()["fullName"] == "Adv. Verified Name"
        assert res_get2.json()["chamberName"] == "Chamber of Adv. Verified Name"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        # Clean up database record
        db = SessionLocal()
        try:
            db.query(ProfileModel).filter(ProfileModel.id == unique_user_id).delete()
            # Also clean up previous static test id if present
            db.query(ProfileModel).filter(ProfileModel.id == "user-sub-test-9999").delete()
            db.commit()
        finally:
            db.close()
