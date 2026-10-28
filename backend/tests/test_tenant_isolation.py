import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import SessionLocal
from app.db.models import CaseModel, ProfileModel

client = TestClient(app)


def test_newly_registered_user_sees_no_other_advocate_data():
    """
    Prove that a newly authenticated advocate sees 0 cases on intake,
    sees none of adv-rajesh-001's cases, and has their own clean profile.
    """
    new_user_id = f"usr-new-{uuid.uuid4().hex[:10]}"
    user_metadata = {
        "full_name": "Adv. Sanya Malhotra",
        "chamber_name": "Malhotra Legal Chambers",
        "bar_enrollment_number": "D/9876/2021",
        "phone": "+91 91234 56789",
        "address": "Chamber 405, Supreme Court Bar Association",
    }
    new_advocate = AuthenticatedUser(
        user_id=new_user_id,
        tenant_id="tenant-malhotra",
        email=f"{new_user_id}@malhotralaw.in",
        role="Senior Empaneled Advocate",
        name="Adv. Sanya Malhotra",
        user_metadata=user_metadata,
    )

    app.dependency_overrides[get_current_user] = lambda: new_advocate
    try:
        # 1. Profile loads strictly from verified Supabase identity
        res_profile = client.get("/api/v1/profile/me")
        assert res_profile.status_code == 200, res_profile.text
        prof = res_profile.json()
        assert prof["id"] == new_user_id
        assert prof["fullName"] == "Adv. Sanya Malhotra"
        assert prof["chamberName"] == "Malhotra Legal Chambers"
        assert prof["barEnrollmentNumber"] == "D/9876/2021"
        assert "Rajesh" not in prof["fullName"]
        assert "Independent Legal Chamber" not in prof["chamberName"]

        # 2. Case list is completely empty for the new advocate
        res_cases = client.get("/api/v1/cases")
        assert res_cases.status_code == 200
        cases = res_cases.json()
        assert cases == [], f"Expected empty case list for new advocate, got {len(cases)} cases"

        # 3. New advocate cannot access another advocate's cases (e.g. LSR-2026-001)
        res_foreign_case = client.get("/api/v1/cases/LSR-2026-001")
        assert res_foreign_case.status_code == 404

        # 4. New advocate cannot access another advocate's documents
        res_foreign_docs = client.get("/api/v1/cases/LSR-2026-001/documents")
        assert res_foreign_docs.status_code == 404

        # 5. New advocate cannot access another advocate's scrutiny findings
        res_foreign_findings = client.get("/api/v1/cases/LSR-2026-001/scrutiny/findings")
        assert res_foreign_findings.status_code == 404

        # 6. New advocate cannot access another advocate's queries
        res_foreign_queries = client.get("/api/v1/cases/LSR-2026-001/queries")
        assert res_foreign_queries.status_code == 404

        # 7. New advocate cannot access another advocate's report
        res_foreign_report = client.get("/api/v1/cases/LSR-2026-001/report")
        assert res_foreign_report.status_code == 404

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        db = SessionLocal()
        try:
            db.query(ProfileModel).filter(ProfileModel.id == new_user_id).delete()
            db.commit()
        finally:
            db.close()


