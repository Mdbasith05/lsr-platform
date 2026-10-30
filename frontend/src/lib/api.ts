/**
 * API client module for LSR Platform
 * Connects Next.js frontend with Python FastAPI backend services.
 * Automatically attaches Supabase session Bearer tokens to all authenticated requests.
 */

import {
  Case,
  CaseDocument,
  ScrutinyFinding,
  CaseQuery,
  LSRReportData,
  LawyerDecision,
  DocumentType,
  UserProfile,
} from "@/types";
import { getSupabaseAccessToken } from "@/lib/supabase";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface BackendHealth {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface HealthCheckResult {
  online: boolean;
  data?: BackendHealth;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ScrutinyResult {
  success: boolean;
  findings?: ScrutinyFinding[];
  error?: string;
}

/**
 * Builds HTTP headers for API requests, automatically injecting
 * the authenticated Supabase access token in Authorization: Bearer <token>.
 */
async function getAuthHeaders(includeContentType = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = await getSupabaseAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Check backend health status with timeout and graceful error recovery.
 * Unauthenticated endpoint.
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        online: false,
        error: `Backend responded with HTTP status ${res.status}`,
      };
    }

    const data: BackendHealth = await res.json();
    return { online: true, data };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Health check timed out"
          : err.message
        : "Backend unreachable";
    return { online: false, error: message };
  }
}

/**
 * Fetch the authenticated advocate profile from the backend.
 */
export async function fetchMyProfileFromBackend(): Promise<ApiResponse<UserProfile>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch profile (HTTP ${res.status})` };
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        id: data.id,
        name: data.fullName,
        email: data.email || "",
        role: (data.role as UserProfile["role"]) || "Senior Empaneled Advocate",
        barEnrollmentNumber: data.barEnrollmentNumber || "",
        chamberName: data.chamberName || "",
        phone: data.phone || "",
        address: data.chamberAddress || "",
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching profile",
    };
  }
}

/**
 * Update the authenticated advocate profile on the backend.
 */
export async function updateMyProfileOnBackend(
  profileData: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        fullName: profileData.name,
        barEnrollmentNumber: profileData.barEnrollmentNumber,
        chamberName: profileData.chamberName,
        chamberAddress: profileData.address,
        phone: profileData.phone,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Failed to update profile (HTTP ${res.status})` };
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        id: data.id,
        name: data.fullName,
        email: data.email || "",
        role: (data.role as UserProfile["role"]) || "Senior Empaneled Advocate",
        barEnrollmentNumber: data.barEnrollmentNumber || "",
        chamberName: data.chamberName || "",
        phone: data.phone || "",
        address: data.chamberAddress || "",
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error updating profile",
    };
  }
}

/**
 * Fetch all authorized cases for the current advocate from the backend.
 */
export async function fetchCasesFromBackend(): Promise<ApiResponse<Case[]>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch cases (HTTP ${res.status})` };
    }

    const data: Case[] = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching cases",
    };
  }
}

/**
 * Fetch a single case by UUID or case reference number from the backend.
 */
export async function fetchCaseByIdFromBackend(caseId: string): Promise<ApiResponse<Case>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch case (HTTP ${res.status})` };
    }

    const data: Case = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching case",
    };
  }
}

export interface FullCaseDetails {
  case: Case;
  documents: CaseDocument[];
  findings: ScrutinyFinding[];
  queries: CaseQuery[];
  report?: LSRReportData | null;
}

// In-flight request deduplication map to prevent redundant concurrent fetches
const inflightCaseRequests = new Map<string, Promise<ApiResponse<FullCaseDetails>>>();

/**
 * High-performance composite case rehydration:
 * Fetches case summary, documents, findings, queries, and LSR report in a single round-trip.
 * In-flight requests are automatically deduplicated to prevent redundant network traffic.
 */
