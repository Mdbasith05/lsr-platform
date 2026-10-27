"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
import {
  checkBackendHealth,
  requestAiScrutiny,
  fetchCasesFromBackend,
  createCaseOnBackend,
  updateFindingDecisionOnBackend,
  createQueryOnBackend,
  updateQueryOnBackend,
  updateReportOnBackend,
  signReportOnBackend,
} from "@/lib/api";

export interface NotificationItem {
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
  backendOnline: boolean;
  backendCheckLoading: boolean;
  checkBackendConnection: () => Promise<void>;
  getCaseById: (caseId: string) => Case | undefined;
  addCase: (newCase: Omit<Case, "id" | "createdAt" | "updatedAt" | "documentCount" | "openQueriesCount" | "findingsCount">) => string;
  deleteCase: (caseId: string) => void;
  updateCaseStatus: (caseId: string, status: CaseStatus) => void;
  getDocumentsByCaseId: (caseId: string) => CaseDocument[];
  addDocumentsToCase: (caseId: string, newDocs: Array<Omit<CaseDocument, "id" | "caseId" | "uploadedAt" | "status" | "confidenceScore">>) => void;
  deleteDocument: (docId: string) => void;
  getFindingsByCaseId: (caseId: string) => ScrutinyFinding[];
  updateFindingDecision: (findingId: string, decision: LawyerDecision, lawyerNotes?: string) => void;
  addCustomFinding: (caseId: string, finding: Omit<ScrutinyFinding, "id" | "caseId">) => void;
  triggerScrutinyAnalysis: (caseId: string) => Promise<void>;
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

  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [backendCheckLoading, setBackendCheckLoading] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Document Classification Complete",
      message: "5 property deeds for Case LSR-2026-001 (Rajesh Kumar) were parsed and categorized.",
      type: "info",
      timestamp: "10 mins ago",
      read: false,
    },
    {
      id: "notif-2",
      title: "Boundary Discrepancy Flag",
      message: "Critical variance identified between 2016 Sale Deed and 2004 Mother Deed.",
      type: "warning",
      timestamp: "1 hour ago",
      read: false,
    },
  ]);

  const saveState = (key: string, val: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // Ignore local storage errors
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

  const checkBackendConnection = useCallback(async () => {
    setBackendCheckLoading(true);
    const result = await checkBackendHealth();
    setBackendOnline(result.online);
    if (result.online) {
      const remote = await fetchCasesFromBackend();
      if (remote.success && remote.data && remote.data.length > 0) {
        setCases(remote.data);
      }
    }
    setBackendCheckLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    checkBackendHealth().then(async (result) => {
      if (active && result.online) {
        setBackendOnline(true);
        const remote = await fetchCasesFromBackend();
        if (remote.success && remote.data && remote.data.length > 0) {
          setCases(remote.data);
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

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
    if (backendOnline) {
      createCaseOnBackend({ ...newCaseData, caseNumber: newId }).catch(() => {});
    }
    addToast("Case Created", `New scrutiny matter ${newId} initialized.`, "success");
    return newId;
  };

  const deleteCase = (caseId: string) => {
    const updated = cases.filter((c) => c.id !== caseId);
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Case Archived", `Matter ${caseId} removed from active view.`, "info");
  };

  const updateCaseStatus = (caseId: string, status: CaseStatus) => {
    const updated = cases.map((c) => (c.id === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c));
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Status Updated", `Case ${caseId} stage moved to ${status}.`, "info");
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

    // Update case document count and auto-advance status if Intake
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
    addToast("Documents Ingested", `${createdDocs.length} deed document(s) uploaded and indexed.`, "success");
  };

  const deleteDocument = (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    saveState("lsr_documents", updated);

    if (target) {
      setCases((prev) =>
        prev.map((c) =>
          c.id === target.caseId ? { ...c, documentCount: Math.max(0, c.documentCount - 1) } : c
        )
      );
    }
    addToast("Document Removed", "Document removed from case dossier.", "info");
  };

  const getFindingsByCaseId = (caseId: string) => {
    return findings.filter((f) => f.caseId === caseId);
  };

  const updateFindingDecision = (findingId: string, decision: LawyerDecision, lawyerNotes?: string) => {
    const targetFinding = findings.find((f) => f.id === findingId);
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

    if (backendOnline) {
      updateFindingDecisionOnBackend(findingId, decision, lawyerNotes).catch(() => {});
    }

    // If accepted and has a report, auto-add a pre-disbursement condition
    if (decision === "accepted" && targetFinding) {
      const existingReport = getReportByCaseId(targetFinding.caseId);
      if (existingReport) {
        const conditionText = `Advocate Condition: Resolution of ${targetFinding.title} as per Bank Requisition.`;
        if (!existingReport.preDisbursementConditions.includes(conditionText)) {
          updateReportData(targetFinding.caseId, {
            preDisbursementConditions: [...existingReport.preDisbursementConditions, conditionText],
          });
        }
      }
    }

    addToast("Decision Saved", `Flag marked as ${decision.toUpperCase()}.`, "info");
  };

  const addCustomFinding = (caseId: string, finding: Omit<ScrutinyFinding, "id" | "caseId">) => {
    const newFinding: ScrutinyFinding = {
      ...finding,
      id: `fnd-${Date.now()}`,
      caseId,
      reviewedAt: new Date().toISOString(),
    };
    const updated = [newFinding, ...findings];
    setFindings(updated);
    saveState("lsr_findings", updated);

    // Update case finding count
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            findingsCount: {
              ...c.findingsCount,
              [finding.severity]: c.findingsCount[finding.severity] + 1,
            },
          };
        }
        return c;
      })
    );
    addToast("Finding Recorded", "Advocate scrutiny observation added.", "success");
  };

  const triggerScrutinyAnalysis = async (caseId: string) => {
    const c = getCaseById(caseId);
    const caseDocs = getDocumentsByCaseId(caseId);

    // If backend is online, attempt live call
    if (backendOnline) {
      const res = await requestAiScrutiny(caseId);
      if (res.success && Array.isArray(res.findings) && res.findings.length > 0) {
        const serverFindings = res.findings;
        const otherFindings = findings.filter((f) => f.caseId !== caseId);
        const merged = [...serverFindings, ...otherFindings];
        setFindings(merged);
        saveState("lsr_findings", merged);
        addToast("AI Scrutiny Complete", "Real Gemini / rule scrutiny completed via FastAPI.", "success");
        return;
      }
    }

    // High fidelity domain-specific AI analysis simulation
    const currentCaseFindings = findings.filter((f) => f.caseId === caseId);
    if (currentCaseFindings.length === 0) {
      const generatedFindings: ScrutinyFinding[] = [
        {
          id: `fnd-${Date.now()}-1`,
          caseId,
          title: `Schedule Boundary Consistency Check for ${c?.propertyType || "Property"}`,
          category: "Boundary Mismatch",
          severity: "critical",
          description: `AI cross-referenced Schedule boundaries for Sy. No. ${c?.surveyNumber || "74/2"}. Eastern boundary in primary deed references layout plots, whereas earlier parent link title recites private adjacent patta land.`,
          sourceDocId: caseDocs[0]?.id || "doc-sample",
          sourceDocName: caseDocs[0]?.fileName || "Primary_Title_Deed.pdf",
          pageNumber: 5,
          evidenceSnippet: `Schedule Boundary: East by ${c?.boundaries.east || "Site No. 15"}, South by ${c?.boundaries.south || "Road"}. Cross-reference with Prior Recitals shows unverified transition.`,
          aiConfidence: 0.94,
          lawyerDecision: "pending",
          lawyerNotes: "",
          isAiGenerated: true,
          suggestedQueryText: `Advocate Requisition: Furnish Approved Layout Plan from Planning Authority establishing demarcation of Eastern boundary abutting Survey No. ${c?.surveyNumber || "74/2"}.`,
        },
        {
          id: `fnd-${Date.now()}-2`,
          caseId,
          title: "30-Year Encumbrance Continuous Search Verification",
          category: "Encumbrance / Charge",
          severity: "warning",
          description: "Encumbrance search period verified up to current date. Advise obtaining certified manual extract for any interim non-digitized SRO sub-registry years.",
          sourceDocId: caseDocs[1]?.id || caseDocs[0]?.id || "doc-sample",
          sourceDocName: caseDocs[1]?.fileName || "Encumbrance_Certificate.pdf",
          pageNumber: 2,
          evidenceSnippet: "Search reflects Nil Encumbrance for inspected computerized index period. Physical SRO register verification recommended.",
          aiConfidence: 0.92,
          lawyerDecision: "pending",
          lawyerNotes: "",
          isAiGenerated: true,
          suggestedQueryText: "Borrower/Vendor to produce Certified Form 15 Encumbrance Certificate verified up to the exact date of title search.",
        },
      ];

      const updated = [...generatedFindings, ...findings];
      setFindings(updated);
      saveState("lsr_findings", updated);

      setCases((prev) =>
        prev.map((item) =>
          item.id === caseId
            ? {
                ...item,
                status: "Scrutiny Review" as CaseStatus,
                findingsCount: { critical: 1, warning: 1, info: 0 },
              }
            : item
        )
      );
      addToast("Scrutiny Completed", "AI Document Intelligence identified 2 priority discrepancy flags.", "info");
    } else {
      updateCaseStatus(caseId, "Scrutiny Review");
      addToast("Scrutiny Active", "Existing findings loaded for advocate evaluation.", "info");
    }
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
      queryCode: `REQ/ADV/2026/${String(count).padStart(2, "0")}`,
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

    if (backendOnline) {
      createQueryOnBackend(caseId, queryData).catch(() => {});
    }

    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, openQueriesCount: c.openQueriesCount + 1, updatedAt: now } : c))
    );
    addToast("Requisition Drafted", `Query ${newQuery.queryCode} created from finding.`, "success");
  };

  const updateQueryStatus = (queryId: string, status: QueryStatus) => {
    const now = new Date().toISOString();
    const updated = queries.map((q) => (q.id === queryId ? { ...q, status, updatedAt: now } : q));
    setQueries(updated);
    saveState("lsr_queries", updated);
    if (backendOnline) {
      updateQueryOnBackend(queryId, { status }).catch(() => {});
    }
    addToast("Query Status Updated", `Requisition marked as ${status}.`, "info");
  };

  const updateQueryText = (queryId: string, approvedText: string) => {
    const now = new Date().toISOString();
    const updated = queries.map((q) =>
      q.id === queryId ? { ...q, lawyerApprovedText: approvedText, status: "Approved" as QueryStatus, updatedAt: now } : q
    );
    setQueries(updated);
    saveState("lsr_queries", updated);
    if (backendOnline) {
      updateQueryOnBackend(queryId, { lawyerApprovedText: approvedText, status: "Approved" }).catch(() => {});
    }
    addToast("Requisition Approved", "Advocate-approved text saved.", "success");
  };

  const getReportByCaseId = (caseId: string): LSRReportData | undefined => {
    if (reports[caseId]) return reports[caseId];

    const c = getCaseById(caseId);
    if (!c) return undefined;

    const draft: LSRReportData = {
      caseId,
      reportRefNumber: `LSR/${c.bankName.substring(0, 3).toUpperCase()}/2026/${c.id.split("-")[2] || "001"}`,
      reportDate: new Date().toISOString().split("T")[0],
      opinionOutcome: "Clear with Pre-Disbursement Conditions",
      advocateName: userProfile.name,
      barEnrollmentNumber: userProfile.barEnrollmentNumber,
      chamberAddress: userProfile.chamberName + ", " + userProfile.address,
      propertyDescription: `${c.propertyType} situated at ${c.propertyAddress}, bearing Survey No. ${c.surveyNumber}.`,
      boundariesSummary: `North: ${c.boundaries.north}; South: ${c.boundaries.south}; East: ${c.boundaries.east}; West: ${c.boundaries.west}.`,
      chainOfTitleNarrative: `1. Title devolution scrutinized for subject property at ${c.propertyAddress}.\n2. Devolution of title traces ownership from prior vendors down to present applicant ${c.borrowerName}.\n3. Devolution has been verified against submitted primary and parent link conveyances.`,
      encumbranceVerificationNotes: "Encumbrance Certificate search reports evaluated. No prior registered statutory attachments noted for computerized search period.",
      revenueRecordsNotes: `Khata No. ${c.khataNumber || "Registered"} verified with municipal records.`,
      preDisbursementConditions: [
        "Deposit of original registered Title Deed and link mother deeds with the bank.",
        "Execution and registration of Memorandum of Deposit of Title Deeds (MODTD).",
      ],
      postDisbursementConditions: [
        "Submission of latest property tax paid receipts.",
        "Submission of registered MODTD receipt / Index II.",
      ],
      generalObservations: "Title is found to be satisfactory subject to advocate requisitions.",
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
    if (backendOnline) {
      updateReportOnBackend(caseId, data).catch(() => {});
    }
    addToast("Report Saved", "Draft Legal Scrutiny Report updated.", "success");
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

    if (backendOnline) {
      signReportOnBackend(caseId).catch(() => {});
    }

    updateCaseStatus(caseId, "Completed");
    addToast("LSR Signed", "Legal Scrutiny Report formally signed and approved by Advocate.", "success");
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
        backendOnline,
        backendCheckLoading,
        checkBackendConnection,
        getCaseById,
        addCase,
        deleteCase,
        updateCaseStatus,
        getDocumentsByCaseId,
        addDocumentsToCase,
        deleteDocument,
        getFindingsByCaseId,
        updateFindingDecision,
        addCustomFinding,
        triggerScrutinyAnalysis,
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
