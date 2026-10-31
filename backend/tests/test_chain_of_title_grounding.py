import os
import pytest
from app.services.pdf_service import PdfService
from app.services.ai_scrutiny_service import ai_scrutiny_service

SAMPLE_DEED_PATH = r"c:\Users\mohammed basith\Downloads\sample_sale_deed_for_lsr_testing.pdf"


def test_user_sample_deed_grounding_and_no_false_chain_break():
    """
    Tests scrutiny on the authentic sample deed provided by the user.
    Verifies:
    1. No false 'Chain of Title Break' is generated.
    2. Form 15 Encumbrance Certificate is flagged as 'Missing Mandatory Document'.
    3. Referenced prior deed Doc. No. 1842/2008 is extracted from recitals and flagged as 'Missing Mandatory Document'.
    4. 30-year continuity deficit accounts for the 18 years traced to 2008.
    5. Multi-line Eastern boundary on Page 2 conforms with case schedule without false mismatch warnings.
    """
    assert os.path.exists(SAMPLE_DEED_PATH), f"Sample deed not found at {SAMPLE_DEED_PATH}"

    with open(SAMPLE_DEED_PATH, "rb") as f:
        pdf_bytes = f.read()

    page_count, pages, metadata = PdfService.extract_pages_and_metadata(pdf_bytes)
    assert page_count == 2
    assert metadata.get("doc_date") == "15 June 2018"
    assert metadata.get("sub_registrar_office") == "Thanjavur"

    case_data = {
        "id": "case-grounding-test",
        "case_number": "LSR-GROUNDING-001",
        "property_schedule": "Door No. 47/1, New Street, Madukkukur, Thanjavur District",
        "boundary_east": "Private Property",
        "boundary_west": "Open Space",
        "boundary_north": "Adjacent Site No. 41",
        "boundary_south": "30-foot Road",
    }

    docs_payload = [{
        "id": "doc-user-primary",
        "file_name": "sample_sale_deed_for_lsr_testing.pdf",
        "doc_type": "Specimen Sale Deed",
        "doc_date": metadata.get("doc_date"),
        "registration_number": metadata.get("registration_number"),
        "pages": pages,
    }]

    findings = ai_scrutiny_service._execute_rule_engine(case_data, docs_payload)

    # 1. Assert NO Chain of Title Break
    chain_breaks = [f for f in findings if f["category"] == "Chain of Title Break"]
    assert len(chain_breaks) == 0, f"Unexpected Chain of Title Break generated: {chain_breaks}"

    # 2. Assert Missing Form 15 Encumbrance Certificate
    ec_findings = [f for f in findings if "Encumbrance Certificate" in f["title"]]
    assert len(ec_findings) == 1
    assert ec_findings[0]["category"] == "Missing Mandatory Document"
    assert ec_findings[0]["severity"] == "critical"

    # 3. Assert Referenced Prior Deed Extracted from Recitals
    ref_findings = [f for f in findings if "1842/2008" in f["title"]]
    assert len(ref_findings) == 1
    assert ref_findings[0]["category"] == "Missing Mandatory Document"
    assert ref_findings[0]["severity"] == "warning"
    assert "Doc. No. 1842/2008" in ref_findings[0]["evidence_snippet"]
    assert "20 August 2008" in ref_findings[0]["evidence_snippet"]
    assert ref_findings[0]["page_number"] == 1

    # 4. Assert 30-Year Chain Deficit Traces to 2008 (18 Years)
    deficit_findings = [f for f in findings if "Chain Continuity Deficit" in f["title"]]
    assert len(deficit_findings) == 1
    assert deficit_findings[0]["category"] == "Missing Mandatory Document"
    assert "18 Years Traced" in deficit_findings[0]["title"]
    assert "Doc. No. 1842/2008" in deficit_findings[0]["evidence_snippet"]

    # 5. Assert Boundary Match on Page 2
    boundary_findings = [f for f in findings if f["category"] == "Boundary Mismatch"]
    assert len(boundary_findings) == 1
    assert boundary_findings[0]["severity"] == "info"
    assert "Recital Match" in boundary_findings[0]["title"]
    assert boundary_findings[0]["page_number"] in [1, 2]
    assert "Private Property" in boundary_findings[0]["evidence_snippet"]


def test_differentiating_uploaded_vs_unuploaded_referenced_deeds():
    """
    Verifies that when a referenced prior deed is uploaded in the matter dossier,
    the system does NOT flag it as 'Referenced Prior Deed Not Furnished'.
    """
    primary_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "Sale Deed executed on 10 January 2020. "
                "Seller acquired title under prior registered Sale Deed bearing Doc. No. 5555/2005 "
                "registered on 15 July 2005 at Sub-Registrar Office, Bangalore."
            ),
        }
    ]
    mother_deed_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "Sale Deed dated 15 July 2005 bearing Document No. 5555/2005 registered at Bangalore."
            ),
        }
    ]

    case_data = {"id": "c-test-2", "case_number": "LSR-TEST-2"}

    # Dossier WITH the mother deed uploaded
    docs_payload = [
        {
            "id": "doc-primary",
            "file_name": "sale_deed_2020.pdf",
            "doc_type": "Sale Deed",
            "doc_date": "10 January 2020",
            "pages": primary_pages,
        },
        {
            "id": "doc-mother",
            "file_name": "prior_link_deed_5555_2005.pdf",
            "doc_type": "Mother Deed",
            "doc_date": "15 July 2005",
            "registration_number": "5555/2005",
            "pages": mother_deed_pages,
        },
    ]

    findings = ai_scrutiny_service._execute_rule_engine(case_data, docs_payload)
    ref_findings = [f for f in findings if "Referenced Prior Deed Not Furnished" in f["title"]]
    assert len(ref_findings) == 0, "Uploaded mother deed should not be reported as missing"