export async function fetchCaseFullDetailsFromBackend(
  caseId: string
): Promise<ApiResponse<FullCaseDetails>> {
  if (inflightCaseRequests.has(caseId)) {
    return inflightCaseRequests.get(caseId)!;
  }

  const promise = (async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/full`,
        {
          method: "GET",
          headers,
        }
      );

      if (!res.ok) {
        return {
          success: false,
          error: `Failed to fetch complete case details (HTTP ${res.status})`,
        };
      }

      const data = await res.json();
      const rawDocs = data.documents || [];
      const docs: CaseDocument[] = rawDocs.map((d: Record<string, unknown>) => ({
        ...d,
        fileUrl: d.fileUrl ? `${API_BASE_URL}${d.fileUrl}` : undefined,
      }));

      return {
        success: true,
        data: {
          case: data.case,
          documents: docs,
          findings: data.findings || [],
          queries: data.queries || [],
          report: data.report || null,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error fetching full case details",
      };
    } finally {
      inflightCaseRequests.delete(caseId);
    }
  })();

  inflightCaseRequests.set(caseId, promise);
  return promise;
}

/**
 * Create a new scrutiny case on the backend.
 */
export async function createCaseOnBackend(
  caseData: Partial<Case> & { caseNumber?: string }
): Promise<ApiResponse<Case>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases`, {
      method: "POST",
      headers,
      body: JSON.stringify(caseData),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Failed to create case: ${errText || res.statusText}` };
    }

    const data: Case = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error creating case",
    };
  }
}

/**
 * Update case details or stage status on the backend.
 */
export async function updateCaseOnBackend(
  caseId: string,
  updates: Record<string, unknown>
): Promise<ApiResponse<Case>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      return { success: false, error: `Failed to update case (HTTP ${res.status})` };
    }

    const data: Case = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error updating case",
    };
  }
}

/**
 * Delete / archive a case on the backend.
 */
export async function deleteCaseOnBackend(caseId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to delete case (HTTP ${res.status})` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error deleting case",
    };
  }
}

/**
 * Fetch all documents associated with a specific case from the backend.
 */
export async function fetchCaseDocumentsFromBackend(caseId: string): Promise<ApiResponse<CaseDocument[]>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/documents`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch documents (HTTP ${res.status})` };
    }

    const rawDocs = await res.json();
    const docs: CaseDocument[] = rawDocs.map((d: Record<string, unknown>) => ({
      ...d,
      fileUrl: d.fileUrl ? `${API_BASE_URL}${d.fileUrl}` : undefined,
    }));
    return { success: true, data: docs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching documents",
    };
  }
}

/**
 * Upload a deed or ancillary document to the backend storage and processing service.
 */
export async function uploadDocumentToBackend(
  caseId: string,
  file: File,
  docType: DocumentType
): Promise<ApiResponse<CaseDocument>> {
  try {
    const headers = await getAuthHeaders(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    const res = await fetch(
      `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/documents/upload`,
      {
        method: "POST",
        headers,
        body: formData,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Failed to upload document: ${errText || res.statusText}` };
    }

    const data: CaseDocument = await res.json();
    if (data.fileUrl) {
      data.fileUrl = `${API_BASE_URL}${data.fileUrl}`;
    }
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error uploading document",
    };
  }
}

/**
 * Delete a document from the backend.
 */
export async function deleteDocumentOnBackend(docId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/documents/${encodeURIComponent(docId)}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to delete document (HTTP ${res.status})` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error deleting document",
    };
  }
}

/**
 * Trigger AI document analysis and scrutiny rule evaluation on the backend.
 */
export async function requestAiScrutiny(caseId: string): Promise<ScrutinyResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/scrutiny/analyze`,
      {
        method: "POST",
        headers,
      }
    );

    if (!res.ok) {
      return { success: false, error: `AI Scrutiny failed (HTTP ${res.status})` };
    }

    const findings: ScrutinyFinding[] = await res.json();
    return { success: true, findings };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error requesting AI scrutiny",
    };
  }
}

/**
 * Fetch all findings for a given case from the backend.
 */
export async function fetchCaseFindingsFromBackend(caseId: string): Promise<ApiResponse<ScrutinyFinding[]>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/scrutiny/findings`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch findings (HTTP ${res.status})` };
    }

    const findings: ScrutinyFinding[] = await res.json();
    return { success: true, data: findings };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching findings",
    };
  }
}

/**
 * Add a manual/custom scrutiny finding on the backend.
 */
export async function addFindingOnBackend(
  caseId: string,
  findingData: Record<string, unknown>
): Promise<ApiResponse<ScrutinyFinding>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/scrutiny/findings`, {
      method: "POST",
      headers,
      body: JSON.stringify(findingData),
    });

    if (!res.ok) {
      return { success: false, error: `Failed to add finding (HTTP ${res.status})` };
    }

    const data: ScrutinyFinding = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error adding finding",
    };
  }
}

