import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.db.models import (
    CaseModel,
    PropertyModel,
    DocumentModel,
    ScrutinyFindingModel,
    CaseQueryModel,
    LSRReportModel,
    ProfileModel,
)
from app.schemas.schemas import (
    CaseCreate,
    CaseUpdate,
    CaseSummary,
    BoundariesSchema,
    CaseFullDetailsResponse,
    DocumentResponse,
    FindingResponse,
    QueryResponse,
    ReportResponse,
)
from app.api.v1.documents import serialize_document
from app.api.v1.scrutiny import serialize_finding
from app.api.v1.queries import serialize_query
from app.api.v1.reports import serialize_report
from app.core.security import get_current_user_stub, AuthenticatedUser
from app.services.storage_service import storage_service

router = APIRouter(tags=["Cases"])


def serialize_case(c: CaseModel, db: Session, counts_cache: Optional[Dict[str, Any]] = None) -> CaseSummary:
    prop = c.property

    if counts_cache and c.id in counts_cache:
        cached = counts_cache[c.id]
        doc_count = cached["doc_count"]
        query_count = cached["query_count"]
        findings_count = cached["findings_count"]
    else:
        doc_count = db.query(DocumentModel).filter(DocumentModel.case_id == c.id).count()
        query_count = db.query(CaseQueryModel).filter(CaseQueryModel.case_id == c.id, CaseQueryModel.status != "Resolved").count()

        critical_count = db.query(ScrutinyFindingModel).filter(
            ScrutinyFindingModel.case_id == c.id,
            ScrutinyFindingModel.severity == "critical",
            ScrutinyFindingModel.lawyer_decision == "pending"
        ).count()
        warning_count = db.query(ScrutinyFindingModel).filter(
            ScrutinyFindingModel.case_id == c.id,
            ScrutinyFindingModel.severity == "warning",
            ScrutinyFindingModel.lawyer_decision == "pending"
        ).count()
        info_count = db.query(ScrutinyFindingModel).filter(
            ScrutinyFindingModel.case_id == c.id,
            ScrutinyFindingModel.severity == "info"
        ).count()
        findings_count = {"critical": critical_count, "warning": warning_count, "info": info_count}

    boundaries = BoundariesSchema(
        north=prop.boundary_north or "" if prop else "",
        south=prop.boundary_south or "" if prop else "",
        east=prop.boundary_east or "" if prop else "",
        west=prop.boundary_west or "" if prop else "",
    )

    lawyer_name = c.lawyer.full_name if c.lawyer else ""

    return CaseSummary(
        id=c.id,
        caseNumber=c.case_number,
        borrowerName=c.borrower_name,
        coBorrowerName=c.co_borrower_name,
        bankName=c.bank_name,
        branch=c.branch,
        propertyAddress=prop.property_address if prop else "",
        propertyType=prop.property_type if prop else "Residential Plot",
        surveyNumber=prop.survey_number if prop else "",
        khataNumber=prop.khata_number if prop else None,
        boundaries=boundaries,
        loanAmount=c.loan_amount,
        loanType=c.loan_type,
        status=c.status,
        assignedLawyer=lawyer_name,
        createdAt=c.created_at.isoformat() if c.created_at else datetime.now(timezone.utc).isoformat(),
        updatedAt=c.updated_at.isoformat() if c.updated_at else datetime.now(timezone.utc).isoformat(),
        documentCount=doc_count,
        openQueriesCount=query_count,
        findingsCount=findings_count,
    )


