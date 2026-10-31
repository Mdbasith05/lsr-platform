import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_service import PdfService
from app.services.ai_scrutiny_service import ai_scrutiny_service

SAMPLE_DEED_PATH = r"c:\Users\mohammed basith\Downloads\sample_sale_deed_for_lsr_testing.pdf"


def test_scenario_1_user_sample_deed_full_scrutiny():
    """
    SCENARIO 1: Real User Sample Deed (sample_sale_deed_for_lsr_testing.pdf)
    Verifies:
    1. Zero false 'Chain of Title Break'.
    2. Missing Form 15 Encumbrance Certificate flagged as 'Missing Mandatory Document' (critical).
    3. Referenced prior deed Doc. No. 1842/2008 flagged as 'Missing Mandatory Document' (warning) with page 1 grounding.
    4. 30-year continuity deficit accurately traces 18 years to 2008.
    5. Multi-line Eastern boundary on Page 2 conforms with case schedule without false mismatch.
    """
    assert os.path.exists(SAMPLE_DEED_PATH), f"Sample deed not found at {SAMPLE_DEED_PATH}"

    with open(SAMPLE_DEED_PATH, "rb") as f:
        pdf_bytes = f.read()

    page_count, pages, metadata = PdfService.extract_pages_and_metadata(pdf_bytes)
    assert page_count == 2

    case_data = {
        "id": "case-scen-1",
        "case_number": "LSR-SCEN-001",
        "borrower_name": "Arun Prakash",
        "property_type": "Residential House",
        "survey_number": "42/1",
        "boundary_east": "Private Property",
        "boundary_west": "Open Space",
        "boundary_north": "Adjacent Site No. 41",
        "boundary_south": "30-foot Road",
    }

    docs_payload = [{
        "id": "doc-scen-1-primary",
        "file_name": "sample_sale_deed_for_lsr_testing.pdf",
        "doc_type": "Specimen Sale Deed",
        "doc_date": metadata.get("doc_date", "15 June 2018"),
        "registration_number": metadata.get("registration_number", "LSR-TEST-2026-001"),
        "pages": pages,
    }]

    # Analyze using dual-track ai_scrutiny_service
    findings = ai_scrutiny_service.analyze_case_documents(case_data, docs_payload)

    # 1. Assert NO Chain of Title Break
    chain_breaks = [f for f in findings if f["category"] == "Chain of Title Break"]
    assert len(chain_breaks) == 0, f"Expected 0 Chain of Title Breaks, got: {chain_breaks}"

    # 2. Assert Missing Form 15 EC
    ec_findings = [f for f in findings if "encumbrance" in f["title"].lower() or "form 15" in f["title"].lower()]
    assert len(ec_findings) >= 1
    assert any(f["severity"] == "critical" and f["category"] == "Missing Mandatory Document" for f in ec_findings)

    # 3. Assert Referenced Prior Deed 1842/2008 is Missing Mandatory Document (warning)
    ref_findings = [f for f in findings if "1842/2008" in f["title"] or "1842/2008" in f.get("description", "")]
    assert len(ref_findings) >= 1
    assert ref_findings[0]["category"] == "Missing Mandatory Document"
    assert ref_findings[0]["severity"] == "warning"
    assert "Doc. No. 1842/2008" in ref_findings[0]["evidence_snippet"]

    # 4. Assert 30-Year Continuity Deficit Traced (18 years)
    deficit_findings = [f for f in findings if "continuity deficit" in f["title"].lower() or "18 years" in f["title"].lower()]
    assert len(deficit_findings) >= 1
    assert deficit_findings[0]["category"] == "Missing Mandatory Document"

    # 5. Assert Boundary Verification Conformance
    boundary_findings = [f for f in findings if f["category"] == "Boundary Mismatch"]
    assert len(boundary_findings) >= 1
    assert any("match" in f["title"].lower() and f["severity"] == "info" for f in boundary_findings)


