from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import (
    Base,
    ProfileModel,
    CaseModel,
    PropertyModel,
    DocumentModel,
    DocumentPageModel,
    ScrutinyFindingModel,
    CaseQueryModel,
    LSRReportModel,
)
from app.db.session import engine, SessionLocal


def init_db():
    """Initializes tables and seeds initial authentic data if empty."""
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if default profile exists
        profile = db.query(ProfileModel).first()
        if not profile:
            profile = ProfileModel(
                id="adv-rajesh-001",
                full_name="Adv. Rajesh Kumar",
                email="advocate.rajesh@lsr-platform.in",
                bar_enrollment_number="KAR/1429/2012",
                chamber_name="Chamber of Adv. Rajesh Kumar & Associates",
                chamber_address="Chamber #402, High Court Lawyers Chambers, Bengaluru - 560001",
                phone="+91 98450 12345",
                role="Senior Empaneled Advocate",
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # Check if any case exists
        case_count = db.query(CaseModel).count()
        if case_count == 0:
            # Seed primary case LSR-2026-001
            c1 = CaseModel(
                id="LSR-2026-001",
                case_number="SBI/HL/2026/0892",
                lawyer_id=profile.id,
                borrower_name="Rajesh V. Kumar",
                co_borrower_name="Sunita R. Kumar",
                bank_name="State Bank of India",
                branch="Koramangala Branch, Bengaluru",
                loan_amount="₹85,00,000",
                loan_type="Housing Loan / Mortgage Scrutiny",
                status="Scrutiny Review",
            )
            db.add(c1)

            prop1 = PropertyModel(
                case_id=c1.id,
                property_type="Residential Plot",
                property_address="Site No. 42, BBMP Ward No. 174, HSR Layout Sector 2, Bengaluru - 560102",
                survey_number="Sy. No. 74/2 (Old Sy. No. 74)",
                khata_number="BBMP/KHA/2024/78219",
                boundary_north="30 Feet Road",
                boundary_south="Site No. 43",
                boundary_east="Site No. 15 (Layout Demarcation)",
                boundary_west="Private Property / Survey Boundary",
            )
            db.add(prop1)

            # Seed Documents
            d1 = DocumentModel(
                id="doc-001-sale-deed",
                case_id=c1.id,
                file_name="Sale_Deed_2016_Vendor_to_Borrower.pdf",
                storage_path="cases/LSR-2026-001/doc-001-sale-deed.pdf",
                doc_type="Sale Deed / Title Deed",
                doc_date="14-Oct-2016",
                registration_number="KRI-1-08921-2016-17",
                sub_registrar_office="Sub-Registrar Krishnarajapuram, Bengaluru Urban",
                page_count=8,
                file_size_bytes=4280192,
                processing_status="Review Ready",
                confidence_score=0.98,
            )
            db.add(d1)

            d2 = DocumentModel(
                id="doc-002-mother-deed",
                case_id=c1.id,
                file_name="Mother_Sale_Deed_1998_Prior_Owner.pdf",
                storage_path="cases/LSR-2026-001/doc-002-mother-deed.pdf",
                doc_type="Mother Deed / Prior Deed",
                doc_date="22-May-1998",
                registration_number="BNG-U-4512-1998-99",
                sub_registrar_office="Sub-Registrar Bangalore South, Gandhinagar",
                page_count=6,
                file_size_bytes=3145728,
                processing_status="Review Ready",
                confidence_score=0.94,
            )
            db.add(d2)

            d3 = DocumentModel(
                id="doc-003-ec-form15",
                case_id=c1.id,
                file_name="Encumbrance_Certificate_Form15_2004_2024.pdf",
                storage_path="cases/LSR-2026-001/doc-003-ec-form15.pdf",
                doc_type="Encumbrance Certificate (EC)",
                doc_date="05-Jan-2026",
                registration_number="EC/KRI/2026/001429",
                sub_registrar_office="Sub-Registrar Krishnarajapuram, Bengaluru Urban",
                page_count=4,
                file_size_bytes=1887436,
                processing_status="Review Ready",
                confidence_score=0.99,
            )
            db.add(d3)

            # Seed Document Pages for d1
            p1 = DocumentPageModel(
                document_id=d1.id,
                page_number=1,
                raw_text="THIS DEED OF ABSOLUTE SALE executed on this 14th day of October 2016 between Sri M. Narayana Murthy hereinafter called the VENDOR and Sri Rajesh V. Kumar hereinafter called the PURCHASER...",
                ocr_applied=False,
            )
            p4 = DocumentPageModel(
                document_id=d1.id,
                page_number=4,
                raw_text="SCHEDULE OF PROPERTY: All that piece and parcel of residential site bearing No. 42 formed in Survey No. 74/2 measuring East to West 40 feet and North to South 60 feet. BOUNDARIES: North by 30ft Road, South by Site No 43, East by Site No 15, West by Private Land.",
                ocr_applied=False,
            )
            p5 = DocumentPageModel(
                document_id=d1.id,
                page_number=5,
                raw_text="COVENANTS: The Vendor hereby covenants with the Purchaser that the schedule property is free from all encumbrances, charges, liens, mortgages, and attachments...",
                ocr_applied=False,
            )
            db.add_all([p1, p4, p5])

            # Seed Initial Findings
            f1 = ScrutinyFindingModel(
                id="fnd-001-boundary",
                case_id=c1.id,
                source_doc_id=d1.id,
                source_doc_name=d1.file_name,
                title="Schedule Boundary Discrepancy & Adjacent Plot Variance",
                category="Boundary Mismatch",
                severity="critical",
                description="Cross-referencing Schedule boundaries reveals a discrepancy on the Eastern boundary. 2016 Primary Deed cites 'Site No. 15', whereas prior 1998 Mother Deed recites 'Private agricultural land belonging to Muniswamy'.",
                page_number=4,
                evidence_snippet="Schedule Boundary East by Site No. 15. Cross-reference with 1998 Prior Deed Page 3 shows Eastern boundary described as agricultural survey boundary without partition recital.",
                ai_confidence=0.94,
                lawyer_decision="pending",
                lawyer_notes="",
                suggested_query_text="Borrower / Vendor to furnish Layout Demarcation Approval Plan from Town Planning Authority reconciling boundary transition from agricultural land to Site No. 15.",
                is_ai_generated=True,
            )
            f2 = ScrutinyFindingModel(
                id="fnd-002-ec-gap",
                case_id=c1.id,
                source_doc_id=d3.id,
                source_doc_name=d3.file_name,
                title="Continuous 30-Year Encumbrance Search Period Gap",
                category="Encumbrance / Charge",
                severity="warning",
                description="The submitted computerized Form 15 Encumbrance Certificate covers 01-Apr-2004 to 31-Dec-2024 (20 years). A manual search certificate from the Sub-Registrar is required for the preceding 10 years (1994 to 2004).",
                page_number=2,
                evidence_snippet="Search period reflected in Certificate Header: 01-04-2004 to 31-12-2024. Prior period 1994-2004 not covered in computerized index.",
                ai_confidence=0.91,
                lawyer_decision="pending",
                lawyer_notes="",
                suggested_query_text="Submit certified manual Encumbrance Certificate in Form 15 from the jurisdictional Sub-Registrar Office for the period 01-04-1994 to 31-03-2004.",
                is_ai_generated=True,
            )
            db.add_all([f1, f2])

            # Seed Initial Query
            q1 = CaseQueryModel(
                id="qry-001",
                case_id=c1.id,
                linked_finding_id=f1.id,
                query_code="REQ-2026-001",
                title="Requisition: Eastern Boundary Demarcation & Layout Plan",
                draft_text="Please furnish certified copy of Approved Layout Plan and SRO Endorsement confirming demarcation of Eastern boundary as Site No. 15 pursuant to conversion order.",
                lawyer_approved_text="Please furnish certified copy of Approved Layout Plan and SRO Endorsement confirming demarcation of Eastern boundary as Site No. 15 pursuant to conversion order.",
                status="Approved",
            )
            db.add(q1)

            # Seed LSR Report
            r1 = LSRReportModel(
                case_id=c1.id,
                report_ref_number="LSR/SBI/2026/0892",
                report_date="2026-10-26",
                opinion_outcome="Clear with Pre-Disbursement Conditions",
                chain_of_title_narrative="The property originally formed part of Sy. No. 74/2 measuring 2 Acres 10 Guntas owned by Sri Muniswamy. Vide registered Sale Deed dated 22-May-1998, a converted portion was conveyed to Sri M. Narayana Murthy. Subsequently, vide registered Sale Deed dated 14-Oct-2016, Site No. 42 was purchased by Sri Rajesh V. Kumar.",
                encumbrance_verification_notes="Form 15 verified for 2004-2024 reflecting Nil Encumbrance. Manual search for 1994-2004 requested as pre-disbursement requisition.",
                revenue_records_notes="Property falls under BBMP Ward No. 174. Current tax receipts for 2024-25 and 2025-26 inspected and found clear.",
                pre_disbursement_conditions=[
                    "Advocate Condition: Resolution of Eastern boundary query as per formal Requisition REQ-2026-001.",
                    "Deposit of original registered Sale Deed dated 14-Oct-2016 (Doc No. KRI-1-08921-2016-17) at the bank branch.",
                    "Deposit of original 1998 Mother Sale Deed and certified manual Form 15 EC for 1994-2004.",
                    "Execution of registered Memorandum of Deposit of Title Deeds (MODTD) in favor of State Bank of India.",
                ],
                post_disbursement_conditions=[
                    "Bank to obtain updated Search Report from Advocate's chamber within 30 days of loan disbursal.",
                    "Borrower to ensure mutation of BBMP Khata in Bank charge records.",
                ],
                general_observations="Title is marketable and valid for mortgage subject to satisfactory compliance with pre-disbursement conditions.",
                is_signed=False,
            )
            db.add(r1)

            # Seed a second case LSR-2026-002
            c2 = CaseModel(
                id="LSR-2026-002",
                case_number="HDFC/MORT/2026/4102",
                lawyer_id=profile.id,
                borrower_name="Meera Chandrasekharan",
                bank_name="HDFC Bank",
                branch="Indiranagar 100ft Road Branch, Bengaluru",
                loan_amount="₹1,20,00,000",
                loan_type="Home Equity Loan",
                status="Intake",
            )
            db.add(c2)

            prop2 = PropertyModel(
                case_id=c2.id,
                property_type="Apartment / Flat",
                property_address="Flat No. 302, Prestige Hermitage, HAL 2nd Stage, Indiranagar, Bengaluru - 560038",
                survey_number="Sy. No. 18/4, Indiranagar Village",
                khata_number="BBMP/2024/99120",
                boundary_north="Apartment Corridor & Flat 301",
                boundary_south="Open to Sky / Rear Lawn",
                boundary_east="Lift Lobby & Staircase",
                boundary_west="Compound Wall abutting 100ft Road",
            )
            db.add(prop2)

            db.commit()
    finally:
        db.close()
