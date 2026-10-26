"use client";

import React, { createContext, useContext, useState } from "react";
import {
  Case,
  CaseDocument,
  ScrutinyFinding,
  CaseQuery,
  LSRReportData,
  UserProfile,
  ScrutinyRuleTemplate,
  LawyerDecision,
  QueryStatus,
  CaseStatus,
} from "@/types";
import {
  initialCases,
  initialDocuments,
  initialFindings,
  initialQueries,
  initialReports,
  defaultUserProfile,
  defaultScrutinyTemplates,
} from "@/lib/mock-data";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
  read: boolean;
}

interface CaseContextType {
  cases: Case[];
  documents: CaseDocument[];
  findings: ScrutinyFinding[];
  queries: CaseQuery[];
  reports: Record<string, LSRReportData>;
  userProfile: UserProfile;
  templates: ScrutinyRuleTemplate[];
  notifications: NotificationItem[];
  getCaseById: (caseId: string) => Case | undefined;
  addCase: (newCase: Omit<Case, "id" | "createdAt" | "updatedAt" | "documentCount" | "openQueriesCount" | "findingsCount">) => string;
  updateCaseStatus: (caseId: string, status: CaseStatus) => void;
  getDocumentsByCaseId: (caseId: string) => CaseDocument[];
  addDocumentsToCase: (caseId: string, newDocs: Array<Omit<CaseDocument, "id" | "caseId" | "uploadedAt" | "status" | "confidenceScore">>) => void;
  getFindingsByCaseId: (caseId: string) => ScrutinyFinding[];
  updateFindingDecision: (findingId: string, decision: LawyerDecision, lawyerNotes?: string) => void;
  getQueriesByCaseId: (caseId: string) => CaseQuery[];
  addQueryToCase: (caseId: string, queryData: { title: string; draftText: string; linkedFindingId?: string; linkedFindingTitle?: string }) => void;
  updateQueryStatus: (queryId: string, status: QueryStatus) => void;
  updateQueryText: (queryId: string, approvedText: string) => void;
  getReportByCaseId: (caseId: string) => LSRReportData | undefined;
  updateReportData: (caseId: string, data: Partial<LSRReportData>) => void;
  signReport: (caseId: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateTemplate: (templateId: string, updates: Partial<ScrutinyRuleTemplate>) => void;
  markNotificationRead: (id: string) => void;
  addToast: (title: string, message: string, type?: "info" | "success" | "warning") => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

function getInitialStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>(() => getInitialStorage("lsr_cases", initialCases));
  const [documents, setDocuments] = useState<CaseDocument[]>(() => getInitialStorage("lsr_documents", initialDocuments));
  const [findings, setFindings] = useState<ScrutinyFinding[]>(() => getInitialStorage("lsr_findings", initialFindings));
  const [queries, setQueries] = useState<CaseQuery[]>(() => getInitialStorage("lsr_queries", initialQueries));
  const [reports, setReports] = useState<Record<string, LSRReportData>>(() => getInitialStorage("lsr_reports", initialReports));
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [templates, setTemplates] = useState<ScrutinyRuleTemplate[]>(defaultScrutinyTemplates);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Document Classification Complete",
      message: "7 property deeds for Case LSR-2026-001 (Rajesh Kumar) were parsed and categorized.",
      type: "info",
      timestamp: "10 mins ago",
      read: false,
    },
    {
      id: "notif-2",
      title: "New Discrepancy Flag",
      message: "Potential boundary mismatch identified between 2016 Sale Deed and BMRDA layout.",
      type: "warning",
      timestamp: "1 hour ago",
      read: false,
    },
  ]);

  const saveState = (key: string, val: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // Ignore in mock environment
    }
  };

  const addToast = (title: string, message: string, type: "info" | "success" | "warning" = "info") => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: "Just now",
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const getCaseById = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  const addCase = (
    newCaseData: Omit<Case, "id" | "createdAt" | "updatedAt" | "documentCount" | "openQueriesCount" | "findingsCount">
  ): string => {
    const nextNum = cases.length + 1;
    const newId = `LSR-2026-${String(nextNum).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const createdCase: Case = {
      ...newCaseData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      documentCount: 0,
      openQueriesCount: 0,
      findingsCount: { critical: 0, warning: 0, info: 0 },
    };

    const updated = [createdCase, ...cases];
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Case Created", `New scrutiny case ${newId} initialized.`, "success");
    return newId;
  };

  const updateCaseStatus = (caseId: string, status: CaseStatus) => {
    const updated = cases.map((c) => (c.id === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c));
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Status Updated", `Case ${caseId} status changed to ${status}.`, "info");
  };

  const getDocumentsByCaseId = (caseId: string) => {
    return documents.filter((d) => d.caseId === caseId);
  };

  const addDocumentsToCase = (
    caseId: string,
    newDocs: Array<Omit<CaseDocument, "id" | "caseId" | "uploadedAt" | "status" | "confidenceScore">>
  ) => {
    const now = new Date().toISOString();
    const createdDocs: CaseDocument[] = newDocs.map((d, index) => ({
      ...d,
      id: `doc-${Date.now()}-${index}`,
      caseId,
      uploadedAt: now,
      status: "Review Ready",
      confidenceScore: 0.95,
      isSupplementary: false,
    }));

    const updatedDocs = [...createdDocs, ...documents];
    setDocuments(updatedDocs);
    saveState("lsr_documents", updatedDocs);

    // Update case document count
    const updatedCases = cases.map((c) =>
      c.id === caseId
        ? {
            ...c,
            documentCount: c.documentCount + createdDocs.length,
            status: c.status === "Intake" ? ("Document Processing" as CaseStatus) : c.status,
            updatedAt: now,
          }
        : c
    );
    setCases(updatedCases);
    saveState("lsr_cases", updatedCases);
    addToast("Documents Ingested", `${createdDocs.length} PDF documents added for review.`, "success");
  };

  const getFindingsByCaseId = (caseId: string) => {
    return findings.filter((f) => f.caseId === caseId);
  };

  const updateFindingDecision = (findingId: string, decision: LawyerDecision, lawyerNotes?: string) => {
    const updated = findings.map((f) => {
      if (f.id === findingId) {
        return {
          ...f,
          lawyerDecision: decision,
          lawyerNotes: lawyerNotes !== undefined ? lawyerNotes : f.lawyerNotes,
          reviewedAt: new Date().toISOString(),
        };
      }
      return f;
    });
    setFindings(updated);
    saveState("lsr_findings", updated);
    addToast("Decision Saved", `Finding marked as ${decision.toUpperCase()}.`, "info");
  };

  const getQueriesByCaseId = (caseId: string) => {
    return queries.filter((q) => q.caseId === caseId);
  };

  const addQueryToCase = (
    caseId: string,
    queryData: { title: string; draftText: string; linkedFindingId?: string; linkedFindingTitle?: string }
  ) => {
    const count = queries.filter((q) => q.caseId === caseId).length + 1;
    const now = new Date().toISOString();
    const newQuery: CaseQuery = {
      id: `qry-${Date.now()}`,
      caseId,
      queryCode: `QRY/${String(count).padStart(2, "0")}`,
      title: queryData.title,
      draftText: queryData.draftText,
      lawyerApprovedText: queryData.draftText,
      linkedFindingId: queryData.linkedFindingId,
      linkedFindingTitle: queryData.linkedFindingTitle,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newQuery, ...queries];
    setQueries(updated);
    saveState("lsr_queries", updated);

    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, openQueriesCount: c.openQueriesCount + 1, updatedAt: now } : c))
    );
    addToast("Query Created", `New query ${newQuery.queryCode} drafted.`, "success");
  };

  const updateQueryStatus = (queryId: string, status: QueryStatus) => {
    const now = new Date().toISOString();
    const updated = queries.map((q) => (q.id === queryId ? { ...q, status, updatedAt: now } : q));
    setQueries(updated);
    saveState("lsr_queries", updated);
    addToast("Query Updated", `Query status changed to ${status}.`, "info");
  };

  const updateQueryText = (queryId: string, approvedText: string) => {
    const now = new Date().toISOString();
    const updated = queries.map((q) =>
      q.id === queryId ? { ...q, lawyerApprovedText: approvedText, status: "Approved" as QueryStatus, updatedAt: now } : q
    );
    setQueries(updated);
    saveState("lsr_queries", updated);
    addToast("Query Approved", "Advocate-approved text saved.", "success");
  };

  const getReportByCaseId = (caseId: string): LSRReportData | undefined => {
    if (reports[caseId]) return reports[caseId];

    const c = getCaseById(caseId);
    if (!c) return undefined;

    const draft: LSRReportData = {
      caseId,
      reportRefNumber: `LSR/${c.bankName.substring(0, 3).toUpperCase()}/2026/${c.id.split("-")[2]}`,
      reportDate: new Date().toISOString().split("T")[0],
      opinionOutcome: "Clear with Pre-Disbursement Conditions",
      advocateName: userProfile.name,
      barEnrollmentNumber: userProfile.barEnrollmentNumber,
      chamberAddress: userProfile.chamberName + ", " + userProfile.address,
      propertyDescription: `${c.propertyType} situated at ${c.propertyAddress}, bearing Survey No. ${c.surveyNumber}.`,
      boundariesSummary: `North: ${c.boundaries.north}; South: ${c.boundaries.south}; East: ${c.boundaries.east}; West: ${c.boundaries.west}.`,
      chainOfTitleNarrative: "Devolution of title has been scrutinized based on uploaded documents. Sequence of transfers from prior vendors to present borrower is under advocate evaluation.",
      encumbranceVerificationNotes: "Encumbrance Certificate search reports evaluated. No prior registered statutory attachments noted.",
      revenueRecordsNotes: `Khata No. ${c.khataNumber || "Registered"} verified with municipal records.`,
      preDisbursementConditions: [
        "Deposit of original title deed and prior link documents with the bank.",
        "Execution and registration of Memorandum of Deposit of Title Deeds (MODTD).",
      ],
      postDisbursementConditions: [
        "Submission of latest property tax paid receipts.",
      ],
      generalObservations: "Title is found to be satisfactory subject to adherence to stated requisitions.",
      isSigned: false,
    };
    return draft;
  };

  const updateReportData = (caseId: string, data: Partial<LSRReportData>) => {
    const existing = getReportByCaseId(caseId);
    if (!existing) return;
    const updated = { ...existing, ...data };
    const newReports = { ...reports, [caseId]: updated };
    setReports(newReports);
    saveState("lsr_reports", newReports);
    addToast("Draft Saved", "Legal scrutiny report updated.", "success");
  };

  const signReport = (caseId: string) => {
    const existing = getReportByCaseId(caseId);
    if (!existing) return;
    const updated: LSRReportData = {
      ...existing,
      isSigned: true,
      signedAt: new Date().toISOString(),
    };
    const newReports = { ...reports, [caseId]: updated };
    setReports(newReports);
    saveState("lsr_reports", newReports);

    updateCaseStatus(caseId, "Completed");
    addToast("Report Signed", "Draft signed and finalized by Advocate.", "success");
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    addToast("Profile Saved", "Advocate chamber profile updated.", "success");
  };

  const updateTemplate = (templateId: string, updates: Partial<ScrutinyRuleTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t)));
    addToast("Template Saved", "Bank scrutiny rules template updated.", "success");
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <CaseContext.Provider
      value={{
        cases,
        documents,
        findings,
        queries,
        reports,
        userProfile,
        templates,
        notifications,
        getCaseById,
        addCase,
        updateCaseStatus,
        getDocumentsByCaseId,
        addDocumentsToCase,
        getFindingsByCaseId,
        updateFindingDecision,
        getQueriesByCaseId,
        addQueryToCase,
        updateQueryStatus,
        updateQueryText,
        getReportByCaseId,
        updateReportData,
        signReport,
        updateUserProfile,
        updateTemplate,
        markNotificationRead,
        addToast,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error("useCases must be used within a CaseProvider");
  }
  return context;
}