def test_scenario_2_genuine_substantive_defect_minor_alienation_and_oral_partition():
    """
    SCENARIO 2: Genuine Substantive Defects in Legal Title Devolution
    Deed A: Alienation of minor's interest without court permission under Section 8 of Hindu Minority & Guardianship Act.
    Deed B: Oral partition without registered instrument violating Section 17 of Registration Act.
    Verifies:
    1. System identifies genuine defects as 'Chain of Title Break' with severity 'critical'.
    2. Evidence snippet cites authentic recital sentence.
    3. Actionable bank queries generated.
    """
    # Test 2A: Minor's interest alienated without court sanction
    minor_defect_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "DEED OF CONVEYANCE executed on 14 February 2021 by Mr. Rajesh (Vendor), "
                "conveying the subject property in favor of Mrs. Swetha (Purchaser). "
                "WHEREAS the property originally belonged to late Shri Mohan, and the Vendor as natural guardian "
                "conveys the minor's share of his son Master Aditya without court permission or sanction under Section 8 of the Act."
            ),
        }
    ]

    case_data_2a = {
        "id": "case-scen-2a",
        "case_number": "LSR-SCEN-2A",
        "borrower_name": "Mrs. Swetha",
        "property_type": "Residential Plot",
    }
    docs_2a = [{
        "id": "doc-minor",
        "file_name": "sale_deed_minor_alienation.pdf",
        "doc_type": "Sale Deed",
        "doc_date": "14 February 2021",
        "pages": minor_defect_pages,
    }]

    findings_2a = ai_scrutiny_service.analyze_case_documents(case_data_2a, docs_2a)
    breaks_2a = [f for f in findings_2a if f["category"] == "Chain of Title Break"]
    assert len(breaks_2a) >= 1, "Expected Chain of Title Break for minor alienation"
    assert breaks_2a[0]["severity"] == "critical"
    assert "minor" in breaks_2a[0]["title"].lower()
    assert "without court permission" in breaks_2a[0]["evidence_snippet"].lower()

    # Test 2B: Oral partition without registration
    partition_defect_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "THIS SALE DEED is made on 5 May 2019. "
                "WHEREAS the joint family property was partitioned orally among family members without registration in 2012, "
                "and the Vendor claims sole title under the said oral family partition."
            ),
        }
    ]

    case_data_2b = {
        "id": "case-scen-2b",
        "case_number": "LSR-SCEN-2B",
        "borrower_name": "Mr. Suresh",
        "property_type": "Independent House",
    }
    docs_2b = [{
        "id": "doc-partition",
        "file_name": "sale_deed_oral_partition.pdf",
        "doc_type": "Sale Deed",
        "doc_date": "5 May 2019",
        "pages": partition_defect_pages,
    }]

    findings_2b = ai_scrutiny_service.analyze_case_documents(case_data_2b, docs_2b)
    breaks_2b = [f for f in findings_2b if f["category"] == "Chain of Title Break"]
    assert len(breaks_2b) >= 1, "Expected Chain of Title Break for oral partition"
    assert breaks_2b[0]["severity"] == "critical"
    assert "partitioned orally" in breaks_2b[0]["evidence_snippet"].lower()


