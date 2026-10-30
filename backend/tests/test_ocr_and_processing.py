import io
import pytest
from PIL import Image, ImageDraw
import pymupdf as fitz
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_service import pdf_service

client = TestClient(app)


def test_text_based_pdf_extraction():
    """Verifies that vector/native text in PDFs is cleanly extracted without needing OCR."""
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    page.insert_text(
        (50, 72),
        "SALE DEED\nDocument No: KRI-1-04221-2018-19\nDate: 15th day of November 2018\n"
        "Sub-Registrar Office of Bangalore North\n"
        "Schedule: Site No. 44, Sy No. 12/1, North: Road, South: Site 45",
        fontsize=12,
    )
    pdf_bytes = doc.tobytes()

    page_count, pages_data, metadata = pdf_service.extract_pages_and_metadata(pdf_bytes)

    assert page_count == 1
    assert len(pages_data) == 1
    assert pages_data[0]["ocr_applied"] is False
    assert "SALE DEED" in pages_data[0]["raw_text"]
    assert metadata["registration_number"] == "KRI-1-04221-2018-19"
    assert metadata["doc_date"] == "15th day of November 2018"
    assert "Bangalore North" in (metadata["sub_registrar_office"] or "")


def test_scanned_deed_rapid_ocr():
    """Verifies that scanned bitmap deed pages are processed by RapidOCR."""
    # Create an image containing text (mimicking a scanned physical deed)
    img = Image.new("RGB", (900, 450), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((30, 30), "DOCUMENT NO: KRI-1-08921-2016-17", fill=(0, 0, 0))
    draw.text((30, 80), "REGISTERED ON: 14th day of October 2016", fill=(0, 0, 0))
    draw.text((30, 130), "SUB-REGISTRAR OFFICE OF RAJAJINAGAR BANGALORE", fill=(0, 0, 0))
    draw.text((30, 180), "SCHEDULE PROPERTY: Sy No 42/1, North by Road, South by Site 12", fill=(0, 0, 0))

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()

    # Place image in PDF
    pdf_doc = fitz.open()
    page = pdf_doc.new_page(width=900, height=450)
    page.insert_image(fitz.Rect(0, 0, 900, 450), stream=img_bytes)
    scanned_pdf_bytes = pdf_doc.tobytes()

    page_count, pages_data, metadata = pdf_service.extract_pages_and_metadata(scanned_pdf_bytes)

    assert page_count == 1
    assert len(pages_data) == 1
    # RapidOCR should have recognized the text and set ocr_applied=True
    assert pages_data[0]["ocr_applied"] is True
    extracted_text = pages_data[0]["raw_text"]

    # Verify key legal tokens extracted by OCR
    assert "KRI-1-08921-2016-17" in extracted_text or "08921" in extracted_text
    assert "2016" in extracted_text


def test_encrypted_pdf_handling():
    """Verifies encrypted/password-protected PDFs fail safely without crashing."""
    doc = fitz.open()
    doc.new_page()
    # Encrypt document
    encrypted_bytes = doc.tobytes(encryption=fitz.PDF_ENCRYPT_AES_256, owner_pw="secret123", user_pw="user123")

    page_count, pages_data, metadata = pdf_service.extract_pages_and_metadata(encrypted_bytes)
    assert page_count == 1
    assert "Encrypted" in pages_data[0]["raw_text"]
    assert pages_data[0]["ocr_applied"] is False


def test_finding_deduplication_in_scrutiny_run():
    """Verifies that running AI scrutiny repeatedly does not duplicate existing findings."""
    # 1. Create a case
    create_res = client.post("/api/v1/cases", json={
        "borrowerName": "Deduplication Test Matter",
        "bankName": "HDFC Bank",
        "branch": "Koramangala",
        "loanAmount": "₹75,00,000",
        "propertyType": "Residential Plot",
        "propertyAddress": "Plot 99, 6th Block, Koramangala",
        "surveyNumber": "100/2",
    })
    assert create_res.status_code == 201
    case_id = create_res.json()["id"]

    # 2. Run scrutiny first time
    scrutiny_res1 = client.post(f"/api/v1/cases/{case_id}/scrutiny/analyze")
    assert scrutiny_res1.status_code == 200
    findings1 = scrutiny_res1.json()
    count1 = len(findings1)
    assert count1 > 0

    # 3. Run scrutiny second time (same documents / rules)
    scrutiny_res2 = client.post(f"/api/v1/cases/{case_id}/scrutiny/analyze")
    assert scrutiny_res2.status_code == 200
    findings2 = scrutiny_res2.json()
    count2 = len(findings2)

    # Count must remain exactly equal (no duplicate records spawned)
    assert count2 == count1

    # Verify no duplicate titles exist in the findings
    titles = [f["title"].strip().lower() for f in findings2]
    assert len(titles) == len(set(titles)), f"Duplicate finding titles detected: {titles}"
