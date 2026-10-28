import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaseModel, PropertyModel, DocumentModel, ScrutinyFindingModel, CaseQueryModel, LSRReportModel, ProfileModel
from app.schemas.schemas import CaseCreate, CaseUpdate, CaseSummary, BoundariesSchema
from app.core.security import get_current_user_stub

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


@router.get("", response_model=List[CaseSummary])
def list_cases(
    status: Optional[str] = None,
    bank: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    # Enforce strict tenant isolation: an advocate can ONLY view their own authorized cases.
    query = db.query(CaseModel).filter(CaseModel.lawyer_id == user.user_id)
    if status and status != "All":
        query = query.filter(CaseModel.status == status)
    if bank and bank != "All":
        query = query.filter(CaseModel.bank_name == bank)

    cases = query.order_by(CaseModel.created_at.desc()).all()
    return [serialize_case(c, db) for c in cases]


@router.post("", response_model=CaseSummary, status_code=201)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    case_num = payload.caseNumber or f"LSR-2026-{uuid.uuid4().hex[:4].upper()}"
    lawyer_id = user.user_id if user and getattr(user, "user_id", None) else None

    # Ensure profile exists in DB so foreign key constraint cases_lawyer_id_fkey is satisfied
    if lawyer_id:
        existing_profile = db.query(ProfileModel).filter(ProfileModel.id == lawyer_id).first()
        if not existing_profile:
            meta = getattr(user, "user_metadata", {}) or {}
            now = datetime.now(timezone.utc)
            db.add(ProfileModel(
                id=lawyer_id,
                full_name=user.name or (user.email.split("@")[0].title() if user.email else ""),
                email=user.email,
                bar_enrollment_number=meta.get("bar_enrollment_number", ""),
                chamber_name=meta.get("chamber_name", ""),
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
        borrower_name=payload.borrowerName,
        co_borrower_name=payload.coBorrowerName,
        bank_name=payload.bankName,
        branch=payload.branch,
        loan_amount=payload.loanAmount,
        loan_type=payload.loanType,
        status="Intake",
    )
    db.add(new_case)
    db.flush()

    new_prop = PropertyModel(
        case_id=new_case.id,
        property_type=payload.propertyType,
        property_address=payload.propertyAddress,
        survey_number=payload.surveyNumber,
        khata_number=payload.khataNumber,
        boundary_north=payload.boundaries.north,
        boundary_south=payload.boundaries.south,
        boundary_east=payload.boundaries.east,
        boundary_west=payload.boundaries.west,
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
    user=Depends(get_current_user_stub),
):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c or c.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Case not found")
    return serialize_case(c, db)


@router.patch("/{case_id}", response_model=CaseSummary)
def update_case(
    case_id: str,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c or c.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    if payload.status:
        c.status = payload.status
    if payload.borrowerName:
        c.borrower_name = payload.borrowerName
    if payload.bankName:
        c.bank_name = payload.bankName
    if payload.loanAmount:
        c.loan_amount = payload.loanAmount

    db.commit()
    db.refresh(c)
    return serialize_case(c, db)


@router.delete("/{case_id}", status_code=200)
def delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    c = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not c or c.lawyer_id != user.user_id:
        raise HTTPException(status_code=404, detail="Case not found")

    db.delete(c)
    db.commit()
    return {"success": True, "message": f"Case {case_id} archived"}
