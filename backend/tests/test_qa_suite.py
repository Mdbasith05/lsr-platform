import io
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import get_current_user, AuthenticatedUser
from app.db.session import SessionLocal, verify_database_connection
from app.db.models import CaseModel, ProfileModel, DocumentModel, ScrutinyFindingModel, CaseQueryModel, LSRReportModel
from tests.test_auth import create_test_token

client = TestClient(app)


def generate_synthetic_deed_pdf(title: str = "DEED OF ABSOLUTE SALE") -> bytes:
    """Generates a synthetic 2-page test deed in memory using ReportLab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()

    story = [
        Paragraph(f"{title} (Reg. No. BLR-1-9988-2026)", styles["Heading1"]),
        Paragraph("Executed on 15th January 2026 at Sub-Registrar Shivajinagar.", styles["Normal"]),
        Paragraph("Vendor: Sri Ramesh Chandra. Purchaser: Smt. Sunita Sharma.", styles["Normal"]),
        PageBreak(),
        Paragraph("SCHEDULE PROPERTY: Sy. No. 102/4, Plot No. B-12, HAL 2nd Stage, Indiranagar.", styles["Heading2"]),
        Paragraph("Boundaries: North by 40ft Road, South by Plot B-13, East by Plot B-1, West by Main Avenue.", styles["Normal"]),
    ]
    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ==============================================================================
# 1. FUNCTIONAL & END-TO-END WORKFLOW TESTS
# ==============================================================================

def test_fn_01_full_advocate_workflow(monkeypatch):
    """
    [FUNCTIONAL] Complete lifecycle test:
    Intake -> Doc Upload -> OCR Extraction -> Scrutiny Analysis -> Finding Acceptance ->
    Query Generation -> Report Condition Sync -> Report Signing -> PDF Export.
    """
    from app.services.ai_scrutiny_service import AiScrutinyService
    monkeypatch.setattr(
        AiScrutinyService,
        "_call_gemini_api",
        lambda *args, **kwargs: [
            {
                "title": "Missing Prior Parent Deed (1995-2020)",
                "category": "Chain of Title Break",
                "severity": "critical",
                "description": "Chain of title prior to 2026 Sale Deed requires verified parent deed.",
                "source_doc_name": "Sale_Deed_2026_Sunita.pdf",
                "page_number": 1,
                "evidence_snippet": "Vendor Sri Ramesh Chandra acquired title under unregistered family partition.",
                "ai_confidence": 0.96,
                "suggested_query_text": "Produce registered parent deed / partition deed establishing title.",
            }
        ],
    )
    test_user_id = f"qa-adv-{uuid.uuid4().hex[:8]}"
    advocate = AuthenticatedUser(
        user_id=test_user_id,
        tenant_id="tenant-qa",
        email=f"{test_user_id}@qachambers.in",
        name="Adv. QA Lead",
        user_metadata={"full_name": "Adv. QA Lead", "chamber_name": "QA Chambers Bangalore"}
    )
    app.dependency_overrides[get_current_user] = lambda: advocate

    created_case_id = None
    db = SessionLocal()

    try:
        # Step 1: Case Intake
        create_payload = {
            "borrowerName": "Sunita Sharma",
            "coBorrowerName": "Anand Sharma",
            "bankName": "HDFC Bank",
            "branch": "Indiranagar Branch",
            "loanAmount": "Rs. 2,50,00,000",
            "loanType": "Housing Loan / Mortgage Scrutiny",
            "propertyType": "Residential Villa",
            "propertyAddress": "Plot B-12, HAL 2nd Stage, Indiranagar, Bengaluru",
            "surveyNumber": "Sy. No. 102/4",
            "khataNumber": "BBMP/KHA/2026/9901",
            "boundaries": {
                "north": "40ft Road",
                "south": "Plot B-13",
                "east": "Plot B-1",
                "west": "Main Avenue"
            }
        }
        res_create = client.post("/api/v1/cases", json=create_payload)
        assert res_create.status_code == 201, f"Failed intake: {res_create.text}"
        case_data = res_create.json()
        created_case_id = case_data["id"]
        assert case_data["status"] == "Intake"
        assert case_data["borrowerName"] == "Sunita Sharma"

        # Step 2: Upload Synthetic PDF Document
        pdf_bytes = generate_synthetic_deed_pdf("DEED OF ABSOLUTE SALE")
        files = {"file": ("Sale_Deed_2026_Sunita.pdf", pdf_bytes, "application/pdf")}
        res_upload = client.post(
            f"/api/v1/cases/{created_case_id}/documents/upload",
            files=files,
            data={"doc_type": "Sale Deed / Title Deed"}
        )
        assert res_upload.status_code == 201, f"Failed upload: {res_upload.text}"
        doc_data = res_upload.json()
        doc_id = doc_data["id"]
        assert doc_data["pageCount"] >= 2
        assert doc_data["status"] == "Review Ready"

        # Step 3: Stream Uploaded Document Content
        res_stream = client.get(f"/api/v1/documents/{doc_id}/content")
        assert res_stream.status_code == 200
        assert res_stream.headers["content-type"] == "application/pdf"
        assert len(res_stream.content) > 100

        # Step 4: Run AI Scrutiny
        res_scrutiny = client.post(f"/api/v1/cases/{created_case_id}/scrutiny/analyze")
        assert res_scrutiny.status_code == 200, f"Scrutiny failed: {res_scrutiny.text}"
        findings = res_scrutiny.json()
        assert len(findings) > 0, "Expected at least 1 scrutiny finding"
        target_finding = findings[0]
        finding_id = target_finding["id"]

        # Step 5: Advocate Accepts Finding
        res_decision = client.patch(
            f"/api/v1/scrutiny/findings/{finding_id}",
            json={"decision": "accepted", "notes": "Approved by Senior Advocate for Bank Requisition."}
        )
        assert res_decision.status_code == 200
        assert res_decision.json()["lawyerDecision"] == "accepted"

        # Step 6: Generate Bank Query from Finding
        query_payload = {
            "title": f"Requisition: {target_finding['title']}",
            "draftText": target_finding.get("suggestedQueryText") or "Provide certified link documents.",
            "linkedFindingId": finding_id,
        }
        res_query = client.post(f"/api/v1/cases/{created_case_id}/queries", json=query_payload)
        assert res_query.status_code == 201
        query_data = res_query.json()
        assert query_data["queryCode"].startswith("REQ-")

        # Step 7: Inspect Draft LSR Report
        res_report = client.get(f"/api/v1/cases/{created_case_id}/report")
        assert res_report.status_code == 200
        report_data = res_report.json()
        assert report_data["isSigned"] is False
        # Verify accepted finding was auto-synced into pre-disbursement conditions
        conditions_str = " ".join(report_data["preDisbursementConditions"])
        assert target_finding["title"] in conditions_str or len(report_data["preDisbursementConditions"]) > 0

        # Step 8: Update Opinion & Sign Report
        res_update = client.put(
            f"/api/v1/cases/{created_case_id}/report",
            json={
                "opinionOutcome": "Clear with Pre-Disbursement Conditions",
                "chainOfTitleNarrative": "Chain established from 2026 Absolute Sale Deed.",
            }
        )
        assert res_update.status_code == 200

        res_sign = client.post(f"/api/v1/cases/{created_case_id}/report/sign")
        assert res_sign.status_code == 200
        assert res_sign.json()["isSigned"] is True

        # Step 9: Export Final Signed PDF
        res_export = client.get(f"/api/v1/cases/{created_case_id}/report/export-pdf")
        assert res_export.status_code == 200
        assert res_export.headers["content-type"] == "application/pdf"
        assert res_export.content.startswith(b"%PDF-")

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        try:
            if created_case_id:
                db.query(CaseModel).filter(CaseModel.id == created_case_id).delete()
            db.query(ProfileModel).filter(ProfileModel.id == test_user_id).delete()
            db.commit()
        finally:
            db.close()


# ==============================================================================
# 2. SECURITY & TENANT ISOLATION TESTS
# ==============================================================================

@pytest.mark.unauthenticated
def test_sec_01_unauthenticated_requests_strictly_blocked():
    """[SECURITY] All API v1 routes require valid Bearer token."""
    app.dependency_overrides.pop(get_current_user, None)

    endpoints = [
        ("GET", "/api/v1/cases"),
        ("POST", "/api/v1/cases"),
        ("GET", "/api/v1/profile/me"),
        ("PUT", "/api/v1/profile/me"),
        ("GET", "/api/v1/documents/doc-dummy/content"),
        ("POST", "/api/v1/cases/case-dummy/documents/upload"),
        ("POST", "/api/v1/cases/case-dummy/scrutiny/analyze"),
        ("GET", "/api/v1/cases/case-dummy/report"),
    ]
    for method, path in endpoints:
        if method == "GET":
            r = client.get(path)
        elif method == "POST":
            r = client.post(path, json={})
        elif method == "PUT":
            r = client.put(path, json={})
        assert r.status_code == 401, f"{method} {path} returned {r.status_code}, expected 401"


def test_sec_02_cross_tenant_document_leakage_prevented():
    """[SECURITY] Advocate B cannot read or download Advocate A's documents."""
    user_a = AuthenticatedUser(
        user_id="adv-tenant-a",
        tenant_id="tenant-alpha",
        email="alpha@law.in",
        name="Advocate Alpha",
    )
    user_b = AuthenticatedUser(
        user_id="adv-tenant-b",
        tenant_id="tenant-beta",
        email="beta@law.in",
        name="Advocate Beta",
    )

    case_a_id = None
    db = SessionLocal()

    try:
        # User A creates case and uploads document
        app.dependency_overrides[get_current_user] = lambda: user_a
        c_res = client.post("/api/v1/cases", json={
            "borrowerName": "Confidential Client Alpha",
            "bankName": "Axis Bank",
            "branch": "Koramangala",
            "loanAmount": "Rs. 1,00,00,000",
            "propertyType": "Commercial",
            "propertyAddress": "100ft Road, Koramangala",
            "surveyNumber": "15/1",
        })
        assert c_res.status_code == 201
        case_a_id = c_res.json()["id"]

        pdf_bytes = generate_synthetic_deed_pdf("CONFIDENTIAL FINANCIAL DEED")
        files = {"file": ("Confidential_Deed.pdf", pdf_bytes, "application/pdf")}
        up_res = client.post(f"/api/v1/cases/{case_a_id}/documents/upload", files=files, data={"doc_type": "Title Deed"})
        assert up_res.status_code == 201
        doc_a_id = up_res.json()["id"]

        # Switch identity to User B
        app.dependency_overrides[get_current_user] = lambda: user_b

        # User B attempts to access documents of Case A -> 404
        assert client.get(f"/api/v1/cases/{case_a_id}/documents").status_code == 404

        # User B attempts to stream document A directly -> 404
        assert client.get(f"/api/v1/documents/{doc_a_id}/content").status_code == 404

        # User B attempts to upload document into Case A -> 404
        fake_files = {"file": ("Malicious.pdf", b"%PDF-fake", "application/pdf")}
        assert client.post(f"/api/v1/cases/{case_a_id}/documents/upload", files=fake_files).status_code == 404

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        try:
            if case_a_id:
                db.query(CaseModel).filter(CaseModel.id == case_a_id).delete()
            db.query(ProfileModel).filter(ProfileModel.id.in_(["adv-tenant-a", "adv-tenant-b"])).delete()
            db.commit()
        finally:
            db.close()


