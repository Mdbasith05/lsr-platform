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
  fetchCaseByIdFromBackend,
  fetchCaseFullDetailsFromBackend,
  createCaseOnBackend,
  updateCaseOnBackend,
  deleteCaseOnBackend,
  fetchCaseDocumentsFromBackend,
  deleteDocumentOnBackend,
  fetchCaseFindingsFromBackend,
  addFindingOnBackend,
  updateFindingDecisionOnBackend,
  fetchCaseQueriesFromBackend,
  createQueryOnBackend,
  updateQueryOnBackend,
  deleteQueryOnBackend,
  fetchCaseReportFromBackend,
  updateReportOnBackend,
  signReportOnBackend,
  amendReportOnBackend,
} from "@/lib/api";
import { useAuth } from "@/context/auth-context";

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
  loadCaseDetails: (caseId: string) => Promise<void>;
  getCaseById: (caseId: string) => Case | undefined;
  addCase: (newCase: Omit<Case, "id" | "createdAt" | "updatedAt" | "documentCount" | "openQueriesCount" | "findingsCount">) => Promise<string>;
  deleteCase: (caseId: string) => Promise<void>;
  updateCaseStatus: (caseId: string, status: CaseStatus) => Promise<void>;
  getDocumentsByCaseId: (caseId: string) => CaseDocument[];
  addDocumentsToCase: (caseId: string, newDocs: Array<Omit<CaseDocument, "id" | "caseId" | "uploadedAt" | "status" | "confidenceScore">>) => void;
  deleteDocument: (docId: string) => Promise<void>;
  getFindingsByCaseId: (caseId: string) => ScrutinyFinding[];
  updateFindingDecision: (findingId: string, decision: LawyerDecision, lawyerNotes?: string) => Promise<void>;
  addCustomFinding: (caseId: string, finding: Omit<ScrutinyFinding, "id" | "caseId">) => Promise<void>;
  triggerScrutinyAnalysis: (caseId: string) => Promise<void>;
  getQueriesByCaseId: (caseId: string) => CaseQuery[];
  addQueryToCase: (caseId: string, queryData: { title: string; draftText: string; linkedFindingId?: string; linkedFindingTitle?: string }) => Promise<void>;
  updateQueryStatus: (queryId: string, status: QueryStatus) => Promise<void>;
  updateQueryText: (queryId: string, approvedText: string) => Promise<void>;
  deleteQuery: (queryId: string) => Promise<void>;
  getReportByCaseId: (caseId: string) => LSRReportData | undefined;
  updateReportData: (caseId: string, data: Partial<LSRReportData>) => Promise<void>;
  signReport: (caseId: string) => Promise<void>;
  amendReport: (caseId: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateTemplate: (templateId: string, updates: Partial<ScrutinyRuleTemplate>) => void;
  markNotificationRead: (id: string) => void;
  addToast: (title: string, message: string, type?: "info" | "success" | "warning") => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

function purgeLegacyMockStorageOnce() {
  if (typeof window === "undefined") return;
  try {
    const initialized = localStorage.getItem("lsr_clean_initial_v2");
    if (!initialized) {
      localStorage.removeItem("lsr_cases");
      localStorage.removeItem("lsr_documents");
      localStorage.removeItem("lsr_findings");
      localStorage.removeItem("lsr_queries");
      localStorage.removeItem("lsr_reports");
      localStorage.setItem("lsr_clean_initial_v2", "true");
    }
  } catch {
    // Ignore localStorage access errors
  }
}

function getInitialStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    purgeLegacyMockStorageOnce();
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

  const { profile: authProfile, session } = useAuth();

  useEffect(() => {
    if (authProfile) {
      setUserProfile(authProfile);
    } else {
      setUserProfile(defaultUserProfile);
      setCases([]);
      setDocuments([]);
      setFindings([]);
      setQueries([]);
      setReports({});
    }
  }, [authProfile]);

  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [backendCheckLoading, setBackendCheckLoading] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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
    if (result.online && session) {
      const remote = await fetchCasesFromBackend();
      if (remote.success && Array.isArray(remote.data)) {
        setCases(remote.data);
      }
    }
    setBackendCheckLoading(false);
  }, [session]);

  useEffect(() => {
    let active = true;

    if (!session) {
      setCases([]);
      setDocuments([]);
      setFindings([]);
      setQueries([]);
      setReports({});
      return;
    }

    checkBackendHealth().then(async (result) => {
      if (active && result.online) {
        setBackendOnline(true);
        const remote = await fetchCasesFromBackend();
        if (active && remote.success && Array.isArray(remote.data)) {
          setCases(remote.data);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [session]);

  const getCaseById = (caseId: string) => {
    return cases.find((c) => c.id === caseId || c.caseNumber === caseId);
  };

  // Rehydrate complete case details from PostgreSQL using single atomic round-trip
  const loadCaseDetails = useCallback(async (caseId: string) => {
    if (!caseId) return;

    if (backendOnline) {
      // 1. Attempt high-performance single-roundtrip full fetch
      const fullRes = await fetchCaseFullDetailsFromBackend(caseId);
      if (fullRes.success && fullRes.data) {
        const {
          case: fetchedCase,
          documents: fetchedDocs,
          findings: fetchedFindings,
          queries: fetchedQueries,
          report: fetchedReport,
        } = fullRes.data;
        const resolvedId = fetchedCase.id;

        // Atomically update cases
        setCases((prev) => [
          fetchedCase,
          ...prev.filter(
            (c) => c.id !== fetchedCase.id && c.caseNumber !== fetchedCase.caseNumber
          ),
        ]);

        // Atomically update documents
        setDocuments((prev) => [
          ...fetchedDocs,
          ...prev.filter((d) => d.caseId !== resolvedId && d.caseId !== caseId),
        ]);

        // Atomically update findings
        setFindings((prev) => [
          ...fetchedFindings,
          ...prev.filter((f) => f.caseId !== resolvedId && f.caseId !== caseId),
        ]);

        // Atomically update queries
        setQueries((prev) => [
          ...fetchedQueries,
          ...prev.filter((q) => q.caseId !== resolvedId && q.caseId !== caseId),
        ]);

        // Atomically update reports
        if (fetchedReport) {
          setReports((prev) => ({
            ...prev,
            [resolvedId]: fetchedReport,
            [caseId]: fetchedReport,
          }));
        }
        return;
      }

      // 2. Fallback to parallel individual endpoints if full endpoint fails
      let targetCase = cases.find((c) => c.id === caseId || c.caseNumber === caseId);
      if (!targetCase) {
        const caseRes = await fetchCaseByIdFromBackend(caseId);
        if (caseRes.success && caseRes.data) {
          targetCase = caseRes.data;
          setCases((prev) => [caseRes.data!, ...prev.filter((c) => c.id !== caseRes.data!.id)]);
        }
      }

      const resolvedId = targetCase?.id || caseId;

      // Parallel fetch documents, findings, queries, and report
      const [docsRes, findingsRes, queriesRes, reportRes] = await Promise.all([
        fetchCaseDocumentsFromBackend(resolvedId),
        fetchCaseFindingsFromBackend(resolvedId),
        fetchCaseQueriesFromBackend(resolvedId),
        fetchCaseReportFromBackend(resolvedId),
      ]);

      if (docsRes.success && Array.isArray(docsRes.data)) {
        setDocuments((prev) => [
          ...docsRes.data!,
          ...prev.filter((d) => d.caseId !== resolvedId && d.caseId !== caseId),
        ]);
      }

      if (findingsRes.success && Array.isArray(findingsRes.data)) {
        setFindings((prev) => [
          ...findingsRes.data!,
          ...prev.filter((f) => f.caseId !== resolvedId && f.caseId !== caseId),
        ]);
      }

      if (queriesRes.success && Array.isArray(queriesRes.data)) {
        setQueries((prev) => [
          ...queriesRes.data!,
          ...prev.filter((q) => q.caseId !== resolvedId && q.caseId !== caseId),
        ]);
      }

      if (reportRes.success && reportRes.data) {
        setReports((prev) => ({
          ...prev,
          [resolvedId]: reportRes.data!,
          [caseId]: reportRes.data!,
        }));
      }
    }
  }, [backendOnline, cases]);

  const addCase = async (
    newCaseData: Omit<Case, "id" | "createdAt" | "updatedAt" | "documentCount" | "openQueriesCount" | "findingsCount">
  ): Promise<string> => {
    const nextNum = cases.length + 1;
    const fallbackNum = `LSR-2026-${String(nextNum).padStart(3, "0")}`;
    const now = new Date().toISOString();

    if (backendOnline) {
      const res = await createCaseOnBackend({ ...newCaseData, caseNumber: newCaseData.caseNumber || fallbackNum });
      if (res.success && res.data) {
        const serverCase = res.data;
        const updated = [serverCase, ...cases.filter((c) => c.id !== serverCase.id)];
        setCases(updated);
        saveState("lsr_cases", updated);
        addToast("Case Created", `New scrutiny matter ${serverCase.caseNumber} initialized on Supabase.`, "success");
        return serverCase.id;
      }
    }

    const createdCase: Case = {
      ...newCaseData,
      id: fallbackNum,
      caseNumber: newCaseData.caseNumber || fallbackNum,
      createdAt: now,
      updatedAt: now,
      documentCount: 0,
      openQueriesCount: 0,
      findingsCount: { critical: 0, warning: 0, info: 0 },
    };

    const updated = [createdCase, ...cases];
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Case Created", `New scrutiny matter ${fallbackNum} initialized.`, "success");
    return fallbackNum;
  };

  const deleteCase = async (caseId: string) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;

    if (backendOnline) {
      await deleteCaseOnBackend(resolvedId).catch(() => {});
    }

    const updated = cases.filter((c) => c.id !== resolvedId && c.caseNumber !== resolvedId);
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Case Archived", `Matter ${targetCase?.caseNumber || caseId} archived.`, "info");
  };

  const updateCaseStatus = async (caseId: string, status: CaseStatus) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;

    if (backendOnline) {
      await updateCaseOnBackend(resolvedId, { status }).catch(() => {});
    }

    const updated = cases.map((c) =>
      c.id === resolvedId || c.caseNumber === resolvedId ? { ...c, status, updatedAt: new Date().toISOString() } : c
    );
    setCases(updated);
    saveState("lsr_cases", updated);
    addToast("Status Updated", `Case stage moved to ${status}.`, "info");
  };

  const getDocumentsByCaseId = (caseId: string) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    return documents.filter((d) => d.caseId === resolvedId || d.caseId === caseId);
  };

  const addDocumentsToCase = (
    caseId: string,
    newDocs: Array<Omit<CaseDocument, "id" | "caseId" | "uploadedAt" | "status" | "confidenceScore">>
  ) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    const now = new Date().toISOString();

    const createdDocs: CaseDocument[] = newDocs.map((d, index) => ({
      ...d,
      id: `doc-${Date.now()}-${index}`,
      caseId: resolvedId,
      uploadedAt: now,
      status: "Review Ready",
      confidenceScore: 0.95,
      isSupplementary: false,
    }));

    const updatedDocs = [...createdDocs, ...documents];
    setDocuments(updatedDocs);
    saveState("lsr_documents", updatedDocs);

    const updatedCases = cases.map((c) =>
      c.id === resolvedId || c.caseNumber === resolvedId
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

  const deleteDocument = async (docId: string) => {
    const target = documents.find((d) => d.id === docId);

    if (backendOnline) {
      await deleteDocumentOnBackend(docId).catch(() => {});
    }

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
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    return findings.filter((f) => f.caseId === resolvedId || f.caseId === caseId);
  };

  const updateFindingDecision = async (findingId: string, decision: LawyerDecision, lawyerNotes?: string) => {
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
      await updateFindingDecisionOnBackend(findingId, decision, lawyerNotes).catch(() => {});
    }

    if (decision === "accepted" && targetFinding) {
      const existingReport = getReportByCaseId(targetFinding.caseId);
      if (existingReport && !existingReport.isSigned) {
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

  const addCustomFinding = async (caseId: string, finding: Omit<ScrutinyFinding, "id" | "caseId">) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;

    if (backendOnline) {
      const res = await addFindingOnBackend(resolvedId, finding);
      if (res.success && res.data) {
        const updated = [res.data, ...findings];
        setFindings(updated);
        saveState("lsr_findings", updated);
        addToast("Finding Recorded", "Advocate scrutiny observation saved to database.", "success");
        return;
      }
    }

    const newFinding: ScrutinyFinding = {
      ...finding,
      id: `fnd-${Date.now()}`,
      caseId: resolvedId,
      reviewedAt: new Date().toISOString(),
    };
    const updated = [newFinding, ...findings];
    setFindings(updated);
    saveState("lsr_findings", updated);
    addToast("Finding Recorded", "Advocate scrutiny observation added.", "success");
  };

  const triggerScrutinyAnalysis = async (caseId: string) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    const caseDocs = getDocumentsByCaseId(resolvedId);

    if (caseDocs.length === 0) {
      addToast("No Deeds Ingested", "Please upload at least one deed PDF before triggering AI scrutiny.", "warning");
      return;
    }

    if (backendOnline) {
      const res = await requestAiScrutiny(resolvedId);
      if (res.success && Array.isArray(res.findings) && res.findings.length > 0) {
        const serverFindings = res.findings;
        const otherFindings = findings.filter((f) => f.caseId !== resolvedId && f.caseId !== caseId);
        const merged = [...serverFindings, ...otherFindings];
        setFindings(merged);
        saveState("lsr_findings", merged);
        updateCaseStatus(resolvedId, "Scrutiny Review");
        addToast("AI Scrutiny Complete", "Real legal scrutiny completed via Gemini & Legal Rule Engine.", "success");
        return;
      } else if (res.error) {
        addToast("Scrutiny Service Error", res.error, "warning");
        return;
      }
    }

    addToast(
      "Backend Authentication Required",
      "AI Title Scrutiny requires active connection to FastAPI with valid chamber credentials.",
      "warning"
    );
  };

  const getQueriesByCaseId = (caseId: string) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    return queries.filter((q) => q.caseId === resolvedId || q.caseId === caseId);
  };

  const addQueryToCase = async (
    caseId: string,
    queryData: { title: string; draftText: string; linkedFindingId?: string; linkedFindingTitle?: string }
  ) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    const count = queries.filter((q) => q.caseId === resolvedId || q.caseId === caseId).length + 1;
    const now = new Date().toISOString();

    if (backendOnline) {
      const res = await createQueryOnBackend(resolvedId, queryData);
      if (res.success && res.data) {
        const updated = [res.data, ...queries];
        setQueries(updated);
        saveState("lsr_queries", updated);
        addToast("Requisition Drafted", `Query ${res.data.queryCode} created and saved to database.`, "success");
        return;
      }
    }

    const newQuery: CaseQuery = {
      id: `qry-${Date.now()}`,
      caseId: resolvedId,
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
    addToast("Requisition Drafted", `Query ${newQuery.queryCode} created from finding.`, "success");
  };

  const updateQueryStatus = async (queryId: string, status: QueryStatus) => {
    const now = new Date().toISOString();
    const updated = queries.map((q) => (q.id === queryId ? { ...q, status, updatedAt: now } : q));
    setQueries(updated);
    saveState("lsr_queries", updated);
    if (backendOnline) {
      await updateQueryOnBackend(queryId, { status }).catch(() => {});
    }
    addToast("Query Status Updated", `Requisition marked as ${status}.`, "info");
  };

  const updateQueryText = async (queryId: string, approvedText: string) => {
    const now = new Date().toISOString();
    const updated = queries.map((q) =>
      q.id === queryId ? { ...q, lawyerApprovedText: approvedText, status: "Approved" as QueryStatus, updatedAt: now } : q
    );
    setQueries(updated);
    saveState("lsr_queries", updated);
    if (backendOnline) {
      await updateQueryOnBackend(queryId, { lawyerApprovedText: approvedText, status: "Approved" }).catch(() => {});
    }
    addToast("Requisition Approved", "Advocate-approved text saved.", "success");
  };

  const deleteQuery = async (queryId: string) => {
    if (backendOnline) {
      await deleteQueryOnBackend(queryId).catch(() => {});
    }
    const updated = queries.filter((q) => q.id !== queryId);
    setQueries(updated);
    saveState("lsr_queries", updated);
    addToast("Query Deleted", "Requisition removed.", "info");
  };

  const getReportByCaseId = (caseId: string): LSRReportData | undefined => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;

    if (reports[resolvedId]) return reports[resolvedId];
    if (reports[caseId]) return reports[caseId];

    const c = targetCase;
    if (!c) return undefined;

    const draft: LSRReportData = {
      caseId: resolvedId,
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

  const updateReportData = async (caseId: string, data: Partial<LSRReportData>) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    const existing = getReportByCaseId(resolvedId);
    if (!existing) return;

    if (existing.isSigned) {
      addToast("Report Locked", "This report is digitally signed. Click 'Amend Report' to make changes.", "warning");
      return;
    }

    const updated = { ...existing, ...data };
    const newReports = { ...reports, [resolvedId]: updated, [caseId]: updated };
    setReports(newReports);
    saveState("lsr_reports", newReports);

    if (backendOnline) {
      const res = await updateReportOnBackend(resolvedId, data);
      if (!res.success && res.error) {
        addToast("Report Save Error", res.error, "warning");
        return;
      }
    }
    addToast("Report Saved", "Legal Scrutiny Report updated in database.", "success");
  };

  const signReport = async (caseId: string) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;
    const existing = getReportByCaseId(resolvedId);
    if (!existing) return;

    if (backendOnline) {
      const res = await signReportOnBackend(resolvedId);
      if (res.success && res.data) {
        const newReports = { ...reports, [resolvedId]: res.data, [caseId]: res.data };
        setReports(newReports);
        saveState("lsr_reports", newReports);
        updateCaseStatus(resolvedId, "Completed");
        addToast("LSR Signed", "Legal Scrutiny Report formally signed and approved by Advocate.", "success");
        return;
      }
    }

    const updated: LSRReportData = {
      ...existing,
      isSigned: true,
      signedAt: new Date().toISOString(),
    };
    const newReports = { ...reports, [resolvedId]: updated, [caseId]: updated };
    setReports(newReports);
    saveState("lsr_reports", newReports);
    updateCaseStatus(resolvedId, "Completed");
    addToast("LSR Signed", "Legal Scrutiny Report signed.", "success");
  };

  const amendReport = async (caseId: string) => {
    const targetCase = getCaseById(caseId);
    const resolvedId = targetCase?.id || caseId;

    if (backendOnline) {
      const res = await amendReportOnBackend(resolvedId);
      if (res.success && res.data) {
        const newReports = { ...reports, [resolvedId]: res.data, [caseId]: res.data };
        setReports(newReports);
        saveState("lsr_reports", newReports);
        updateCaseStatus(resolvedId, "Scrutiny Review");
        addToast("Report Unlocked", "Report unlocked for advocate revision.", "info");
        return;
      }
    }

    const existing = getReportByCaseId(resolvedId);
    if (existing) {
      const updated: LSRReportData = {
        ...existing,
        isSigned: false,
        signedAt: undefined,
      };
      const newReports = { ...reports, [resolvedId]: updated, [caseId]: updated };
      setReports(newReports);
      saveState("lsr_reports", newReports);
      updateCaseStatus(resolvedId, "Scrutiny Review");
      addToast("Report Unlocked", "Report unlocked for revision.", "info");
    }
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
        loadCaseDetails,
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
        deleteQuery,
        getReportByCaseId,
        updateReportData,
        signReport,
        amendReport,
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