def test_strict_cross_advocate_isolation_between_two_users():
    """
    Prove that User A and User B operate in total isolation:
    User A's cases and mutations are invisible and inaccessible to User B.
    """
    user_a_id = f"usr-a-{uuid.uuid4().hex[:8]}"
    user_b_id = f"usr-b-{uuid.uuid4().hex[:8]}"

    user_a = AuthenticatedUser(
        user_id=user_a_id,
        tenant_id="tenant-a",
        email=f"{user_a_id}@chamber-a.in",
        name="Advocate Alpha",
        user_metadata={"full_name": "Advocate Alpha", "chamber_name": "Alpha Law"},
    )
    user_b = AuthenticatedUser(
        user_id=user_b_id,
        tenant_id="tenant-b",
        email=f"{user_b_id}@chamber-b.in",
        name="Advocate Beta",
        user_metadata={"full_name": "Advocate Beta", "chamber_name": "Beta Law"},
    )

    created_case_id = None
    db = SessionLocal()

    try:
        # Act as User A: Create a case
        app.dependency_overrides[get_current_user] = lambda: user_a
        create_res = client.post("/api/v1/cases", json={
            "borrowerName": "Tenant Isolation Borrower A",
            "bankName": "State Bank of India",
            "branch": "Main Branch",
            "loanAmount": "₹75,00,000",
            "propertyType": "Commercial Complex",
            "propertyAddress": "123 Commercial St, Bangalore",
            "surveyNumber": "Sy. 44/2",
            "boundaries": {"north": "Road", "south": "Plot B", "east": "Lane", "west": "Plot A"},
        })
        assert create_res.status_code == 201, create_res.text
        created_case = create_res.json()
        created_case_id = created_case["id"]
        assert created_case["assignedLawyer"] == "Advocate Alpha"

        # User A sees 1 case in list
        list_a = client.get("/api/v1/cases").json()
        assert len(list_a) == 1
        assert list_a[0]["id"] == created_case_id

        # Switch to User B (simulate sign-out User A, sign-in User B)
        app.dependency_overrides[get_current_user] = lambda: user_b

        # User B sees 0 cases in their list
        list_b = client.get("/api/v1/cases").json()
        assert len(list_b) == 0

        # User B cannot read User A's case
        assert client.get(f"/api/v1/cases/{created_case_id}").status_code == 404

        # User B cannot update User A's case
        assert client.patch(f"/api/v1/cases/{created_case_id}", json={"status": "Completed"}).status_code == 404

        # User B cannot delete User A's case
        assert client.delete(f"/api/v1/cases/{created_case_id}").status_code == 404

        # User B cannot read User A's documents
        assert client.get(f"/api/v1/cases/{created_case_id}/documents").status_code == 404

        # User B cannot read User A's findings
        assert client.get(f"/api/v1/cases/{created_case_id}/scrutiny/findings").status_code == 404

        # User B cannot read User A's queries
        assert client.get(f"/api/v1/cases/{created_case_id}/queries").status_code == 404

        # User B cannot read User A's report
        assert client.get(f"/api/v1/cases/{created_case_id}/report").status_code == 404

        # Switch back to User A (simulate sign-back-in / refresh)
        app.dependency_overrides[get_current_user] = lambda: user_a
        list_a_again = client.get("/api/v1/cases").json()
        assert len(list_a_again) == 1
        assert list_a_again[0]["id"] == created_case_id

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        try:
            if created_case_id:
                db.query(CaseModel).filter(CaseModel.id == created_case_id).delete()
            db.query(ProfileModel).filter(ProfileModel.id.in_([user_a_id, user_b_id])).delete()
            db.commit()
        finally:
            db.close()


def test_clean_defaults_when_user_profile_metadata_is_empty():
    """
    Prove that if a user signs up without optional fields, clean empty strings
    are shown instead of synthetic/mock chamber names or fake bar numbers.
    """
    bare_user_id = f"usr-bare-{uuid.uuid4().hex[:8]}"
    bare_user = AuthenticatedUser(
        user_id=bare_user_id,
        tenant_id="tenant-bare",
        email=f"bare.advocate.{bare_user_id}@bar.in",
        name="Bare Advocate",
        user_metadata={},  # No optional chamber or bar number
    )
    app.dependency_overrides[get_current_user] = lambda: bare_user

    try:
        res = client.get("/api/v1/profile/me")
        assert res.status_code == 200
        p = res.json()
        assert p["id"] == bare_user_id
        assert p["fullName"] == "Bare Advocate"
        assert p["chamberName"] == ""
        assert p["barEnrollmentNumber"] == ""
        assert p["phone"] == ""
        assert p["chamberAddress"] == ""
        assert "Independent Legal Chamber" not in p["chamberName"]
        assert "Pending Verification" not in p["barEnrollmentNumber"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        db = SessionLocal()
        try:
            db.query(ProfileModel).filter(ProfileModel.id == bare_user_id).delete()
            db.commit()
        finally:
            db.close()