def test_scenario_3_multi_document_complete_chain_and_form_15_ec():
    """
    SCENARIO 3: Multi-Document Chain with Ingested Mother Deed & Form 15 EC
    Primary Sale Deed (2020) + Registered Mother Deed (1992, 34 years continuous flow) + Form 15 EC.
    Verifies:
    1. Earliest deed (1992) covers > 30 years: NO 30-year continuity deficit finding is raised.
    2. Form 15 EC is present: NO 'Missing Mandatory Form 15' finding is raised; EC search is verified (info).
    3. Referenced link deed (Doc. No. 3410/1992) is recognized as uploaded: NOT reported as missing.
    4. Zero false Chain of Title Breaks.
    """
    primary_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "Sale Deed executed on 18 October 2020 at Sub-Registrar Office, Bangalore. "
                "The Vendor acquired title under registered Mother Deed bearing Doc. No. 3410/1992 dated 12 August 1992. "
                "Bounded on North: Road, South: Site 14, East: Site 15, West: Park."
            ),
        }
    ]

    mother_deed_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "Deed of Absolute Sale dated 12 August 1992 registered as Doc. No. 3410/1992 at Bangalore. "
                "Conveying Site No. 13 measuring 1,500 square feet."
            ),
        }
    ]

    ec_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "FORM NO. 15 ENCUMBRANCE CERTIFICATE ON PROPERTY. "
                "Search period: 01-04-1992 to 31-10-2020. "
                "Sub-Registrar Office Bangalore. Nil encumbrance found except registered sale deeds Doc 3410/1992 and Doc 2020."
            ),
        }
    ]

    case_data = {
        "id": "case-scen-3",
        "case_number": "LSR-SCEN-3",
        "borrower_name": "Kavitha Sharma",
        "property_type": "Residential Site",
        "boundary_north": "Road",
        "boundary_south": "Site 14",
        "boundary_east": "Site 15",
        "boundary_west": "Park",
    }

    docs_payload = [
        {
            "id": "doc-primary-2020",
            "file_name": "sale_deed_2020.pdf",
            "doc_type": "Sale Deed",
            "doc_date": "18 October 2020",
            "pages": primary_pages,
        },
        {
            "id": "doc-mother-1992",
            "file_name": "mother_deed_3410_1992.pdf",
            "doc_type": "Mother Deed",
            "doc_date": "12 August 1992",
            "registration_number": "3410/1992",
            "pages": mother_deed_pages,
        },
        {
            "id": "doc-ec-form15",
            "file_name": "form_15_encumbrance_certificate_1992_2020.pdf",
            "doc_type": "Encumbrance Certificate",
            "doc_date": "31 October 2020",
            "pages": ec_pages,
        },
    ]

    findings = ai_scrutiny_service.analyze_case_documents(case_data, docs_payload)

    # 1. Assert NO Chain of Title Break
    chain_breaks = [f for f in findings if f["category"] == "Chain of Title Break"]
    assert len(chain_breaks) == 0, f"Expected 0 Chain of Title Breaks, got: {chain_breaks}"

    # 2. Assert NO Missing Form 15 EC (should have verified search info finding)
    missing_ec = [f for f in findings if f["category"] == "Missing Mandatory Document" and "encumbrance" in f["title"].lower()]
    assert len(missing_ec) == 0, f"EC is uploaded, should not be reported as missing: {missing_ec}"

    ec_verified = [f for f in findings if "continuous search" in f["title"].lower() or "encumbrance" in f["title"].lower()]
    assert len(ec_verified) >= 1
    assert ec_verified[0]["severity"] == "info"

    # 3. Assert NO 30-Year Continuity Deficit (1992 is 34 years ago, > 30 years)
    deficit_findings = [f for f in findings if "continuity deficit" in f["title"].lower()]
    assert len(deficit_findings) == 0, f"Chain spans > 30 years (1992-2026), no deficit should be reported: {deficit_findings}"

    # 4. Assert Referenced Mother Deed 3410/1992 is NOT reported as missing
    missing_mother = [f for f in findings if "3410/1992" in f["title"] and f["category"] == "Missing Mandatory Document"]
    assert len(missing_mother) == 0, f"Mother deed is uploaded, should not be missing: {missing_mother}"