@pytest.mark.unauthenticated
def test_sec_03_query_token_authentication_succeeds():
    """[SECURITY] Document content streaming accepts token query parameter for iframe support."""
    app.dependency_overrides.pop(get_current_user, None)
    db = SessionLocal()
    case_id = None
    test_user_id = f"usr-token-{uuid.uuid4().hex[:6]}"

    try:
        # Create user profile and case in DB
        prof = ProfileModel(id=test_user_id, full_name="Token Test Advocate", email=f"{test_user_id}@bar.in")
        db.add(prof)
        db.commit()

        c = CaseModel(
            case_number=f"LSR-TOK-{uuid.uuid4().hex[:4]}",
            lawyer_id=test_user_id,
            borrower_name="Token Query Borrower",
                        bank_name="Bank of Baroda",
            branch="MG Road",
            loan_amount="50L",
        )
        db.add(c)
        db.commit()
        case_id = c.id

        doc = DocumentModel(
            id=f"doc-tok-{uuid.uuid4().hex[:6]}",
            case_id=case_id,
            file_name="TokenDeed.pdf",
            storage_path="cases/dummy/tok.pdf",
            doc_type="Sale Deed",
            page_count=1,
            file_size_bytes=100,
        )
        db.add(doc)
        db.commit()

        # Generate valid ES256 token for this user
        valid_jwt = create_test_token(claims_override={"sub": test_user_id})

        # Request via ?token= query parameter (without Authorization header)
        res = client.get(f"/api/v1/documents/{doc.id}/content?token={valid_jwt}")
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"

        # Request with invalid token in query parameter -> 401
        res_bad = client.get(f"/api/v1/documents/{doc.id}/content?token=invalid.jwt.token")
        assert res_bad.status_code == 401

    finally:
        try:
            if case_id:
                db.query(CaseModel).filter(CaseModel.id == case_id).delete()
            db.query(ProfileModel).filter(ProfileModel.id == test_user_id).delete()
            db.commit()
        finally:
            db.close()


