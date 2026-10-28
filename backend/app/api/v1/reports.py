from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaseModel, LSRReportModel, DocumentModel, ProfileModel
from app.schemas.schemas import ReportResponse, ReportUpdate
from app.services.report_service import report_service
from app.core.security import get_current_user_stub, AuthenticatedUser

router = APIRouter(tags=["Reports"])


def get_authorized_case(case_id: str, user_id: str, db: Session) -> CaseModel:
    """Resolves case by UUID or case_number and guarantees tenant isolation."""
    case = db.query(CaseModel).filter(
        (CaseModel.id == case_id) | (CaseModel.case_number == case_id)
    ).first()
    if not case or case.lawyer_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


def serialize_report(r: LSRReportModel, case: CaseModel) -> ReportResponse:
    prop = case.property
    prop_desc = (
        f"{case.borrower_name} &bull; {prop.property_type if prop else 'Residential Plot'} &bull; "
        f"{prop.property_address if prop else ''} (Survey No. {prop.survey_number if prop else ''})"
    )
    boundaries = (
        f"North: {prop.boundary_north if prop else ''} | South: {prop.boundary_south if prop else ''} | "
        f"East: {prop.boundary_east if prop else ''} | West: {prop.boundary_west if prop else ''}"
    )

    lawyer = case.lawyer
    advocate_name = lawyer.full_name if lawyer else ""
    bar_enrollment = lawyer.bar_enrollment_number if lawyer else ""
    chamber_addr = lawyer.chamber_address if lawyer else ""

    return ReportResponse(
        caseId=case.id,
        reportRefNumber=r.report_ref_number,
        reportDate=r.report_date,
        opinionOutcome=r.opinion_outcome,
        advocateName=advocate_name,
        barEnrollmentNumber=bar_enrollment,
        chamberAddress=chamber_addr,
        propertyDescription=prop_desc,
        boundariesSummary=boundaries,
        chainOfTitleNarrative=r.chain_of_title_narrative or "Devolution of title verified across registered deeds.",
        encumbranceVerificationNotes=r.encumbrance_verification_notes or "Continuous 30-year Form 15 search inspected.",
        revenueRecordsNotes=r.revenue_records_notes or "Municipal Khata extract and tax paid receipts inspected.",
        preDisbursementConditions=r.pre_disbursement_conditions or [],
        postDisbursementConditions=r.post_disbursement_conditions or [],
        generalObservations=r.general_observations or "Title is marketable subject to compliance with conditions.",
        isSigned=r.is_signed,
        signedAt=r.signed_at.isoformat() if r.signed_at else None,
    )


@router.get("/cases/{case_id}/report", response_model=ReportResponse)
def get_case_report(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    report = db.query(LSRReportModel).filter(LSRReportModel.case_id == case.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report draft not found")

    return serialize_report(report, case)


@router.put("/cases/{case_id}/report", response_model=ReportResponse)
def update_case_report(
    case_id: str,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    report = db.query(LSRReportModel).filter(LSRReportModel.case_id == case.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report draft not found")

    # Legal Immutability Check: Signed reports cannot be silently modified
    if report.is_signed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a digitally signed and certified Legal Scrutiny Report. Use the amend endpoint to unlock for revision."
        )

    if payload.opinionOutcome:
        report.opinion_outcome = payload.opinionOutcome
    if payload.chainOfTitleNarrative is not None:
        report.chain_of_title_narrative = payload.chainOfTitleNarrative
    if payload.encumbranceVerificationNotes is not None:
        report.encumbrance_verification_notes = payload.encumbranceVerificationNotes
    if payload.revenueRecordsNotes is not None:
        report.revenue_records_notes = payload.revenueRecordsNotes
    if payload.preDisbursementConditions is not None:
        report.pre_disbursement_conditions = payload.preDisbursementConditions
    if payload.postDisbursementConditions is not None:
        report.post_disbursement_conditions = payload.postDisbursementConditions
    if payload.generalObservations is not None:
        report.general_observations = payload.generalObservations

    db.commit()
    db.refresh(report)
    return serialize_report(report, case)


@router.post("/cases/{case_id}/report/sign", response_model=ReportResponse)
def sign_case_report(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    report = db.query(LSRReportModel).filter(LSRReportModel.case_id == case.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report draft not found")

    report.is_signed = True
    report.signed_at = datetime.now(timezone.utc)
    case.status = "Completed"

    db.commit()
    db.refresh(report)
    return serialize_report(report, case)


@router.post("/cases/{case_id}/report/amend", response_model=ReportResponse)
def amend_case_report(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    """Allows an empaneled advocate to unlock a previously signed report to make verified amendments."""
    case = get_authorized_case(case_id, user.user_id, db)

    report = db.query(LSRReportModel).filter(LSRReportModel.case_id == case.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report draft not found")

    report.is_signed = False
    report.signed_at = None
    case.status = "Scrutiny Review"

    db.commit()
    db.refresh(report)
    return serialize_report(report, case)


@router.get("/cases/{case_id}/report/export-pdf")
def export_case_report_pdf(
    case_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user_stub),
):
    case = get_authorized_case(case_id, user.user_id, db)

    report = db.query(LSRReportModel).filter(LSRReportModel.case_id == case.id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report draft not found")

    prop = case.property
    case_dict = {
        "borrower_name": case.borrower_name,
        "co_borrower_name": case.co_borrower_name,
        "bank_name": case.bank_name,
        "branch": case.branch,
        "loan_amount": case.loan_amount,
        "property_address": prop.property_address if prop else "",
        "survey_number": prop.survey_number if prop else "",
        "khata_number": prop.khata_number if prop else "",
        "boundary_north": prop.boundary_north if prop else "",
        "boundary_south": prop.boundary_south if prop else "",
        "boundary_east": prop.boundary_east if prop else "",
        "boundary_west": prop.boundary_west if prop else "",
    }

    lawyer = case.lawyer
    advocate_name = lawyer.full_name if lawyer else ""
    bar_enrollment = lawyer.bar_enrollment_number if lawyer else ""
    chamber_addr = lawyer.chamber_address if lawyer else ""

    report_dict = {
        "reportRefNumber": report.report_ref_number,
        "reportDate": report.report_date,
        "opinionOutcome": report.opinion_outcome,
        "advocateName": advocate_name,
        "barEnrollmentNumber": bar_enrollment,
        "chamberAddress": chamber_addr,
        "chainOfTitleNarrative": report.chain_of_title_narrative,
        "preDisbursementConditions": report.pre_disbursement_conditions,
        "isSigned": report.is_signed,
    }

    docs = db.query(DocumentModel).filter(DocumentModel.case_id == case.id).all()
    docs_list = [
        {
            "file_name": d.file_name,
            "doc_type": d.doc_type,
            "doc_date": d.doc_date,
            "registration_number": d.registration_number,
        }
        for d in docs
    ]

    pdf_bytes = report_service.generate_lsr_pdf_bytes(report_dict, case_dict, docs_list)

    clean_case_num = case.case_number.replace("/", "_").replace("\\", "_")
    filename = f"LSR_Report_{clean_case_num}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
