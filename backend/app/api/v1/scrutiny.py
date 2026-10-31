import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaseModel, DocumentModel, DocumentPageModel, ScrutinyFindingModel, LSRReportModel
from app.schemas.schemas import FindingResponse, FindingCreate, FindingUpdate
from app.services.ai_scrutiny_service import ai_scrutiny_service
from app.core.security import get_current_user_stub, AuthenticatedUser

router = APIRouter(tags=["Scrutiny"])


def get_authorized_case(case_id: str, user_id: str, db: Session) -> CaseModel:
    """Resolves case by UUID or case_number and guarantees tenant isolation."""
    case = db.query(CaseModel).filter(
        (CaseModel.id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case or case.lawyer_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


def serialize_finding(f: ScrutinyFindingModel) -> FindingResponse:
    return FindingResponse(
        id=f.id,
        caseId=f.case_id,
        title=f.title,
        category=f.category,
        severity=f.severity,
        description=f.description,
        sourceDocId=f.source_doc_id or "doc-general",
        sourceDocName=f.source_doc_name or "Property Dossier",
        pageNumber=f.page_number,
        evidenceSnippet=f.evidence_snippet or f.description,
        aiConfidence=f.ai_confidence,
        lawyerDecision=f.lawyer_decision,
        lawyerNotes=f.lawyer_notes,
        suggestedQueryText=f.suggested_query_text,
        isAiGenerated=f.is_ai_generated,
        reviewedAt=f.reviewed_at.isoformat() if f.reviewed_at else None,
    )


@router.post("/cases/{case_id}/scrutiny/analyze", response_model=List[FindingResponse])
def run_ai_scrutiny(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    prop = case.property
    case_dict = {
        "borrower_name": case.borrower_name,
        "co_borrower_name": case.co_borrower_name,
        "property_type": prop.property_type if prop else "Residential Plot",
        "survey_number": prop.survey_number if prop else "",
        "boundary_north": prop.boundary_north if prop else "",
        "boundary_south": prop.boundary_south if prop else "",
        "boundary_east": prop.boundary_east if prop else "",
        "boundary_west": prop.boundary_west if prop else "",
    }

    # Gather documents and pages
    documents = db.query(DocumentModel).filter(DocumentModel.case_id == case.id).all()
    docs_payload = []
    for d in documents:
        pages = db.query(DocumentPageModel).filter(DocumentPageModel.document_id == d.id).order_by(DocumentPageModel.page_number.asc()).all()
        docs_payload.append({
            "id": d.id,
            "file_name": d.file_name,
            "doc_type": d.doc_type,
            "doc_date": d.doc_date,
            "registration_number": d.registration_number,
            "page_count": d.page_count,
            "pages": [{"page_number": p.page_number, "raw_text": p.raw_text} for p in pages],
        })

    # Execute AI Analysis
    generated_findings = ai_scrutiny_service.analyze_case_documents(case_dict, docs_payload)

    # Persist findings with complete fresh refresh:
    # 1. Preserve manual advocate findings (is_ai_generated == False).
    # 2. Delete all previous AI-generated findings so stale hallucinations or calculations never survive.
    # 3. Carry over advocate decisions (accepted/dismissed) only for findings that are authentically re-generated.
    existing_findings = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == case.id).all()
    preserved_map = {}
    previous_decisions = {}
    for f in existing_findings:
        if not f.is_ai_generated:
            key = (f.category.lower().strip(), f.title.lower().strip())
            preserved_map[key] = f
        else:
            if f.lawyer_decision != "pending":
                key = (f.category.lower().strip(), f.title.lower().strip())
                previous_decisions[key] = (f.lawyer_decision, f.lawyer_notes)
            # Delete old AI-generated findings to guarantee fresh, grounded evaluation
            db.delete(f)
    db.flush()

    saved_findings = []
    for gf in generated_findings:
        key = (gf["category"].lower().strip(), gf["title"].lower().strip())
        if key in preserved_map:
            # Advocate has already created a manual custom observation matching this
            continue

        decision = gf.get("lawyer_decision", "pending")
        notes = gf.get("lawyer_notes", "")
        if key in previous_decisions:
            decision, prev_notes = previous_decisions[key]
            if prev_notes:
                notes = prev_notes

        new_f = ScrutinyFindingModel(
            id=f"fnd-{uuid.uuid4().hex[:8]}",
            case_id=case.id,
            source_doc_id=gf.get("source_doc_id"),
            source_doc_name=gf.get("source_doc_name"),
            title=gf["title"],
            category=gf["category"],
            severity=gf["severity"],
            description=gf["description"],
            page_number=gf.get("page_number", 1),
            evidence_snippet=gf.get("evidence_snippet"),
            ai_confidence=gf.get("ai_confidence", 0.95),
            lawyer_decision=decision,
            lawyer_notes=notes,
            suggested_query_text=gf.get("suggested_query_text"),
            is_ai_generated=True,
        )
        db.add(new_f)
        saved_findings.append(new_f)

    # Advance case status to Scrutiny Review if in earlier stages
    if case.status in ["Intake", "Document Processing"]:
        case.status = "Scrutiny Review"

    db.commit()

    # Return all findings for case
    all_findings = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == case.id).order_by(ScrutinyFindingModel.created_at.desc()).all()

    # Synchronize draft LSR report with fresh scrutiny findings if report is not yet signed
    report = db.query(LSRReportModel).filter(LSRReportModel.case_id == case.id).first()
    if report and not report.is_signed:
        # 1. Determine opinion outcome based on findings severity & category
        critical_title_defects = [
            f for f in all_findings
            if f.severity == "critical" and f.category in ["Chain of Title Break", "Encumbrance / Charge"]
        ]
        warning_and_requisitions = [
            f for f in all_findings
            if f.severity in ["critical", "warning"] and f.category in ["Missing Mandatory Document", "Boundary Mismatch", "Tax / Revenue Default"]
        ]

        if critical_title_defects:
            report.opinion_outcome = "Defective Title - Unfit for Mortgage"
        elif warning_and_requisitions:
            report.opinion_outcome = "Clear with Pre-Disbursement Conditions"
        else:
            report.opinion_outcome = "Clear and Marketable Title"

        # 2. Update Chain of Title narrative
        chain_breaks = [f for f in all_findings if f.category == "Chain of Title Break"]
        prior_deeds_missing = [f for f in all_findings if "prior deed" in f.title.lower() or "link deed" in f.title.lower()]
        continuity_deficits = [f for f in all_findings if "continuity deficit" in f.title.lower() or "30-year" in f.title.lower()]

        if chain_breaks:
            report.chain_of_title_narrative = (
                f"Title scrutiny discloses fatal substantive defect(s): {chain_breaks[0].title}. "
                f"{chain_breaks[0].description}"
            )
        elif prior_deeds_missing or continuity_deficits:
            ref_note = f" Recitals establish prior instrument ({prior_deeds_missing[0].title}), but certified copy is not in dossier." if prior_deeds_missing else ""
            report.chain_of_title_narrative = (
                f"Title devolution scrutinized across submitted deeds.{ref_note} "
                "Full unbroken 30-year chain of title requires production and verification of antecedent link deeds prior to disbursement."
            )
        else:
            report.chain_of_title_narrative = (
                "Title devolution examined across submitted registered instruments establishing unbroken legal flow to the current owner/borrower."
            )

        # 3. Update Encumbrance notes
        missing_ec = any("missing mandatory form 15" in f.title.lower() or ("encumbrance" in f.title.lower() and f.severity == "critical") for f in all_findings)
        no_docs = any("no documents ingested" in f.title.lower() for f in all_findings)
        if missing_ec or no_docs:
            report.encumbrance_verification_notes = (
                "Form 15 Encumbrance Certificate for 30 continuous years has not been furnished. "
                "Certified search extract from jurisdictional Sub-Registrar Office required prior to disbursement."
            )
        else:
            report.encumbrance_verification_notes = (
                "Encumbrance search verified up to date. No prior registered mortgages or adverse encumbrances noted for the verified period."
            )

        # 4. Update Pre-Disbursement Conditions from findings
        current_conditions = list(report.pre_disbursement_conditions or [])
        standard_conditions = [
            "Verification and deposit of original primary title deed.",
            "Execution of Memorandum of Deposit of Title Deeds (MODTD).",
        ]
        all_conds = []
        for sc in standard_conditions:
            if sc not in all_conds:
                all_conds.append(sc)

        for c in current_conditions:
            if c not in all_conds and not c.startswith("Condition from Scrutiny:"):
                all_conds.append(c)

        for f in all_findings:
            if f.severity in ["critical", "warning"] and f.suggested_query_text:
                cond_item = f"Condition: {f.suggested_query_text.strip()}"
                if cond_item not in all_conds:
                    all_conds.append(cond_item)

        report.pre_disbursement_conditions = all_conds

        # 5. General observations summary
        obs_parts = []
        if case.property:
            obs_parts.append(f"Subject property: Survey No. {case.property.survey_number or 'N/A'}.")
        obs_parts.append(f"AI Scrutiny generated {len(all_findings)} finding(s).")
        boundary_matches = [f for f in all_findings if f.category == "Boundary Mismatch" and f.severity == "info"]
        if boundary_matches:
            obs_parts.append("Schedule boundaries conform with deed recitals.")
        report.general_observations = " ".join(obs_parts)

        db.commit()

    return [serialize_finding(f) for f in all_findings]


@router.get("/scrutiny/findings", response_model=List[FindingResponse])
def list_all_advocate_findings(
    severity_filter: Optional[str] = Query(None, alias="severity"),
    decision_filter: Optional[str] = Query(None, alias="decision"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    """Lists all scrutiny findings across all matters owned by the authenticated advocate."""
    query = (
        db.query(ScrutinyFindingModel)
        .join(CaseModel, ScrutinyFindingModel.case_id == CaseModel.id)
        .filter(CaseModel.lawyer_id == user.user_id)
    )
    if severity_filter and severity_filter != "All":
        query = query.filter(ScrutinyFindingModel.severity == severity_filter)
    if decision_filter and decision_filter != "All":
        query = query.filter(ScrutinyFindingModel.lawyer_decision == decision_filter)

    findings = query.order_by(ScrutinyFindingModel.created_at.desc()).all()
    return [serialize_finding(f) for f in findings]


@router.get("/cases/{case_id}/scrutiny/findings", response_model=List[FindingResponse])
def get_case_findings(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)
    findings = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == case.id).order_by(ScrutinyFindingModel.created_at.desc()).all()
    return [serialize_finding(f) for f in findings]


@router.post("/cases/{case_id}/scrutiny/findings", response_model=FindingResponse, status_code=status.HTTP_201_CREATED)
def add_custom_finding(
    case_id: str,
    payload: FindingCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    new_f = ScrutinyFindingModel(
        id=f"fnd-{uuid.uuid4().hex[:8]}",
        case_id=case.id,
        source_doc_id=payload.sourceDocId,
        source_doc_name=payload.sourceDocName or "Advocate Chamber Inspection",
        title=payload.title.strip(),
        category=payload.category,
        severity=payload.severity,
        description=payload.description.strip(),
        page_number=payload.pageNumber,
        evidence_snippet=payload.evidenceSnippet or payload.description,
        ai_confidence=payload.aiConfidence,
        lawyer_decision=payload.lawyerDecision,
        lawyer_notes=payload.lawyerNotes or "",
        suggested_query_text=payload.suggestedQueryText,
        is_ai_generated=False,
        reviewed_at=datetime.now(timezone.utc),
    )
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return serialize_finding(new_f)


@router.patch("/scrutiny/findings/{finding_id}", response_model=FindingResponse)
def update_finding(
    finding_id: str,
    payload: FindingUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    f = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")

    case = db.query(CaseModel).filter(CaseModel.id == f.case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")

    if payload.decision:
        f.lawyer_decision = payload.decision
        f.reviewed_at = datetime.now(timezone.utc)

        # If decision is accepted, auto-sync with draft LSR report if report exists
        if payload.decision == "accepted":
            report = db.query(LSRReportModel).filter(LSRReportModel.case_id == f.case_id).first()
            if report and not report.is_signed:
                conditions = list(report.pre_disbursement_conditions or [])
                condition_text = f"Advocate Condition: Resolution of {f.title} as per Bank Requisition."
                if condition_text not in conditions:
                    conditions.append(condition_text)
                    report.pre_disbursement_conditions = conditions

    if payload.notes is not None:
        f.lawyer_notes = payload.notes.strip()
    if payload.title:
        f.title = payload.title.strip()
    if payload.severity:
        f.severity = payload.severity

    db.commit()
    db.refresh(f)
    return serialize_finding(f)