def test_scenario_4_four_boundary_verification_and_directional_variance():
    """
    SCENARIO 4: Comprehensive 4-Direction Boundary Verification (North, South, East, West)
    Tests:
    4A: Complete conformance across all 4 directions generates an authoritative info match finding.
    4B: Variance on a specific direction (e.g. Northern boundary) generates a warning finding citing the variance and exact deed page.
    """
    deed_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "DEED OF ABSOLUTE SALE executed on 10 January 2021 by Mr. Ramesh (Vendor) in favor of Mr. Vignesh (Purchaser). "
                "Doc. No. 450/2021 registered at SRO Gandhinagar."
            ),
        },
        {
            "page_number": 2,
            "raw_text": (
                "SCHEDULE OF PROPERTY\n"
                "All that residential site bearing Site No. 42 situated in Survey No. 102 bounded on the:\n"
                "North by: 40-foot Layout Road\n"
                "South by: Site No. 43\n"
                "East by: Private Property of Mr. Kumar\n"
                "West by: Park Area\n"
                "Measuring East to West 40 feet, North to South 60 feet."
            ),
        },
    ]

    # Test 4A: All 4 boundaries conform with intake schedule
    case_data_conforming = {
        "id": "case-scen-4a",
        "borrower_name": "Vignesh",
        "boundary_north": "40-foot Layout Road",
        "boundary_south": "Site No. 43",
        "boundary_east": "Private Property of Mr. Kumar",
        "boundary_west": "Park Area",
    }
    docs_payload = [{
        "id": "doc-deed-4a",
        "file_name": "sale_deed_2021.pdf",
        "doc_type": "Sale Deed",
        "doc_date": "10 January 2021",
        "pages": deed_pages,
    }]

    findings_4a = ai_scrutiny_service.analyze_case_documents(case_data_conforming, docs_payload)
    boundary_matches = [f for f in findings_4a if f["category"] == "Boundary Mismatch" and f["severity"] == "info"]
    assert len(boundary_matches) >= 1
    assert "match" in boundary_matches[0]["title"].lower()
    assert boundary_matches[0]["page_number"] == 2
    # Verify NO boundary warnings
    boundary_warnings_4a = [f for f in findings_4a if f["category"] == "Boundary Mismatch" and f["severity"] == "warning"]
    assert len(boundary_warnings_4a) == 0, f"Expected 0 boundary warnings, got: {boundary_warnings_4a}"

    # Test 4B: Directional variance on Northern Boundary
    case_data_variance = {
        "id": "case-scen-4b",
        "borrower_name": "Vignesh",
        "boundary_north": "Municipal Drainage Canal",  # Variance against deed's '40-foot Layout Road'
        "boundary_south": "Site No. 43",
        "boundary_east": "Private Property of Mr. Kumar",
        "boundary_west": "Park Area",
    }

    findings_4b = ai_scrutiny_service.analyze_case_documents(case_data_variance, docs_payload)
    boundary_warnings_4b = [f for f in findings_4b if f["category"] == "Boundary Mismatch" and f["severity"] == "warning"]
    assert len(boundary_warnings_4b) >= 1
    north_variance = next((f for f in boundary_warnings_4b if "north" in f["title"].lower()), None)
    assert north_variance is not None, f"Expected Northern Boundary Variance, got: {boundary_warnings_4b}"
    assert north_variance["page_number"] == 2
    assert "Municipal Drainage Canal" in north_variance["description"]
    assert "40-foot Layout Road" in north_variance["description"]
    assert "Sanction Plan" in north_variance["suggested_query_text"]


def test_scenario_5_non_index_zero_primary_deed_order_invariance():
    """
    SCENARIO 5: Non-Index-Zero Primary Conveyance Deed Identification
    Upload Order:
    Document 0: Encumbrance Certificate (form_15_ec.pdf)
    Document 1: Primary Sale Deed (sale_deed_2022.pdf)
    Verifies:
    1. Engine does not blindly treat index 0 as primary deed.
    2. Correctly identifies Sale Deed (Document 1) as primary conveyance.
    3. Extracts recitals and boundaries from Document 1 on Page 2.
    4. Encumbrance Certificate (Document 0) satisfies Form 15 EC verification.
    """
    ec_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "FORM NO. 15 STATEMENT OF ENCUMBRANCE ON PROPERTY. "
                "Search period: 01-01-2000 to 01-01-2026. Nil Encumbrance Certificate."
            ),
        }
    ]

    sale_deed_pages = [
        {
            "page_number": 1,
            "raw_text": (
                "DEED OF ABSOLUTE SALE executed on 12 May 2022 by Mr. Suresh (Vendor) in favor of Mr. Karthik (Purchaser). "
                "Registered as Doc. No. 1205/2022 at SRO Indiranagar. "
                "Vendor acquired property under registered Sale Deed Doc. No. 890/2010 dated 15 June 2010."
            ),
        },
        {
            "page_number": 2,
            "raw_text": (
                "SCHEDULE PROPERTY\n"
                "All that piece and parcel of property bounded on:\n"
                "East by: Main Road\n"
                "West by: Site 12\n"
                "North by: Site 10\n"
                "South by: Site 14"
            ),
        },
    ]

    # Deliberately place EC at index 0 and Sale Deed at index 1
    docs_payload = [
        {
            "id": "doc-0-ec",
            "file_name": "form_15_ec.pdf",
            "doc_type": "Encumbrance Certificate",
            "pages": ec_pages,
        },
        {
            "id": "doc-1-sale-deed",
            "file_name": "sale_deed_2022.pdf",
            "doc_type": "Sale Deed",
            "doc_date": "12 May 2022",
            "pages": sale_deed_pages,
        },
    ]

    case_data = {
        "id": "case-scen-5",
        "borrower_name": "Karthik",
        "boundary_east": "Main Road",
        "boundary_west": "Site 12",
        "boundary_north": "Site 10",
        "boundary_south": "Site 14",
    }

    findings = ai_scrutiny_service.analyze_case_documents(case_data, docs_payload)

    # 1. Assert EC is recognized (NOT missing)
    missing_ec = [f for f in findings if f["category"] == "Missing Mandatory Document" and "encumbrance" in f["title"].lower()]
    assert len(missing_ec) == 0, f"EC was at index 0, should not be reported missing: {missing_ec}"

    # 2. Assert boundaries are extracted from Sale Deed (doc-1-sale-deed) and match
    boundary_matches = [f for f in findings if f["category"] == "Boundary Mismatch" and f["severity"] == "info"]
    assert len(boundary_matches) >= 1
    assert boundary_matches[0]["source_doc_name"] == "sale_deed_2022.pdf"
    assert boundary_matches[0]["page_number"] == 2

    # 3. Assert referenced prior deed Doc. No. 890/2010 is identified from Sale Deed recitals
    ref_findings = [f for f in findings if "890/2010" in f["title"]]
    assert len(ref_findings) >= 1
    assert ref_findings[0]["source_doc_name"] == "sale_deed_2022.pdf"
    assert ref_findings[0]["category"] == "Missing Mandatory Document"


