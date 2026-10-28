import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db

# Initialize database tables and seed
init_db()
client = TestClient(app)


def create_sample_pdf_bytes() -> bytes:
    """Creates a valid 2-page sample Indian deed PDF in memory."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()

    story = [
        Paragraph("DEED OF ABSOLUTE SALE (Document No. KRI-1-08921-2016-17)", styles["Heading1"]),
        Paragraph("Executed on 14th day of October 2016 at Sub-Registrar Krishnarajapuram.", styles["Normal"]),
        Paragraph("Vendor: Sri M. Narayana Murthy. Purchaser: Sri Rajesh V. Kumar.", styles["Normal"]),
        PageBreak(),
        Paragraph("SCHEDULE OF PROPERTY: Sy. No. 74/2, Site No. 42, measuring 2400 sq ft.", styles["Heading2"]),
        Paragraph("BOUNDARIES: North by 30ft Road, South by Site 43, East by Site 15, West by Private Land.", styles["Normal"]),
    ]
    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


def test_complete_end_to_end_workflow():
    # 1. Create a new scrutiny dossier
    case_payload = {
        "borrowerName": "Deepak Natarajan",
        "coBorrowerName": "Kavitha Deepak",
        "bankName": "ICICI Bank",
        "branch": "MG Road, Bengaluru",
        "loanAmount": "₹95,00,000",
        "loanType": "Housing Loan / Mortgage Scrutiny",
        "propertyType": "Residential Plot",
        "propertyAddress": "Site 88, Green Glen Layout, Bellandur, Bengaluru",
        "surveyNumber": "Sy. No. 51/3",
        "khataNumber": "BBMP/KHA/2026/1102",
        "boundaries": {
            "north": "40ft Main Road",
            "south": "Site No. 89",
            "east": "Site No. 72",
            "west": "Private Layout Boundary"
        }
    }
    res = client.post("/api/v1/cases", json=case_payload)
    assert res.status_code == 201, res.text
    case_data = res.json()
    case_id = case_data["id"]
    assert case_data["borrowerName"] == "Deepak Natarajan"
    assert case_data["status"] == "Intake"

    # 2. Upload sample PDF deed
    pdf_bytes = create_sample_pdf_bytes()
    files = {"file": ("Sale_Deed_2016_Deepak.pdf", pdf_bytes, "application/pdf")}
    data = {"doc_type": "Sale Deed / Title Deed"}
    res_upload = client.post(f"/api/v1/cases/{case_id}/documents/upload", files=files, data=data)
    assert res_upload.status_code == 201, res_upload.text
    doc_data = res_upload.json()
    assert doc_data["pageCount"] >= 2
    assert doc_data["status"] == "Review Ready"
    doc_id = doc_data["id"]

    # 3. Verify PDF content streaming endpoint
    res_content = client.get(f"/api/v1/documents/{doc_id}/content")
    assert res_content.status_code == 200
    assert res_content.headers["content-type"] == "application/pdf"
    assert len(res_content.content) > 100

    # 4. Trigger AI Scrutiny Analysis (using deterministic rule engine)
    from unittest.mock import patch
    from app.core.config import settings

    with patch.object(settings, "GEMINI_API_KEY", ""):
        res_scrutiny = client.post(f"/api/v1/cases/{case_id}/scrutiny/analyze")
    assert res_scrutiny.status_code == 200, res_scrutiny.text
    findings = res_scrutiny.json()
    assert len(findings) > 0
    first_finding = findings[0]
    assert "title" in first_finding
    assert first_finding["severity"] in ["critical", "warning", "info"]
    finding_id = first_finding["id"]

    # 5. Lawyer reviews and accepts finding with chamber note
    res_decision = client.patch(
        f"/api/v1/scrutiny/findings/{finding_id}",
        json={"decision": "accepted", "notes": "Verified against survey sketch. Requisition issued."}
    )
    assert res_decision.status_code == 200
    updated_finding = res_decision.json()
    assert updated_finding["lawyerDecision"] == "accepted"

    # 6. Draft a bank requisition from finding
    res_query = client.post(
        f"/api/v1/cases/{case_id}/queries",
        json={
            "title": f"Requisition: {first_finding['title']}",
            "draftText": first_finding.get("suggestedQueryText") or "Furnish certified clarification plan.",
            "linkedFindingId": finding_id
        }
    )
    assert res_query.status_code == 201
    query_data = res_query.json()
    assert query_data["queryCode"].startswith("REQ-")

    # 7. Check draft LSR report
    res_report = client.get(f"/api/v1/cases/{case_id}/report")
    assert res_report.status_code == 200
    report_data = res_report.json()
    assert report_data["isSigned"] is False
    assert len(report_data["preDisbursementConditions"]) > 0

    # 8. Update narrative in report
    res_update_report = client.put(
        f"/api/v1/cases/{case_id}/report",
        json={
            "chainOfTitleNarrative": "Chain verified up to registered Sale Deed dated 14-Oct-2016.",
            "opinionOutcome": "Clear with Pre-Disbursement Conditions"
        }
    )
    assert res_update_report.status_code == 200
    assert res_update_report.json()["chainOfTitleNarrative"] == "Chain verified up to registered Sale Deed dated 14-Oct-2016."

    # 9. Advocate digital sign-off
    res_sign = client.post(f"/api/v1/cases/{case_id}/report/sign")
    assert res_sign.status_code == 200
    assert res_sign.json()["isSigned"] is True

    # 10. Export official PDF
    res_pdf = client.get(f"/api/v1/cases/{case_id}/report/export-pdf")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF-")