/**
 * Update advocate decision and notes for a specific scrutiny finding.
 */
export async function updateFindingDecisionOnBackend(
  findingId: string,
  decision: LawyerDecision,
  lawyerNotes?: string
): Promise<ApiResponse<ScrutinyFinding>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/scrutiny/findings/${encodeURIComponent(findingId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ decision, notes: lawyerNotes }),
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to update finding (HTTP ${res.status})` };
    }

    const data: ScrutinyFinding = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error updating finding",
    };
  }
}

/**
 * Fetch all bank requisition queries for a case from the backend.
 */
export async function fetchCaseQueriesFromBackend(caseId: string): Promise<ApiResponse<CaseQuery[]>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/queries`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch queries (HTTP ${res.status})` };
    }

    const queries: CaseQuery[] = await res.json();
    return { success: true, data: queries };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching queries",
    };
  }
}

/**
 * Create a new bank requisition query on the backend.
 */
export async function createQueryOnBackend(
  caseId: string,
  queryData: {
    title: string;
    draftText: string;
    linkedFindingId?: string;
    linkedFindingTitle?: string;
  }
): Promise<ApiResponse<CaseQuery>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/queries`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(queryData),
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to create query (HTTP ${res.status})` };
    }

    const data: CaseQuery = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error creating query",
    };
  }
}

/**
 * Update an existing bank requisition query status or lawyer-approved text.
 */
export async function updateQueryOnBackend(
  queryId: string,
  updates: Partial<CaseQuery>
): Promise<ApiResponse<CaseQuery>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/queries/${encodeURIComponent(queryId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to update query (HTTP ${res.status})` };
    }

    const data: CaseQuery = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error updating query",
    };
  }
}

/**
 * Delete a bank requisition query from the backend.
 */
export async function deleteQueryOnBackend(queryId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/queries/${encodeURIComponent(queryId)}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to delete query (HTTP ${res.status})` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error deleting query",
    };
  }
}

/**
 * Fetch the draft or signed Legal Scrutiny Report (LSR) from the backend.
 */
export async function fetchCaseReportFromBackend(caseId: string): Promise<ApiResponse<LSRReportData>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/report`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch report (HTTP ${res.status})` };
    }

    const data: LSRReportData = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error fetching report",
    };
  }
}

/**
 * Update the Draft Legal Scrutiny Report (LSR) data on the backend.
 */
export async function updateReportOnBackend(
  caseId: string,
  data: Partial<LSRReportData>
): Promise<ApiResponse<LSRReportData>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/report`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Failed to update report: ${errText || res.statusText}` };
    }

    const report: LSRReportData = await res.json();
    return { success: true, data: report };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error updating report",
    };
  }
}

/**
 * Formally sign and approve the Legal Scrutiny Report on the backend.
 */
export async function signReportOnBackend(
  caseId: string
): Promise<ApiResponse<LSRReportData>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/report/sign`,
      {
        method: "POST",
        headers,
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to sign report (HTTP ${res.status})` };
    }

    const data: LSRReportData = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error signing report",
    };
  }
}

/**
 * Unlock and amend a previously signed Legal Scrutiny Report on the backend.
 */
export async function amendReportOnBackend(
  caseId: string
): Promise<ApiResponse<LSRReportData>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/report/amend`,
      {
        method: "POST",
        headers,
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to amend report (HTTP ${res.status})` };
    }

    const data: LSRReportData = await res.json();
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error amending report",
    };
  }
}

/**
 * Get authenticated PDF download URL with access token for direct browser downloads.
 */
export async function getReportPdfDownloadUrl(caseId: string): Promise<string> {
  const token = await getSupabaseAccessToken();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_BASE_URL}/api/v1/cases/${encodeURIComponent(caseId)}/report/export-pdf${tokenParam}`;
}