# ==============================================================================
# 3. NEGATIVE TESTING & INPUT VALIDATION
# ==============================================================================

def test_neg_01_case_intake_missing_mandatory_fields():
    """[NEGATIVE] Case intake rejects payloads missing required fields with 422."""
    test_user = AuthenticatedUser(user_id="qa-neg-01", tenant_id="t-neg", email="neg@test.in")
    app.dependency_overrides[get_current_user] = lambda: test_user

    # Missing borrowerName
    res1 = client.post("/api/v1/cases", json={
        "bankName": "SBI", "branch": "Main", "loanAmount": "50L",
        "propertyAddress": "Test", "surveyNumber": "1"
    })
    assert res1.status_code == 422

    # Missing propertyAddress
    res2 = client.post("/api/v1/cases", json={
        "borrowerName": "John Doe", "bankName": "SBI", "branch": "Main",
        "loanAmount": "50L", "surveyNumber": "1"
    })
    assert res2.status_code == 422

    app.dependency_overrides.pop(get_current_user, None)


def test_neg_02_empty_file_upload_rejected():
    """[NEGATIVE] Uploading a 0-byte file returns 400 Bad Request."""
    test_user = AuthenticatedUser(user_id="qa-neg-02", tenant_id="t-neg", email="neg2@test.in")
    app.dependency_overrides[get_current_user] = lambda: test_user
    db = SessionLocal()
    case_id = None

    try:
        c_res = client.post("/api/v1/cases", json={
            "borrowerName": "Empty File Test", "bankName": "SBI", "branch": "Main",
            "loanAmount": "50L", "propertyAddress": "Test", "surveyNumber": "1"
        })
        case_id = c_res.json()["id"]

        # Upload 0-byte file
        files = {"file": ("empty.pdf", b"", "application/pdf")}
        res_upload = client.post(f"/api/v1/cases/{case_id}/documents/upload", files=files)
        assert res_upload.status_code == 400
        assert "empty" in res_upload.json()["detail"].lower()

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        try:
            if case_id:
                db.query(CaseModel).filter(CaseModel.id == case_id).delete()
            db.query(ProfileModel).filter(ProfileModel.id == "qa-neg-02").delete()
            db.commit()
        finally:
            db.close()


