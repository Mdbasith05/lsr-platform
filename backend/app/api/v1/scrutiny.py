import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaseModel, DocumentModel, DocumentPageModel, ScrutinyFindingModel, LSRReportModel
from app.schemas.schemas import FindingResponse, FindingCreate, FindingUpdate
from app.services.ai_scrutiny_service import ai_scrutiny_service
from app.core.security import get_current_user_stub

router = APIRouter(tags=["Scrutiny"])


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
    user=Depends(get_current_user_stub),
):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Case not found")

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
    documents = db.query(DocumentModel).filter(DocumentModel.case_id == case_id).all()
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

    # Persist findings (avoid duplicates with same title)
    existing_titles = {f.title for f in db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == case_id).all()}
    saved_findings = []

    for gf in generated_findings:
        if gf["title"] in existing_titles:
            continue

        new_f = ScrutinyFindingModel(
            id=f"fnd-{uuid.uuid4().hex[:8]}",
            case_id=case_id,
            source_doc_id=gf.get("source_doc_id"),
            source_doc_name=gf.get("source_doc_name"),
            title=gf["title"],
            category=gf["category"],
            severity=gf["severity"],
            description=gf["description"],
            page_number=gf.get("page_number", 1),
            evidence_snippet=gf.get("evidence_snippet"),
            ai_confidence=gf.get("ai_confidence", 0.95),
            lawyer_decision=gf.get("lawyer_decision", "pending"),
            lawyer_notes=gf.get("lawyer_notes", ""),
            suggested_query_text=gf.get("suggested_query_text"),
            is_ai_generated=True,
        )
        db.add(new_f)
        saved_findings.append(new_f)

    # Advance case status to Scrutiny Review
    case.status = "Scrutiny Review"

    db.commit()

    # Return all findings for case
    all_findings = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == case_id).order_by(ScrutinyFindingModel.created_at.desc()).all()
    return [serialize_finding(f) for f in all_findings]


@router.get("/cases/{case_id}/scrutiny/findings", response_model=List[FindingResponse])
def get_case_findings(
    case_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Case not found")
    findings = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == case_id).order_by(ScrutinyFindingModel.created_at.desc()).all()
    return [serialize_finding(f) for f in findings]


@router.post("/cases/{case_id}/scrutiny/findings", response_model=FindingResponse, status_code=201)
def add_custom_finding(
    case_id: str,
    payload: FindingCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    new_f = ScrutinyFindingModel(
        id=f"fnd-{uuid.uuid4().hex[:8]}",
        case_id=case_id,
        source_doc_id=payload.sourceDocId,
        source_doc_name=payload.sourceDocName or "Advocate Chamber Inspection",
        title=payload.title,
        category=payload.category,
        severity=payload.severity,
        description=payload.description,
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
    user=Depends(get_current_user_stub),
):
    f = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    case = db.query(CaseModel).filter(CaseModel.id == f.case_id).first()
    if not case or case.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Finding not found")

    if payload.decision:
        f.lawyer_decision = payload.decision
        f.reviewed_at = datetime.now(timezone.utc)

        # If decision is accepted, auto-sync with draft LSR report
        if payload.decision == "accepted":
            report = db.query(LSRReportModel).filter(LSRReportModel.case_id == f.case_id).first()
            if report:
                conditions = list(report.pre_disbursement_conditions or [])
                condition_text = f"Advocate Condition: Resolution of {f.title} as per Bank Requisition."
                if condition_text not in conditions:
                    conditions.append(condition_text)
                    report.pre_disbursement_conditions = conditions

    if payload.notes is not None:
        f.lawyer_notes = payload.notes
    if payload.title:
        f.title = payload.title
    if payload.severity:
        f.severity = payload.severity

    db.commit()
    db.refresh(f)
    return serialize_finding(f)
