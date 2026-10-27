from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime


# ------------------------------------------------------------------------------
# Case Schemas
# ------------------------------------------------------------------------------
class BoundariesSchema(BaseModel):
    north: str = ""
    south: str = ""
    east: str = ""
    west: str = ""


class CaseCreate(BaseModel):
    borrowerName: str
    coBorrowerName: Optional[str] = None
    bankName: str
    branch: str
    loanAmount: str
    loanType: str = "Housing Loan / Mortgage Scrutiny"
    propertyType: str = "Residential Plot"
    propertyAddress: str
    surveyNumber: str
    khataNumber: Optional[str] = None
    boundaries: BoundariesSchema = Field(default_factory=BoundariesSchema)
    caseNumber: Optional[str] = None


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    borrowerName: Optional[str] = None
    bankName: Optional[str] = None
    loanAmount: Optional[str] = None


class CaseSummary(BaseModel):
    id: str
    caseNumber: str
    borrowerName: str
    coBorrowerName: Optional[str] = None
    bankName: str
    branch: str
    propertyAddress: str
    propertyType: str
    surveyNumber: str
    khataNumber: Optional[str] = None
    boundaries: BoundariesSchema
    loanAmount: str
    loanType: str
    status: str
    assignedLawyer: str = "Adv. Rajesh Kumar"
    createdAt: str
    updatedAt: str
    documentCount: int = 0
    openQueriesCount: int = 0
    findingsCount: Dict[str, int] = Field(default_factory=lambda: {"critical": 0, "warning": 0, "info": 0})


# ------------------------------------------------------------------------------
# Document Schemas
# ------------------------------------------------------------------------------
class DocumentPageSnippet(BaseModel):
    page: int
    text: str


class DocumentResponse(BaseModel):
    id: str
    caseId: str
    fileName: str
    docType: str
    docDate: str
    registrationNumber: Optional[str] = None
    subRegistrarOffice: Optional[str] = None
    pageCount: int
    fileSizeBytes: int
    uploadedAt: str
    status: str
    confidenceScore: float = 1.0
    fileUrl: Optional[str] = None
    sampleSnippets: List[DocumentPageSnippet] = Field(default_factory=list)


# ------------------------------------------------------------------------------
# Scrutiny Finding Schemas
# ------------------------------------------------------------------------------
FindingCategory = Literal[
    "Chain of Title Break",
    "Missing Mandatory Document",
    "Boundary Mismatch",
    "Name Variation / Identity",
    "Encumbrance / Charge",
    "Tax / Revenue Default",
    "Stamp Duty & Registration"
]

FindingSeverity = Literal["critical", "warning", "info"]
LawyerDecision = Literal["pending", "accepted", "dismissed", "modified"]


class FindingCreate(BaseModel):
    title: str
    category: str
    severity: str
    description: str
    sourceDocId: Optional[str] = None
    sourceDocName: Optional[str] = None
    pageNumber: int = 1
    evidenceSnippet: Optional[str] = None
    aiConfidence: float = 0.95
    suggestedQueryText: Optional[str] = None
    lawyerDecision: str = "accepted"
    lawyerNotes: Optional[str] = "Manually recorded by Empaneled Advocate."


class FindingUpdate(BaseModel):
    decision: Optional[str] = None
    notes: Optional[str] = None
    title: Optional[str] = None
    severity: Optional[str] = None


class FindingResponse(BaseModel):
    id: str
    caseId: str
    title: str
    category: str
    severity: str
    description: str
    sourceDocId: str
    sourceDocName: str
    pageNumber: int
    evidenceSnippet: str
    aiConfidence: float
    lawyerDecision: str
    lawyerNotes: str
    suggestedQueryText: Optional[str] = None
    isAiGenerated: bool = True
    reviewedAt: Optional[str] = None


# ------------------------------------------------------------------------------
# Case Query (Bank Requisition) Schemas
# ------------------------------------------------------------------------------
class QueryCreate(BaseModel):
    title: str
    draftText: str
    linkedFindingId: Optional[str] = None
    linkedFindingTitle: Optional[str] = None


class QueryUpdate(BaseModel):
    status: Optional[str] = None
    lawyerApprovedText: Optional[str] = None
    draftText: Optional[str] = None
    responseNotes: Optional[str] = None


class QueryResponse(BaseModel):
    id: str
    caseId: str
    queryCode: str
    title: str
    draftText: str
    lawyerApprovedText: Optional[str] = None
    linkedFindingId: Optional[str] = None
    linkedFindingTitle: Optional[str] = None
    status: str
    createdAt: str
    updatedAt: str
    responseNotes: Optional[str] = None


# ------------------------------------------------------------------------------
# LSR Report Schemas
# ------------------------------------------------------------------------------
class ReportUpdate(BaseModel):
    opinionOutcome: Optional[str] = None
    chainOfTitleNarrative: Optional[str] = None
    encumbranceVerificationNotes: Optional[str] = None
    revenueRecordsNotes: Optional[str] = None
    preDisbursementConditions: Optional[List[str]] = None
    postDisbursementConditions: Optional[List[str]] = None
    generalObservations: Optional[str] = None


class ReportResponse(BaseModel):
    caseId: str
    reportRefNumber: str
    reportDate: str
    opinionOutcome: str
    advocateName: str = "Adv. Rajesh Kumar, B.A.L., LL.B."
    barEnrollmentNumber: str = "KAR/1429/2012"
    chamberAddress: str = "Chamber #402, High Court Lawyers Chambers, Bengaluru - 560001"
    propertyDescription: str
    boundariesSummary: str
    chainOfTitleNarrative: str
    encumbranceVerificationNotes: str
    revenueRecordsNotes: str
    preDisbursementConditions: List[str]
    postDisbursementConditions: List[str]
    generalObservations: str
    isSigned: bool
    signedAt: Optional[str] = None