def test_neg_03_nonexistent_entity_lookups_return_404():
    """[NEGATIVE] Queries for non-existent cases, documents, reports return 404."""
    test_user = AuthenticatedUser(user_id="qa-neg-03", tenant_id="t-neg", email="neg3@test.in")
    app.dependency_overrides[get_current_user] = lambda: test_user

    fake_id = "non-existent-uuid-99999"
    assert client.get(f"/api/v1/cases/{fake_id}").status_code == 404
    assert client.get(f"/api/v1/cases/{fake_id}/documents").status_code == 404
    assert client.get(f"/api/v1/cases/{fake_id}/scrutiny/findings").status_code == 404
    assert client.get(f"/api/v1/cases/{fake_id}/queries").status_code == 404
    assert client.get(f"/api/v1/cases/{fake_id}/report").status_code == 404
    assert client.get(f"/api/v1/cases/{fake_id}/report/export-pdf").status_code == 404
    assert client.get(f"/api/v1/documents/{fake_id}/content").status_code == 404
    assert client.patch(f"/api/v1/scrutiny/findings/{fake_id}", json={"decision": "accepted"}).status_code == 404

    app.dependency_overrides.pop(get_current_user, None)


# ==============================================================================
# 4. INTEGRATION & CLOUD CONNECTIVITY
# ==============================================================================

