import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CaseModel, CaseQueryModel, ScrutinyFindingModel
from app.schemas.schemas import QueryResponse, QueryCreate, QueryUpdate
from app.core.security import get_current_user_stub

router = APIRouter(tags=["Queries"])


def serialize_query(q: CaseQueryModel, db: Session) -> QueryResponse:
    finding_title = None
    if q.linked_finding_id:
        f = db.query(ScrutinyFindingModel).filter(ScrutinyFindingModel.id == q.linked_finding_id).first()
        if f:
            finding_title = f.title

    return QueryResponse(
        id=q.id,
        caseId=q.case_id,
        queryCode=q.query_code,
        title=q.title,
        draftText=q.draft_text,
        lawyerApprovedText=q.lawyer_approved_text,
        linkedFindingId=q.linked_finding_id,
        linkedFindingTitle=finding_title,
        status=q.status,
        createdAt=q.created_at.isoformat() if q.created_at else datetime.now(timezone.utc).isoformat(),
        updatedAt=q.updated_at.isoformat() if q.updated_at else datetime.now(timezone.utc).isoformat(),
        responseNotes=None,
    )


@router.get("/cases/{case_id}/queries", response_model=List[QueryResponse])
def list_case_queries(
    case_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    queries = db.query(CaseQueryModel).filter(CaseQueryModel.case_id == case_id).order_by(CaseQueryModel.created_at.desc()).all()
    return [serialize_query(q, db) for q in queries]


@router.post("/cases/{case_id}/queries", response_model=QueryResponse, status_code=201)
def create_case_query(
    case_id: str,
    payload: QueryCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    query_count = db.query(CaseQueryModel).filter(CaseQueryModel.case_id == case_id).count()
    code = f"REQ-2026-{query_count + 1:03d}"

    new_q = CaseQueryModel(
        id=f"qry-{uuid.uuid4().hex[:8]}",
        case_id=case_id,
        linked_finding_id=payload.linkedFindingId,
        query_code=code,
        title=payload.title,
        draft_text=payload.draftText,
        lawyer_approved_text=payload.draftText,
        status="Draft",
    )
    db.add(new_q)

    # If case status was Scrutiny Review, advance to Queries Raised
    if case.status in ["Intake", "Document Processing", "Scrutiny Review"]:
        case.status = "Queries Raised"

    db.commit()
    db.refresh(new_q)
    return serialize_query(new_q, db)


@router.patch("/queries/{query_id}", response_model=QueryResponse)
def update_query(
    query_id: str,
    payload: QueryUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    q = db.query(CaseQueryModel).filter(CaseQueryModel.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    if payload.status:
        q.status = payload.status
    if payload.lawyerApprovedText is not None:
        q.lawyer_approved_text = payload.lawyerApprovedText
    if payload.draftText:
        q.draft_text = payload.draftText

    db.commit()
    db.refresh(q)
    return serialize_query(q, db)


@router.delete("/queries/{query_id}", status_code=200)
def delete_query(
    query_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_stub),
):
    q = db.query(CaseQueryModel).filter(CaseQueryModel.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    db.delete(q)
    db.commit()
    return {"success": True, "message": f"Query {query_id} deleted"}