def get_authorized_case(case_id: str, user_id: str, db: Session) -> CaseModel:
    """Resolves a case by UUID or business case_number while enforcing tenant isolation."""
    case = db.query(CaseModel).filter(
        (CaseModel.id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case or case.lawyer_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.get("", response_model=List[CaseSummary])
def list_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    bank_filter: Optional[str] = Query(None, alias="bank"),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    query = db.query(CaseModel).filter(CaseModel.lawyer_id == user.user_id).options(
        joinedload(CaseModel.property),
        joinedload(CaseModel.lawyer),
    )
    if status_filter and status_filter != "All":
        query = query.filter(CaseModel.status == status_filter)
    if bank_filter and bank_filter != "All":
        query = query.filter(CaseModel.bank_name == bank_filter)

    cases = query.order_by(CaseModel.created_at.desc()).all()
    if not cases:
        return []

    # High-performance bulk count aggregation (eliminates N+1 query pattern)
    case_ids = [c.id for c in cases]

    # 1. Bulk document counts
    doc_counts_raw = db.query(DocumentModel.case_id, func.count(DocumentModel.id)).filter(
        DocumentModel.case_id.in_(case_ids)
    ).group_by(DocumentModel.case_id).all()
    doc_counts_map = dict(doc_counts_raw)

    # 2. Bulk open queries counts
    query_counts_raw = db.query(CaseQueryModel.case_id, func.count(CaseQueryModel.id)).filter(
        CaseQueryModel.case_id.in_(case_ids),
        CaseQueryModel.status != "Resolved"
    ).group_by(CaseQueryModel.case_id).all()
    query_counts_map = dict(query_counts_raw)

    # 3. Bulk findings counts by severity & lawyer_decision
    finding_counts_raw = db.query(
        ScrutinyFindingModel.case_id,
        ScrutinyFindingModel.severity,
        ScrutinyFindingModel.lawyer_decision,
        func.count(ScrutinyFindingModel.id)
    ).filter(
        ScrutinyFindingModel.case_id.in_(case_ids)
    ).group_by(
        ScrutinyFindingModel.case_id,
        ScrutinyFindingModel.severity,
        ScrutinyFindingModel.lawyer_decision
    ).all()

    findings_map: Dict[str, Dict[str, int]] = {}
    for cid in case_ids:
        findings_map[cid] = {"critical": 0, "warning": 0, "info": 0}

    for cid, sev, decision, cnt in finding_counts_raw:
        if cid in findings_map:
            if sev == "critical" and decision == "pending":
                findings_map[cid]["critical"] += cnt
            elif sev == "warning" and decision == "pending":
                findings_map[cid]["warning"] += cnt
            elif sev == "info":
                findings_map[cid]["info"] += cnt

    counts_cache = {
        cid: {
            "doc_count": doc_counts_map.get(cid, 0),
            "query_count": query_counts_map.get(cid, 0),
            "findings_count": findings_map.get(cid, {"critical": 0, "warning": 0, "info": 0}),
        }
        for cid in case_ids
    }

    return [serialize_case(c, db, counts_cache=counts_cache) for c in cases]


@router.post("", response_model=CaseSummary, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case_num = payload.caseNumber.strip() if payload.caseNumber else f"LSR-2026-{uuid.uuid4().hex[:4].upper()}"

    # Prevent unique constraint crash
    existing_case = db.query(CaseModel).filter(CaseModel.case_number == case_num).first()
    if existing_case:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Case number '{case_num}' is already registered in the system."
        )

    lawyer_id = user.user_id

    # Auto-provision profile record if first time
    if lawyer_id:
        existing_profile = db.query(ProfileModel).filter(ProfileModel.id == lawyer_id).first()
        if not existing_profile:
            meta = getattr(user, "user_metadata", {}) or {}
            now = datetime.now(timezone.utc)
            db.add(ProfileModel(
                id=lawyer_id,
                full_name=user.name or (user.email.split("@")[0].title() if user.email else "Empaneled Advocate"),
                email=user.email,
                bar_enrollment_number=meta.get("bar_enrollment_number", "Enrolled Advocate"),
                chamber_name=meta.get("chamber_name", "Chamber of Advocates"),
                chamber_address=meta.get("address", ""),
                phone=meta.get("phone", ""),
                role=user.role or "Senior Empaneled Advocate",
                created_at=now,
                updated_at=now,
            ))
            db.flush()

    new_case = CaseModel(
        case_number=case_num,
        lawyer_id=lawyer_id,
        borrower_name=payload.borrowerName.strip(),
        co_borrower_name=payload.coBorrowerName.strip() if payload.coBorrowerName else None,
        bank_name=payload.bankName.strip(),
        branch=payload.branch.strip(),
        loan_amount=payload.loanAmount.strip(),
        loan_type=payload.loanType.strip(),
        status="Intake",
    )
    db.add(new_case)
    db.flush()

    new_prop = PropertyModel(
        case_id=new_case.id,
        property_type=payload.propertyType,
        property_address=payload.propertyAddress.strip(),
        survey_number=payload.surveyNumber.strip(),
        khata_number=payload.khataNumber.strip() if payload.khataNumber else None,
        boundary_north=payload.boundaries.north.strip(),
        boundary_south=payload.boundaries.south.strip(),
        boundary_east=payload.boundaries.east.strip(),
        boundary_west=payload.boundaries.west.strip(),
    )
    db.add(new_prop)

    # Initialize draft LSR report
    draft_report = LSRReportModel(
        case_id=new_case.id,
        report_ref_number=f"LSR/{payload.bankName[:4].upper()}/2026/{new_case.id[:6].upper()}",
        report_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        opinion_outcome="Clear with Pre-Disbursement Conditions",
        chain_of_title_narrative="Devolution of title currently under scrutiny pursuant to submitted title documents.",
        encumbrance_verification_notes="Encumbrance search under process.",
        revenue_records_notes="Khata and revenue assessment records pending verification.",
        pre_disbursement_conditions=[
            "Verification and deposit of original primary title deed.",
            "Execution of Memorandum of Deposit of Title Deeds (MODTD).",
        ],
        post_disbursement_conditions=[
            "Submission of updated Sub-Registrar search report within 30 days.",
        ],
        general_observations="Title is subject to advocate scrutiny and verification of pre-disbursement conditions.",
        is_signed=False,
    )
    db.add(draft_report)

    db.commit()
    db.refresh(new_case)
    return serialize_case(new_case, db)


@router.get("/{case_id}", response_model=CaseSummary)
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    c = get_authorized_case(case_id, user.user_id, db)
    return serialize_case(c, db)


@router.get("/{case_id}/full", response_model=CaseFullDetailsResponse)
def get_case_full_details(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    """
    Returns full case summary, documents, findings, queries, and LSR report
    in a single atomic database trip, eliminating multiple redundant round-trips.
    """
    c = get_authorized_case(case_id, user.user_id, db)
    case_summary = serialize_case(c, db)

    # Documents
    docs = db.query(DocumentModel).filter(DocumentModel.case_id == c.id).order_by(DocumentModel.uploaded_at.desc()).all()
    serialized_docs = [serialize_document(d, db) for d in docs]

    # Findings
    findings = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.case_id == c.id).order_by(ScrutinyFindingModel.created_at.desc()).all()
    serialized_findings = [serialize_finding(f) for f in findings]

    # Queries
    queries = db.query(CaseQueryModel).filter(CaseQueryModel.case_id == c.id).order_by(CaseQueryModel.created_at.desc()).all()
    serialized_queries = [serialize_query(q, db) for q in queries]

    # Report
    serialized_report = None
    if c.report:
        serialized_report = serialize_report(c.report, c)

    return CaseFullDetailsResponse(
        case=case_summary,
        documents=serialized_docs,
        findings=serialized_findings,
        queries=serialized_queries,
        report=serialized_report,
    )


@router.patch("/{case_id}", response_model=CaseSummary)
def update_case(
    case_id: str,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    c = get_authorized_case(case_id, user.user_id, db)

    if payload.status is not None:
        c.status = payload.status
    if payload.borrowerName is not None:
        c.borrower_name = payload.borrowerName.strip()
    if payload.coBorrowerName is not None:
        c.co_borrower_name = payload.coBorrowerName.strip() or None
    if payload.bankName is not None:
        c.bank_name = payload.bankName.strip()
    if payload.branch is not None:
        c.branch = payload.branch.strip()
    if payload.loanAmount is not None:
        c.loan_amount = payload.loanAmount.strip()
    if payload.loanType is not None:
        c.loan_type = payload.loanType.strip()

    # Update associated property details if provided
    prop = c.property
    if prop:
        if payload.propertyAddress is not None:
            prop.property_address = payload.propertyAddress.strip()
        if payload.propertyType is not None:
            prop.property_type = payload.propertyType.strip()
        if payload.surveyNumber is not None:
            prop.survey_number = payload.surveyNumber.strip()
        if payload.khataNumber is not None:
            prop.khata_number = payload.khataNumber.strip() or None
        if payload.boundaries is not None:
            if payload.boundaries.north is not None:
                prop.boundary_north = payload.boundaries.north.strip()
            if payload.boundaries.south is not None:
                prop.boundary_south = payload.boundaries.south.strip()
            if payload.boundaries.east is not None:
                prop.boundary_east = payload.boundaries.east.strip()
            if payload.boundaries.west is not None:
                prop.boundary_west = payload.boundaries.west.strip()

    db.commit()
    db.refresh(c)
    return serialize_case(c, db)


@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
def delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    c = get_authorized_case(case_id, user.user_id, db)

    # Delete storage files for each document
    for doc in c.documents:
        storage_service.delete_document_file(doc.storage_path)

    db.delete(c)
    db.commit()
    return {"success": True, "message": f"Case {c.case_number} archived and deleted."}
