import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.ai_scrutiny_service import AiScrutinyService

client = TestClient(app)


def test_custom_finding_and_decision():
    # Fetch first case
    cases_res = client.get("/api/v1/cases")
    case_id = cases_res.json()[0]["id"]

    # Add custom manual observation
    finding_payload = {
        "title": "Unregistered Agreement of Sale Noted in Encumbrance Recital",
        "category": "Encumbrance / Charge",
        "severity": "warning",
        "description": "Recitals in 2016 deed refer to prior 2014 unregistered agreement.",
        "pageNumber": 3,
        "evidenceSnippet": "Agreement of sale dated 12-05-2014 executed without registration.",
        "aiConfidence": 1.0,
        "lawyerDecision": "pending",
        "suggestedQueryText": "Confirm whether 2014 agreement was cancelled or superseded."
    }
    res_add = client.post(f"/api/v1/cases/{case_id}/scrutiny/findings", json=finding_payload)
    assert res_add.status_code == 201
    f_id = res_add.json()["id"]

    # Dismiss finding
    res_dismiss = client.patch(f"/api/v1/scrutiny/findings/{f_id}", json={"decision": "dismissed", "notes": "Superseded by absolute registered deed."})
    assert res_dismiss.status_code == 200
    assert res_dismiss.json()["lawyerDecision"] == "dismissed"


def test_gemini_model_configuration():
    """Verify GEMINI_MODEL setting defaults to gemini-3.8-flash."""
    assert hasattr(settings, "GEMINI_MODEL")
    assert settings.GEMINI_MODEL == "gemini-3.8-flash"


def test_configured_model_passed_to_gemini_client():
    """Verify AiScrutinyService passes configured model to Google GenAI client."""
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "findings": [
            {
                "title": "Chain Continuity Gap Identified by Gemini",
                "category": "Chain of Title Break",
                "severity": "critical",
                "description": "Missing 1998 partition deed mentioned in recitals.",
                "source_doc_name": "Sale_Deed_2016.pdf",
                "page_number": 2,
                "evidence_snippet": "subject to partition deed dated 1998",
                "ai_confidence": 0.98,
                "suggested_query_text": "Furnish certified copy of 1998 partition deed."
            }
        ]
    })

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    case_data = {
        "borrower_name": "Rajesh Kumar",
        "property_type": "Residential Plot",
        "survey_number": "Sy. No. 74/2",
        "boundary_north": "Road",
        "boundary_south": "Site 43",
        "boundary_east": "Site 15",
        "boundary_west": "Private Land",
    }
    docs = [
        {
            "id": "doc-test-1",
            "file_name": "Sale_Deed_2016.pdf",
            "doc_type": "Sale Deed",
            "pages": [{"page_number": 1, "raw_text": "Sample text"}],
        }
    ]

    with patch("google.genai.Client", return_value=mock_client):
        with patch.object(settings, "GEMINI_API_KEY", "test-valid-api-key"):
            with patch.object(settings, "GEMINI_MODEL", "gemini-3.8-flash"):
                findings = AiScrutinyService.analyze_case_documents(case_data, docs)

                assert len(findings) == 1
                assert findings[0]["title"] == "Chain Continuity Gap Identified by Gemini"
                assert findings[0]["ai_confidence"] == 0.98
                assert findings[0]["source_doc_id"] == "doc-test-1"

                # Verify client was called with configured model
                mock_client.models.generate_content.assert_called_once()
                call_kwargs = mock_client.models.generate_content.call_args[1]
                assert call_kwargs["model"] == "gemini-3.8-flash"


def test_model_override_passed_to_gemini_client():
    """Verify passing explicit model_name overrides the default configured model."""
    mock_response = MagicMock()
    mock_response.text = json.dumps({"findings": []})
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    case_data = {"borrower_name": "Test User"}
    docs = [{"id": "doc-1", "file_name": "Deed.pdf", "doc_type": "Sale Deed", "pages": []}]

    with patch("google.genai.Client", return_value=mock_client):
        with patch.object(settings, "GEMINI_API_KEY", "test-valid-api-key"):
            AiScrutinyService.analyze_case_documents(case_data, docs, model_name="gemini-3.8-pro")
            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert call_kwargs["model"] == "gemini-3.8-pro"


def test_fallback_to_rule_engine_on_gemini_api_failure():
    """Verify AiScrutinyService safely falls back to deterministic rule engine when Gemini fails."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("404 Model Not Found / Service Unavailable")

    case_data = {
        "borrower_name": "Test Borrower",
        "boundary_east": "Site 15",
    }
    docs = [
        {
            "id": "doc-1",
            "file_name": "Sale_Deed_2016.pdf",
            "doc_type": "Sale Deed",
            "doc_date": "2016-10-14",
            "page_count": 2,
            "pages": [{"page_number": 1, "raw_text": "Sample text"}],
        }
    ]

    with patch("google.genai.Client", return_value=mock_client):
        with patch.object(settings, "GEMINI_API_KEY", "test-valid-api-key"):
            findings = AiScrutinyService.analyze_case_documents(case_data, docs)

            # Verifies graceful fallback to deterministic rule engine
            assert len(findings) > 0
            titles = [f["title"] for f in findings]
            assert any("30-Year Chain Continuity Deficit" in t for t in titles)
            assert any("Schedule Boundary Verification" in t for t in titles)


def test_fallback_when_api_key_empty():
    """Verify AiScrutinyService falls back to rule engine when no API key is configured."""
    case_data = {"borrower_name": "Test Borrower"}
    docs = [
        {
            "id": "doc-1",
            "file_name": "Sale_Deed_2016.pdf",
            "doc_type": "Sale Deed",
            "pages": [{"page_number": 1, "raw_text": "Sample text"}],
        }
    ]

    with patch.object(settings, "GEMINI_API_KEY", ""):
        findings = AiScrutinyService.analyze_case_documents(case_data, docs)
        assert len(findings) > 0
        titles = [f["title"] for f in findings]
        assert any("30-Year Chain Continuity Deficit" in t for t in titles)