def test_genuine_title_discontinuity_correctly_classified_as_chain_break():
    """
    Verifies that genuine legal discontinuities (e.g. unregistered partition, minor alienation)
    are strictly grounded and classified under 'Chain of Title Break'.
    """
    deed_with_defect_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "Deed of Sale executed on 12 March 2022. "
                "WHEREAS the ancestral property was partitioned orally among family members without registration "
                "in the year 2010, and vendor claims title pursuant to said oral partition."
            ),
        }
    ]

    case_data = {"id": "c-defect-test", "case_number": "LSR-DEFECT-001"}
    docs_payload = [
        {
            "id": "doc-defect",
            "file_name": "deed_with_oral_partition.pdf",
            "doc_type": "Sale Deed",
            "doc_date": "12 March 2022",
            "pages": deed_with_defect_pages,
        }
    ]

    findings = ai_scrutiny_service._execute_rule_engine(case_data, docs_payload)
    chain_breaks = [f for f in findings if f["category"] == "Chain of Title Break"]
    assert len(chain_breaks) == 1
    assert chain_breaks[0]["severity"] == "critical"
    assert "Unregistered Family Partition" in chain_breaks[0]["title"]
    assert "partitioned orally among family members without registration" in chain_breaks[0]["evidence_snippet"]


def test_scrutiny_rerun_purges_stale_findings_and_prevents_hallucination_leakage():
    """
    Verifies that running AI scrutiny on a case completely purges old/stale AI findings,
    preventing any previously hallucinated chain breaks or obsolete calculations from leaking.
    """
    import uuid
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.security import get_current_user, AuthenticatedUser
    from app.db.session import SessionLocal
    from app.db.models import CaseModel, ScrutinyFindingModel

    test_user_id = f"adv-test-{uuid.uuid4().hex[:8]}"
    advocate = AuthenticatedUser(
        user_id=test_user_id,
        tenant_id="tenant-test",
        email=f"{test_user_id}@testchambers.in",
        name="Advocate Test Lead",
        user_metadata={"full_name": "Advocate Test Lead"}
    )
    from app.core.security import get_current_user_stub
    app.dependency_overrides[get_current_user] = lambda: advocate
    app.dependency_overrides[get_current_user_stub] = lambda: advocate

    client = TestClient(app)
    db = SessionLocal()
    created_case_id = None

    try:
        # Create a test case via API (ensures profile and case setup)
        create_payload = {
            "caseNumber": f"LSR-T-{uuid.uuid4().hex[:8].upper()}",
            "borrowerName": "Test Grounding Borrower",
            "coBorrowerName": "Co-Borrower",
            "bankName": "State Bank of India",
            "branch": "Commercial Branch",
            "loanAmount": "Rs. 75,00,000",
            "loanType": "Housing Loan",
            "propertyType": "Residential Apartment",
            "propertyAddress": "Flat 302, Green Acres",
            "surveyNumber": "Sy. No. 44/2",
            "khataNumber": "BBMP/2026/123",
            "boundaries": {
                "north": "Road",
                "south": "Plot 2",
                "east": "Private Property",
                "west": "Park"
            }
        }
        res_create = client.post("/api/v1/cases", json=create_payload)
        assert res_create.status_code == 201
        created_case_id = res_create.json()["id"]

        # Inject an obsolete AI finding
        stale_id = f"fnd-stale-{uuid.uuid4().hex[:8]}"
        stale_finding = ScrutinyFindingModel(
            id=stale_id,
            case_id=created_case_id,
            source_doc_id=None,
            source_doc_name="fake_deed.pdf",
            title="Stale Hallucinated Chain Break 1996",
            category="Chain of Title Break",
            severity="critical",
            description="Fabricated chain break from old seed run.",
            page_number=1,
            evidence_snippet="Missing link deeds from 1996 to 2016.",
            ai_confidence=0.5,
            lawyer_decision="pending",
            is_ai_generated=True,
        )
        db.add(stale_finding)
        db.commit()

        # Verify it was added
        f_check = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.id == stale_id).first()
        assert f_check is not None

        # Re-run scrutiny via API
        res = client.post(f"/api/v1/cases/{created_case_id}/scrutiny/analyze")
        assert res.status_code == 200
        new_findings = res.json()

        # Assert stale hallucination is completely purged from response
        assert not any("Stale Hallucinated" in f["title"] for f in new_findings)

        # Assert it is deleted from database
        db_f = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.id == stale_id).first()
        assert db_f is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        # Cleanup
        if created_case_id:
            try:
                db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == created_case_id).delete()
                db.query(CaseModel).filter(CaseModel.id == created_case_id).delete()
                db.commit()
            except Exception:
                pass
        db.close()

