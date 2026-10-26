export type CaseStatus =
  | "Intake"
  | "Document Processing"
  | "Scrutiny Review"
  | "Queries Raised"
  | "Completed";

export type PropertyType =
  | "Residential Plot"
  | "Apartment / Flat"
  | "Independent House / Villa"
  | "Commercial Property"
  | "Agricultural / Non-Agricultural Land";

export interface Case {
  id: string;
  caseNumber: string;
  borrowerName: string;
  coBorrowerName?: string;
  bankName: string;
  branch: string;
  propertyAddress: string;
  propertyType: PropertyType;
  surveyNumber: string;
  khataNumber?: string;
  boundaries: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  loanAmount: string;
  loanType: string;
  status: CaseStatus;
  assignedLawyer: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  openQueriesCount: number;
  findingsCount: {
    critical: number;
    warning: number;
    info: number;
  };
}

export type DocumentType =
  | "Sale Deed / Title Deed"
  | "Mother Deed / Prior Deed"
  | "Encumbrance Certificate (EC)"
  | "Khata Certificate / Patta"
  | "Khata Extract / RTC"
  | "Property Tax Receipt"
  | "Building Plan Approval"
  | "Possession Certificate"
  | "Identity Proof (Aadhaar/PAN)"
  | "Other Ancillary Document";

export type DocumentProcessingStatus =
  | "Uploaded"
  | "Extracting Text"
  | "Classified"
  | "Review Ready"
  | "Failed";

export interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string;
  docType: DocumentType;
  docDate: string;
  registrationNumber?: string;
  subRegistrarOffice?: string;
  pageCount: number;
  fileSizeBytes: number;
  uploadedAt: string;
  status: DocumentProcessingStatus;
  confidenceScore: number;
  isSupplementary?: boolean;
  sampleSnippets?: Array<{ page: number; text: string }>;
}

export type FindingSeverity = "critical" | "warning" | "info";

export type FindingCategory =
  | "Chain of Title Break"
  | "Missing Mandatory Document"
  | "Boundary Mismatch"
  | "Name Variation / Identity"
  | "Encumbrance / Charge"
  | "Tax / Revenue Default"
  | "Stamp Duty & Registration";

export type LawyerDecision = "pending" | "accepted" | "dismissed" | "modified";

export interface ScrutinyFinding {
  id: string;
  caseId: string;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  description: string;
  sourceDocId: string;
  sourceDocName: string;
  pageNumber: number;
  evidenceSnippet: string;
  aiConfidence: number;
  lawyerDecision: LawyerDecision;
  lawyerNotes: string;
  modifiedFindingText?: string;
  suggestedQueryText?: string;
  reviewedAt?: string;
}

export type QueryStatus = "Draft" | "Approved" | "Sent to Bank" | "Resolved" | "Waived";

export interface CaseQuery {
  id: string;
  caseId: string;
  queryCode: string;
  title: string;
  draftText: string;
  lawyerApprovedText?: string;
  linkedFindingId?: string;
  linkedFindingTitle?: string;
  status: QueryStatus;
  createdAt: string;
  updatedAt: string;
  responseNotes?: string;
}

export type LegalOpinionOutcome =
  | "Clear and Marketable Title"
  | "Clear with Pre-Disbursement Conditions"
  | "Defective Title - Unfit for Mortgage"
  | "Awaiting Critical Query Resolution";

export interface LSRReportData {
  caseId: string;
  reportRefNumber: string;
  reportDate: string;
  opinionOutcome: LegalOpinionOutcome;
  advocateName: string;
  barEnrollmentNumber: string;
  chamberAddress: string;
  propertyDescription: string;
  boundariesSummary: string;
  chainOfTitleNarrative: string;
  encumbranceVerificationNotes: string;
  revenueRecordsNotes: string;
  preDisbursementConditions: string[];
  postDisbursementConditions: string[];
  generalObservations: string;
  isSigned: boolean;
  signedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "Senior Empaneled Advocate" | "Associate Advocate" | "Legal Assistant";
  barEnrollmentNumber: string;
  chamberName: string;
  phone: string;
  address: string;
}

export interface ScrutinyRuleTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  minChainYears: number;
  minEcYears: number;
  mandatoryDocuments: string[];
  stateJurisdiction: string;
  isActive: boolean;
}
