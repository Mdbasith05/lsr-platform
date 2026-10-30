import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.ai_scrutiny_service import AiScrutinyService
from app.services.pdf_service import pdf_service

client = TestClient(app)


def test_ai_hallucination_discarded_when_agricultural_demarcation_absent():
    """Verify that AI-generated findings claiming agricultural survey demarcation
    are strictly discarded when the uploaded document text does not contain any agricultural keywords.
    """
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "findings": [
            {
                "title": "Agricultural Survey Demarcation Issue",
                "category": "Boundary Mismatch",
                "severity": "critical",
                "description": "Deed recitals indicate prior transition from agricultural survey demarcations and patta records.",
                "source_doc_name": "Sale_Deed_Urban_Flat.pdf",
                "page_number": 4,
                "evidence_snippet": "subject to verification of revenue patta records and municipal boundary demarcation",
                "ai_confidence": 0.95,
                "suggested_query_text": "Produce DC Conversion order and layout sanction."
            }
        ]
    })

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    case_data = {
        "borrower_name": "Arun Kumar",
        "property_type": "Residential Apartment",
        "boundary_east": "Flat 302",
    }
    # Urban deed containing NO agricultural or patta mentions
    docs = [
        {
            "id": "doc-urban-1",
            "file_name": "Sale_Deed_Urban_Flat.pdf",
            "doc_type": "Sale Deed / Title Deed",
            "doc_date": "2022-01-15",
            "pages": [
                {
                    "page_number": 1,
                    "raw_text": "Absolute Conveyance executed in favor of Arun Kumar for Apartment Unit 301, Brigade Gateway.",
                },
                {
                    "page_number": 2,
                    "raw_text": "Schedule A: All that piece and parcel of residential land bounded on East by Flat 302.",
                }
            ],
        }
    ]

    with patch("google.genai.Client", return_value=mock_client):
        with patch.object(settings, "GEMINI_API_KEY", "test-key"):
            findings = AiScrutinyService.analyze_case_documents(case_data, docs)

            # Hallucinated agricultural finding MUST be rejected
            agri_titles = [f["title"] for f in findings if "agricultural" in f["title"].lower() or "patta" in f["description"].lower()]
            assert len(agri_titles) == 0, f"Expected hallucinated agricultural finding to be discarded, but got: {agri_titles}"


def test_accurate_page_reference_grounding():
    """Verify that when Gemini cites an evidence snippet, the verification engine
    locates the exact page where that evidence appears and corrects the page citation.
    """
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "findings": [
            {
                "title": "Prior Unregistered Agreement Reference",
                "category": "Encumbrance / Charge",
                "severity": "warning",
                "description": "Deed refers to prior agreement dated 10-05-2012.",
                "source_doc_name": "Sale_Deed.pdf",
                "page_number": 1,  # Gemini claims Page 1
                "evidence_snippet": "prior agreement of sale dated 10-05-2012",
                "ai_confidence": 0.95,
                "suggested_query_text": "Confirm cancellation of 2012 agreement."
            }
        ]
    })

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    case_data = {"borrower_name": "Arun Kumar"}
    docs = [
        {
            "id": "doc-1",
            "file_name": "Sale_Deed.pdf",
            "doc_type": "Sale Deed",
            "pages": [
                {"page_number": 1, "raw_text": "Deed executed on 14th day of October 2016."},
                {"page_number": 2, "raw_text": "Vendor declares absolute title free from court attachments."},
                {"page_number": 3, "raw_text": "The Purchaser acknowledges prior agreement of sale dated 10-05-2012 has been superseded."},
            ],
        }
    ]

    with patch("google.genai.Client", return_value=mock_client):
        with patch.object(settings, "GEMINI_API_KEY", "test-key"):
            findings = AiScrutinyService.analyze_case_documents(case_data, docs)

            assert len(findings) == 1
            # Must ground to Page 3 where the text actually exists!
            assert findings[0]["page_number"] == 3


def test_rule_engine_boundary_and_chain_grounding():
    """Verify that deterministic rule engine:
    1. Does NOT hallucinate agricultural survey demarcations.
    2. Correctly flags missing Form 15 EC.
    3. Traces chain deficit factually.
    """
    case_data = {
        "borrower_name": "Test User",
        "boundary_east": "Site No. 15",
    }
    docs = [
        {
            "id": "doc-1",
            "file_name": "Registered_Sale_Deed_2021.pdf",
            "doc_type": "Sale Deed / Title Deed",
            "doc_date": "2021-06-15",
            "pages": [
                {
                    "page_number": 1,
                    "raw_text": "This Deed of Absolute Sale is made on the 15th day of June 2021.",
                },
                {
                    "page_number": 2,
                    "raw_text": "Schedule of Property: Bounded on the East by: Site No. 15, West by: Road.",
                }
            ],
        }
    ]

    with patch.object(settings, "GEMINI_API_KEY", ""):
        findings = AiScrutinyService.analyze_case_documents(case_data, docs)

        # 1. No agricultural hallucinations
        for f in findings:
            assert "agricultural" not in f["description"].lower()
            assert "agricultural" not in f["title"].lower()

        # 2. Form 15 EC check must be present (user confirmed working)
        ec_findings = [f for f in findings if "Form 15" in f["title"]]
        assert len(ec_findings) == 1
        assert ec_findings[0]["category"] == "Missing Mandatory Document"

        # 3. Boundary check must match genuine deed text
        b_findings = [f for f in findings if "Boundary" in f["title"]]
        assert len(b_findings) == 1
        assert b_findings[0]["page_number"] == 2
        assert "East by: Site No. 15" in b_findings[0]["evidence_snippet"]


def test_pdf_content_endpoint_and_pages():
    """Verify that GET /documents/{id}/content returns valid PDF media type and inline disposition."""
    # First get a valid case and document
    cases_res = client.get("/api/v1/cases")
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) > 0
    case_id = cases[0]["id"]

    # Ingest a text-based test deed
    import io
    import fitz
    pdf_doc = fitz.open()
    page = pdf_doc.new_page()
    page.insert_text((72, 72), "Registered Conveyance Deed dated 14th day of October 2016.")
    page.insert_text((72, 100), "Bounded on East by: Site No. 15.")
    pdf_bytes = pdf_doc.tobytes()
    pdf_doc.close()

    upload_res = client.post(
        f"/api/v1/cases/{case_id}/documents/upload",
        files={"file": ("Test_Deed.pdf", pdf_bytes, "application/pdf")},
        data={"doc_type": "Sale Deed / Title Deed"},
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]

    # Verify /content endpoint
    content_res = client.get(f"/api/v1/documents/{doc_id}/content")
    assert content_res.status_code == 200
    assert content_res.headers["content-type"] == "application/pdf"
    assert "inline" in content_res.headers.get("content-disposition", "")
    assert "frame-ancestors" in content_res.headers.get("content-security-policy", "")
    assert "X-Frame-Options" not in content_res.headers

    # Verify /pages endpoint
    pages_res = client.get(f"/api/v1/documents/{doc_id}/pages")
    assert pages_res.status_code == 200
    pages = pages_res.json()
    assert len(pages) == 1
    assert "Registered Conveyance Deed" in pages[0]["rawText"]
