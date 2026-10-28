import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
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
from app.schemas.schemas import CaseCreate, CaseUpdate, CaseSummary, BoundariesSchema
from app.core.security import get_current_user_stub, AuthenticatedUser
from app.services.storage_service import storage_service

router = APIRouter(tags=["Cases"])


def serialize_case(c: CaseModel, db: Session) -> CaseSummary:
    prop = c.property
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
        findingsCount={"critical": critical_count, "warning": warning_count, "info": info_count},
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
    query = db.query(CaseModel).filter(CaseModel.lawyer_id == user.user_id)
    if status_filter and status_filter != "All":
        query = query.filter(CaseModel.status == status_filter)
    if bank_filter and bank_filter != "All":
        query = query.filter(CaseModel.bank_name == bank_filter)

    cases = query.order_by(CaseModel.created_at.desc()).all()
    return [serialize_case(c, db) for c in cases]


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