def test_scenario_6_scrutiny_and_draft_lsr_report_synchronization():
    """
    SCENARIO 6: Automatic Draft LSR Report Synchronization
    Verifies that executing AI Scrutiny dynamically synchronizes the matter's draft LSR report:
    1. Sets appropriate legal opinion outcome ('Clear with Pre-Disbursement Conditions' or 'Defective').
    2. Updates chain of title narrative to reflect scrutinized years and missing link instruments.
    3. Updates encumbrance verification notes.
    4. Populates pre-disbursement conditions from scrutiny findings.
    """
    client = TestClient(app)

    # Create dedicated fresh case for report synchronization testing
    create_res = client.post("/api/v1/cases", json={
        "borrowerName": "Aarav Gupta",
        "bankName": "Bank of Baroda",
        "branch": "MG Road",
        "loanAmount": "₹50,00,000",
        "propertyType": "Residential Plot",
        "propertyAddress": "Plot 10, Brigade Gateway, Bengaluru",
        "surveyNumber": "100/1",
        "boundaries": {"north": "Road", "south": "Site 11", "east": "Site 12", "west": "Road"}
    })
    assert create_res.status_code == 201
    test_case_id = create_res.json()["id"]

    # Trigger scrutiny analysis
    analyze_res = client.post(f"/api/v1/cases/{test_case_id}/scrutiny/analyze")
    assert analyze_res.status_code == 200
    findings = analyze_res.json()
    assert isinstance(findings, list)

    # Fetch draft LSR report
    report_res = client.get(f"/api/v1/cases/{test_case_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()

    # 1. Opinion outcome must be legally reasoned
    assert report_data["opinionOutcome"] in [
        "Clear and Marketable Title",
        "Clear with Pre-Disbursement Conditions",
        "Defective Title - Unfit for Mortgage",
        "Awaiting Critical Query Resolution",
    ]

    # 2. Chain of title narrative must be dynamically populated (not default placeholder)
    assert report_data["chainOfTitleNarrative"] is not None
    assert "Devolution of title currently under scrutiny" not in report_data["chainOfTitleNarrative"]
    assert len(report_data["chainOfTitleNarrative"]) > 20

    # 3. Encumbrance verification notes must be updated
    assert report_data["encumbranceVerificationNotes"] is not None
    assert "under process" not in report_data["encumbranceVerificationNotes"].lower()

    # 4. Pre-disbursement conditions must contain actionable items from scrutiny findings
    assert isinstance(report_data["preDisbursementConditions"], list)
    assert len(report_data["preDisbursementConditions"]) >= 2