def test_integ_01_live_postgresql_connectivity():
    """[INTEGRATION] Verifies live connectivity to configured database."""
    status = verify_database_connection()
    assert status["status"] == "connected"
    assert status["db_type"] in ["postgresql", "sqlite"]


def test_integ_02_health_details_contract():
    """[INTEGRATION] Detailed health endpoint reports readiness."""
    res = client.get("/api/v1/health/details")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["tenant_isolation_enforced"] is True


def test_integ_03_dev_auth_registration_service():
    """[INTEGRATION] Dev registration endpoint generates verified link without rate limit error."""
    import httpx
    test_email = f"qa.regtest.{uuid.uuid4().hex[:6]}@lsr-portal.internal"
    res = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "fullName": "Adv. Integration Tester",
        "barEnrollmentNumber": "KAR/2026/7788",
        "chamberName": "Integration Test Chamber"
    })
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["success"] is True
    assert data["requiresEmailConfirmation"] is True
    assert data["confirmationLink"] is not None
    assert "https://" in data["confirmationLink"]
    assert "verify" in data["confirmationLink"]

    # Clean up test user from Supabase Auth
    user_id = data.get("userId")
    if user_id and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            headers = {
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
            }
            httpx.delete(f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{user_id}", headers=headers)
        except Exception:
            pass


# ==============================================================================
# 5. PRODUCTION HARDENING & SECURITY REGRESSION SUITE
# ==============================================================================

def test_sec_04_document_signed_url_tenant_isolation():
    """[SECURITY] Signed URL endpoint strictly enforces advocate ownership."""
    user_a = AuthenticatedUser(user_id="adv-iso-url-a", tenant_id="t-a", email="iso_a@test.in")
    user_b = AuthenticatedUser(user_id="adv-iso-url-b", tenant_id="t-b", email="iso_b@test.in")

    # User A creates case and uploads deed
    app.dependency_overrides[get_current_user] = lambda: user_a
    c_res = client.post("/api/v1/cases", json={
        "borrowerName": "Deed Owner Borrower",
        "bankName": "HDFC Bank",
        "branch": "Koramangala",
        "loanAmount": "80L",
        "propertyAddress": "123 Defense Colony",
        "surveyNumber": "Sy 88/1",
    })
    assert c_res.status_code == 201
    case_a_id = c_res.json()["id"]

    pdf_bytes = generate_synthetic_deed_pdf("CONFIDENTIAL DEED")
    up_res = client.post(
        f"/api/v1/cases/{case_a_id}/documents/upload",
        files={"file": ("confidential.pdf", pdf_bytes, "application/pdf")},
        data={"doc_type": "Sale Deed / Title Deed"}
    )
    assert up_res.status_code == 201
    doc_id = up_res.json()["id"]

    # User B attempts to access signed-url for User A's document
    app.dependency_overrides[get_current_user] = lambda: user_b
    res_b = client.get(f"/api/v1/documents/{doc_id}/signed-url")
    assert res_b.status_code == 404, f"Expected 404, got {res_b.status_code}"

    # Clean up
    app.dependency_overrides[get_current_user] = lambda: user_a
    client.delete(f"/api/v1/cases/{case_a_id}")
    app.dependency_overrides.pop(get_current_user, None)


def test_sec_05_document_deletion_tenant_isolation():
    """[SECURITY] Document deletion strictly rejects cross-tenant requests."""
    user_a = AuthenticatedUser(user_id="adv-del-a", tenant_id="t-a", email="del_a@test.in")
    user_b = AuthenticatedUser(user_id="adv-del-b", tenant_id="t-b", email="del_b@test.in")

    app.dependency_overrides[get_current_user] = lambda: user_a
    c_res = client.post("/api/v1/cases", json={
        "borrowerName": "Delete Isolation Borrower",
        "bankName": "ICICI Bank",
        "branch": "Indiranagar",
        "loanAmount": "45L",
        "propertyAddress": "45 Lakeview",
        "surveyNumber": "Sy 12",
    })
    assert c_res.status_code == 201
    case_a_id = c_res.json()["id"]

    up_res = client.post(
        f"/api/v1/cases/{case_a_id}/documents/upload",
        files={"file": ("safe_deed.pdf", generate_synthetic_deed_pdf(), "application/pdf")},
        data={"doc_type": "Sale Deed / Title Deed"}
    )
    doc_id = up_res.json()["id"]

    # User B tries to delete User A's document
    app.dependency_overrides[get_current_user] = lambda: user_b
    del_res = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_res.status_code == 404

    # Verify document still exists
    app.dependency_overrides[get_current_user] = lambda: user_a
    verify_res = client.get(f"/api/v1/documents/{doc_id}/content")
    assert verify_res.status_code == 200

    # Clean up
    client.delete(f"/api/v1/cases/{case_a_id}")
    app.dependency_overrides.pop(get_current_user, None)


def test_sec_06_storage_path_traversal_defense():
    """[SECURITY] Path traversal attempts to read files outside storage root are blocked."""
    from app.services.storage_service import storage_service
    # Attempt directory traversal
    result = storage_service.get_document_bytes("../../app/core/config.py")
    assert result is None, "Path traversal attempt must return None"

    result_win = storage_service.get_document_bytes("..\\..\\app\\core\\config.py")
    assert result_win is None, "Windows path traversal attempt must return None"


def test_sec_07_signed_report_immutability_and_amend_flow():
    """[INTEGRITY] Digitally signed reports cannot be mutated unless explicitly amended."""
    advocate = AuthenticatedUser(user_id="adv-immutability", tenant_id="t-imm", email="imm@bar.in")
    app.dependency_overrides[get_current_user] = lambda: advocate

    c_res = client.post("/api/v1/cases", json={
        "borrowerName": "Immutable Report Borrower",
        "bankName": "Canara Bank",
        "branch": "MG Road",
        "loanAmount": "60L",
        "propertyAddress": "Plot 100",
        "surveyNumber": "Sy 200",
    })
    case_id = c_res.json()["id"]

    # Sign the report
    sign_res = client.post(f"/api/v1/cases/{case_id}/report/sign")
    assert sign_res.status_code == 200
    assert sign_res.json()["isSigned"] is True

    # Attempt to modify opinion on signed report
    mod_res = client.put(f"/api/v1/cases/{case_id}/report", json={
        "opinionOutcome": "Rejected / Defective Title",
    })
    assert mod_res.status_code == 400, "Signed report modification must be rejected with 400"
    assert "Cannot modify" in mod_res.json()["detail"]

    # Lawyer explicitly unlocks / amends report
    amend_res = client.post(f"/api/v1/cases/{case_id}/report/amend")
    assert amend_res.status_code == 200
    assert amend_res.json()["isSigned"] is False

    # Now modification succeeds
    mod_res_2 = client.put(f"/api/v1/cases/{case_id}/report", json={
        "opinionOutcome": "Clear with Pre-Disbursement Conditions",
    })
    assert mod_res_2.status_code == 200
    assert mod_res_2.json()["opinionOutcome"] == "Clear with Pre-Disbursement Conditions"

    # Clean up
    client.delete(f"/api/v1/cases/{case_id}")
    app.dependency_overrides.pop(get_current_user, None)


def test_neg_04_unsupported_document_magic_bytes_rejected():
    """[NEGATIVE] Uploading malicious or unsupported file types is rejected."""
    advocate = AuthenticatedUser(user_id="adv-magic-test", tenant_id="t-mag", email="mag@bar.in")
    app.dependency_overrides[get_current_user] = lambda: advocate

    c_res = client.post("/api/v1/cases", json={
        "borrowerName": "Magic Byte Borrower",
        "bankName": "Axis Bank",
        "branch": "Whitefield",
        "loanAmount": "30L",
        "propertyAddress": "Site 5",
        "surveyNumber": "Sy 11",
    })
    case_id = c_res.json()["id"]

    # Upload raw shell script disguised as PDF
    evil_bytes = b"#!/bin/bash\necho 'malicious script'\n"
    res = client.post(
        f"/api/v1/cases/{case_id}/documents/upload",
        files={"file": ("fake.pdf", evil_bytes, "application/pdf")},
        data={"doc_type": "Sale Deed / Title Deed"}
    )
    assert res.status_code == 400
    assert "Unsupported document format" in res.json()["detail"]

    # Clean up
    client.delete(f"/api/v1/cases/{case_id}")
    app.dependency_overrides.pop(get_current_user, None)


def test_neg_05_duplicate_case_number_returns_409_conflict():
    """[NEGATIVE] Creating case with duplicate caseNumber returns clean 409 Conflict."""
    advocate = AuthenticatedUser(user_id="adv-conflict-test", tenant_id="t-conf", email="conf@bar.in")
    app.dependency_overrides[get_current_user] = lambda: advocate

    fixed_case_num = f"LSR-UNIQUE-{uuid.uuid4().hex[:4].upper()}"
    c1 = client.post("/api/v1/cases", json={
        "caseNumber": fixed_case_num,
        "borrowerName": "First Applicant",
        "bankName": "Bank of India",
        "branch": "Fort",
        "loanAmount": "50L",
        "propertyAddress": "Marine Drive",
        "surveyNumber": "Sy 1",
    })
    assert c1.status_code == 201

    c2 = client.post("/api/v1/cases", json={
        "caseNumber": fixed_case_num,
        "borrowerName": "Duplicate Applicant",
        "bankName": "Bank of India",
        "branch": "Fort",
        "loanAmount": "50L",
        "propertyAddress": "Marine Drive",
        "surveyNumber": "Sy 1",
    })
    assert c2.status_code == 409, f"Expected 409, got {c2.status_code}: {c2.text}"

    # Clean up
    client.delete(f"/api/v1/cases/{c1.json()['id']}")
    app.dependency_overrides.pop(get_current_user, None)


def test_fn_02_property_details_update_via_patch():
    """[FUNCTIONAL] Advocate can update property boundaries, survey number, and address."""
    advocate = AuthenticatedUser(user_id="adv-prop-update", tenant_id="t-prop", email="prop@bar.in")
    app.dependency_overrides[get_current_user] = lambda: advocate

    c_res = client.post("/api/v1/cases", json={
        "borrowerName": "Property Update Borrower",
        "bankName": "Union Bank",
        "branch": "Jayanagar",
        "loanAmount": "1.2 Cr",
        "propertyAddress": "Old Address",
        "surveyNumber": "Old Sy 10",
        "boundaries": {"north": "Old N", "south": "Old S", "east": "Old E", "west": "Old W"},
    })
    case_id = c_res.json()["id"]

    patch_res = client.patch(f"/api/v1/cases/{case_id}", json={
        "propertyAddress": "Corrected Revenue Address No. 44",
        "surveyNumber": "Sy. No. 10/2A",
        "boundaries": {"north": "Verified 60ft Road", "south": "Park", "east": "Site 43", "west": "Site 45"}
    })
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["propertyAddress"] == "Corrected Revenue Address No. 44"
    assert data["surveyNumber"] == "Sy. No. 10/2A"
    assert data["boundaries"]["north"] == "Verified 60ft Road"
    assert data["boundaries"]["south"] == "Park"

    # Clean up
    client.delete(f"/api/v1/cases/{case_id}")
    app.dependency_overrides.pop(get_current_user, None)


def test_fn_03_case_lookup_by_business_case_number():
    """[FUNCTIONAL] Endpoints resolve cases seamlessly by business case_number."""
    advocate = AuthenticatedUser(user_id="adv-lookup-test", tenant_id="t-look", email="look@bar.in")
    app.dependency_overrides[get_current_user] = lambda: advocate

    custom_ref = f"LSR-REF-{uuid.uuid4().hex[:4].upper()}"
    c_res = client.post("/api/v1/cases", json={
        "caseNumber": custom_ref,
        "borrowerName": "Ref Lookup Borrower",
        "bankName": "Federal Bank",
        "branch": "Kaloor",
        "loanAmount": "75L",
        "propertyAddress": "Marine Walk",
        "surveyNumber": "Sy 99",
    })
    assert c_res.status_code == 201

    # Fetch by business case number
    fetch_res = client.get(f"/api/v1/cases/{custom_ref}")
    assert fetch_res.status_code == 200
    assert fetch_res.json()["caseNumber"] == custom_ref

    # Fetch documents by business case number
    doc_res = client.get(f"/api/v1/cases/{custom_ref}/documents")
    assert doc_res.status_code == 200

    # Fetch findings by business case number
    find_res = client.get(f"/api/v1/cases/{custom_ref}/scrutiny/findings")
    assert find_res.status_code == 200

    # Fetch report by business case number
    rep_res = client.get(f"/api/v1/cases/{custom_ref}/report")
    assert rep_res.status_code == 200

    # Clean up
    client.delete(f"/api/v1/cases/{custom_ref}")
    app.dependency_overrides.pop(get_current_user, None)
