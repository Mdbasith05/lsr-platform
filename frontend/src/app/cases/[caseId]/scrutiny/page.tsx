"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";
import { ScrutinyFinding, LawyerDecision, FindingSeverity, CaseDocument, FindingCategory } from "@/types";
import { WorkflowStepper } from "@/components/workflow-stepper";
import {
  IconArrowLeft,
  IconArrowRight,
  IconShield,
  IconCheck,
  IconX,
  IconEdit,
  IconFileText,
  IconPlus,
  IconScale,
  IconExternalLink,
  IconAlertTriangle,
} from "@/components/icons";
import { formatFileUrl, fetchDocumentPagesFromBackend } from "@/lib/api";

function CaseScrutinyContent() {
  const params = useParams();
  const caseId = params.caseId as string;
  const { session } = useAuth();
  const {
    getCaseById,
    getFindingsByCaseId,
    getDocumentsByCaseId,
    updateFindingDecision,
    addQueryToCase,
    addCustomFinding,
    triggerScrutinyAnalysis,
    addToast,
    loadCaseDetails,
  } = useCases();

  React.useEffect(() => {
    if (caseId) {
      loadCaseDetails(caseId);
    }
  }, [caseId, loadCaseDetails]);

  const currentCase = getCaseById(caseId);
  const findings = getFindingsByCaseId(caseId);
  const documents = getDocumentsByCaseId(caseId);

  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    findings[0]?.id || ""
  );
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [activeViewerPage, setActiveViewerPage] = useState<number>(findings[0]?.pageNumber || 1);
  const [viewerTab, setViewerTab] = useState<"visual" | "ocr">("visual");
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual finding form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState<FindingCategory>("Boundary Mismatch");
  const [manualSeverity, setManualSeverity] = useState<FindingSeverity>("warning");
  const [manualDesc, setManualDesc] = useState("");
  const [manualSnippet, setManualSnippet] = useState("");
  const [manualDocId, setManualDocId] = useState(documents[0]?.id || "");
  const [manualPage, setManualPage] = useState(1);

  // Active document selection
  const [activeDocOverrideId, setActiveDocOverrideId] = useState<string | null>(null);

  // Genuine extracted document pages state
  const [documentPages, setDocumentPages] = useState<Record<number, { text: string; ocrApplied: boolean }>>({});
  const [loadingPages, setLoadingPages] = useState(false);

  // Authenticated PDF blob stream
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const selectedFinding =
    findings.find((f) => f.id === selectedFindingId) || findings[0];

  const filteredFindings = findings.filter((f) => {
    const matchSev = severityFilter === "all" || f.severity === severityFilter;
    const matchDec = decisionFilter === "all" || f.lawyerDecision === decisionFilter;
    return matchSev && matchDec;
  });

  const handleSelectFinding = (finding: ScrutinyFinding) => {
    setSelectedFindingId(finding.id);
    setActiveViewerPage(finding.pageNumber || 1);
    setActiveDocOverrideId(null);
  };

  const handleDecision = (findingId: string, decision: LawyerDecision) => {
    updateFindingDecision(findingId, decision);
  };

  const handleSaveNote = (findingId: string) => {
    if (!selectedFinding) return;
    updateFindingDecision(findingId, selectedFinding.lawyerDecision, noteText);
    setEditingNoteId(null);
  };

  const handleCreateQueryFromFinding = (finding: ScrutinyFinding) => {
    addQueryToCase(caseId, {
      title: `Requisition: ${finding.title}`,
      draftText:
        finding.suggestedQueryText ||
        `Please furnish formal clarification and certified documentary proof regarding ${finding.title}. Referenced in ${finding.sourceDocName} (Page ${finding.pageNumber}).`,
      linkedFindingId: finding.id,
      linkedFindingTitle: finding.title,
    });
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    addToast("Scrutiny Engine Started", "Extracting clauses and verifying 30-year chain...", "info");
    await new Promise((r) => setTimeout(r, 1200));
    await triggerScrutinyAnalysis(caseId);
    setAnalyzing(false);
    if (findings.length > 0) {
      setSelectedFindingId(findings[0].id);
      setActiveViewerPage(findings[0].pageNumber || 1);
    }
  };

  const handleSaveManualFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualDesc.trim()) return;

    const sourceDoc = documents.find((d) => d.id === manualDocId) || documents[0];

    addCustomFinding(caseId, {
      title: manualTitle,
      category: manualCategory,
      severity: manualSeverity,
      description: manualDesc,
      sourceDocId: sourceDoc?.id || "doc-manual",
      sourceDocName: sourceDoc?.fileName || "Advocate_Inspection.pdf",
      pageNumber: Number(manualPage) || 1,
      evidenceSnippet: manualSnippet || manualDesc,
      aiConfidence: 1.0,
      lawyerDecision: "accepted",
      lawyerNotes: "Manually recorded by Empaneled Advocate.",
      suggestedQueryText: `Advocate Requisition: Clarification requested regarding ${manualTitle}.`,
      isAiGenerated: false,
    });

    setManualTitle("");
    setManualDesc("");
    setManualSnippet("");
    setShowAddModal(false);
  };

  // Determine active document to show on viewer pane
  const activeDocument: CaseDocument | undefined =
    (activeDocOverrideId && documents.find((d) => d.id === activeDocOverrideId)) ||
    documents.find((d) => d.id === selectedFinding?.sourceDocId) ||
    documents.find((d) => d.fileName === selectedFinding?.sourceDocName) ||
    documents[0];

  // Fetch full page OCR/vector extractions for active document
  useEffect(() => {
    if (!activeDocument?.id) {
      setDocumentPages({});
      return;
    }

    const initialMap: Record<number, { text: string; ocrApplied: boolean }> = {};
    if (activeDocument.sampleSnippets) {
      for (const s of activeDocument.sampleSnippets) {
        initialMap[s.page] = { text: s.text, ocrApplied: false };
      }
    }
    setDocumentPages(initialMap);

    let isMounted = true;
    setLoadingPages(true);
    fetchDocumentPagesFromBackend(activeDocument.id)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          const fullMap: Record<number, { text: string; ocrApplied: boolean }> = {};
          for (const p of res.data) {
            fullMap[p.pageNumber] = { text: p.rawText, ocrApplied: p.ocrApplied };
          }
          setDocumentPages(fullMap);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeDocument?.id]);

  // Load authenticated PDF blob stream
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function loadPdfBlob() {
      if (!activeDocument?.fileUrl) {
        setPdfBlobUrl(null);
        setPdfLoading(false);
        setPdfError(null);
        return;
      }
      setPdfLoading(true);
      setPdfError(null);

      try {
        const cleanUrl = formatFileUrl(activeDocument.fileUrl) || activeDocument.fileUrl;
        const authUrl =
          cleanUrl +
          (session?.access_token && !cleanUrl.includes("token=")
            ? (cleanUrl.includes("?") ? "&" : "?") + "token=" + session.access_token
            : "");

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(authUrl, { headers });
        if (!res.ok) {
          throw new Error(`Failed to load document stream (HTTP ${res.status})`);
        }

        const blob = await res.blob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(objectUrl);
          setPdfLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setPdfError(err instanceof Error ? err.message : "Failed to stream document content");
          setPdfLoading(false);
        }
      }
    }

    loadPdfBlob();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [activeDocument?.id, activeDocument?.fileUrl, session?.access_token]);

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E3E9F2]">
          <h2 className="text-lg font-bold text-[#172B4D]">Case Dossier Not Found</h2>
          <p className="text-xs text-[#66758A] mt-1">Reference {caseId} does not exist in local workspace.</p>
          <Link
            href="/cases"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#16325C] text-white text-xs font-bold rounded-xl hover:bg-[#112442] transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>Return to All Matters</span>
          </Link>
        </div>
      </AuthenticatedShell>
    );
  }

  const severityBadge = (sev: FindingSeverity) => {
    switch (sev) {
      case "critical":
        return "bg-[#C03945]/10 text-[#C03945] border-[#C03945]/20 font-bold";
      case "warning":
        return "bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/20 font-semibold";
      case "info":
        return "bg-[#F7F9FC] text-[#4774A8] border-[#E3E9F2] font-medium";
    }
  };

  const reviewedFindingsCount = findings.filter((f) => f.lawyerDecision !== "pending").length;

  return (
    <AuthenticatedShell>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* =========================================================================
            1. GUIDED WORKFLOW STEPPER (Step 4 & 5 Focus)
           ========================================================================= */}
        <WorkflowStepper
          currentStep={4}
          caseId={caseId}
          nextAction={{
            label: "Proceed to Step 5: Bank Requisitions",
            href: `/cases/${caseId}/queries`,
          }}
        />

        {/* Case Meta Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}/documents`}
              className="p-2.5 rounded-xl border border-[#E3E9F2] bg-white text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC] transition-colors shadow-xs"
              title="Return to Documents"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#2457C5] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#2457C5]/20">
                  {currentCase.id}
                </span>
                <span className="text-[#E3E9F2]">|</span>
                <span className="text-xs font-bold text-[#172B4D]">{currentCase.borrowerName}</span>
                <span className="text-[#E3E9F2]">|</span>
                <span className="text-xs text-[#66758A] font-medium">{currentCase.bankName}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#16325C] mt-1">
                AI Scrutiny Workspace &amp; Evidence Grounding
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E3E9F2] text-[#172B4D] hover:bg-[#F7F9FC] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <IconPlus className="w-4 h-4 text-[#2457C5]" />
              <span>Log Manual Flag</span>
            </button>

            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16325C] hover:bg-[#112442] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <IconScale className={`w-4 h-4 text-[#B7791F] ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Cross-Checking Chain..." : "Re-Run AI Scrutiny"}</span>
            </button>

            <Link
              href={`/cases/${caseId}/queries`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-md shadow-[#2457C5]/20 transition-all"
            >
              <span>Manage Bank Queries</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Advocate Supervisory Banner */}
        <div className="rounded-xl border border-[#2457C5]/20 bg-[#EEF4FF] p-3.5 text-xs text-[#16325C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <IconShield className="w-4 h-4 text-[#2457C5] flex-shrink-0" />
            <span>
              <strong>Grounded Advocate Scrutiny Mode:</strong> Every AI discrepancy flag links to the exact deed page coordinates. Review each item to Accept, Dismiss, or Rephrase into a Bank Requisition.
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#2457C5] font-bold whitespace-nowrap self-start sm:self-auto">
            {reviewedFindingsCount} of {findings.length} Reviewed
          </span>
        </div>

        {/* =========================================================================
            2. SPLIT-SCREEN WORKSPACE (Left: Findings & Decision | Right: Grounded Viewer)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[660px] lg:h-[calc(100vh-230px)]">
          {/* LEFT PANE: Discrepancy Findings (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
            {/* Filter Sub-bar */}
            <div className="p-3 border-b border-[#E3E9F2] bg-[#F7F9FC] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#66758A]">Severity:</span>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="py-1 px-2.5 rounded-xl border border-[#E3E9F2] bg-white text-[#172B4D] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical Only</option>
                    <option value="warning">Warnings</option>
                    <option value="info">Observations</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#66758A]">Decision:</span>
                  <select
                    value={decisionFilter}
                    onChange={(e) => setDecisionFilter(e.target.value)}
                    className="py-1 px-2.5 rounded-xl border border-[#E3E9F2] bg-white text-[#172B4D] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="accepted">Accepted Flags</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              <span className="text-[11px] text-[#66758A] font-medium">
                {filteredFindings.length} discrepancy flags
              </span>
            </div>

            {/* Scrollable Findings Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F9FC]">
              {filteredFindings.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-[#E3E9F2]">
                  <IconShield className="w-8 h-8 text-[#66758A]/50 mx-auto" />
                  <h3 className="text-sm font-bold text-[#172B4D]">
                    {findings.length === 0 ? "No Scrutiny Findings Yet" : "No Discrepancies Match Filter"}
                  </h3>
                  <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                    {findings.length === 0
                      ? "Upload deeds in the Documents tab and run Title Scrutiny to analyze clauses, boundaries, and encumbrances."
                      : "Either no flags match your current filter, or title devolution appears clear."}
                  </p>
                  <button
                    onClick={handleRunAiAnalysis}
                    className="px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold mt-2 shadow-xs cursor-pointer"
                  >
                    Run Title Scrutiny
                  </button>
                </div>
              ) : (
                filteredFindings.map((finding) => {
                  const isSelected = selectedFinding?.id === finding.id;

                  return (
                    <div
                      key={finding.id}
                      onClick={() => handleSelectFinding(finding)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative bg-white ${
                        isSelected
                          ? "border-[#2457C5] ring-2 ring-[#2457C5]/20 shadow-md"
                          : "border-[#E3E9F2] hover:border-[#2457C5]/40 hover:shadow-xs"
                      }`}
                    >
                      {/* Top Row: Category, Severity & Status Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${severityBadge(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-xs font-bold text-[#172B4D]">
                            {finding.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {finding.lawyerDecision === "accepted" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16805D]/10 text-[#16805D] border border-[#16805D]/20 flex items-center gap-1">
                              <IconCheck className="w-3 h-3" />
                              <span>Accepted by Advocate</span>
                            </span>
                          )}
                          {finding.lawyerDecision === "dismissed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F9FC] text-[#66758A] border border-[#E3E9F2]">
                              Dismissed
                            </span>
                          )}
                          {finding.lawyerDecision === "pending" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#B7791F]/10 text-[#B7791F] border border-[#B7791F]/20">
                              Pending Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Finding Title & Plain-English Description */}
                      <div className="space-y-1">
                        <h3 className="text-xs font-extrabold text-[#16325C] leading-snug">
                          {finding.title}
                        </h3>
                        <p className="text-xs text-[#66758A] leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      {/* Grounded Evidence Box */}
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                          <span className="flex items-center gap-1">
                            <IconFileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>Cited in: {finding.sourceDocName}</span>
                          </span>
                          <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                            Page {finding.pageNumber}
                          </span>
                        </div>
                        <blockquote className="text-[11px] text-amber-950 font-serif italic border-l-2 border-amber-400 pl-2 leading-relaxed">
                          &ldquo;{finding.evidenceSnippet}&rdquo;
                        </blockquote>
                        <div className="text-[10px] text-[#66758A] flex items-center justify-between pt-1 font-sans">
                          <span className="text-[#2457C5] font-semibold">
                            {finding.isAiGenerated !== false ? "AI Grounded Title Finding" : "Advocate Document Note"}
                          </span>
                          <span>Confidence: {Math.round(finding.aiConfidence * 100)}%</span>
                        </div>
                      </div>

                      {/* Advocate Note if present */}
                      {finding.lawyerNotes && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 space-y-0.5">
                          <strong className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            Advocate Scrutiny Observation:
                          </strong>
                          <p className="leading-relaxed">{finding.lawyerNotes}</p>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div
                        className="pt-2 border-t border-[#E3E9F2]/60 flex flex-wrap items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDecision(finding.id, "accepted")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              finding.lawyerDecision === "accepted"
                                ? "bg-[#16805D] text-white shadow-xs"
                                : "bg-[#16805D]/10 text-[#16805D] hover:bg-[#16805D]/20 border border-[#16805D]/20"
                            }`}
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>

                          <button
                            onClick={() => handleDecision(finding.id, "dismissed")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              finding.lawyerDecision === "dismissed"
                                ? "bg-[#16325C] text-white"
                                : "bg-[#F7F9FC] text-[#66758A] hover:bg-[#E3E9F2] border border-[#E3E9F2]"
                            }`}
                          >
                            <IconX className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingNoteId(finding.id);
                              setNoteText(finding.lawyerNotes || "");
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#172B4D] hover:bg-[#F7F9FC] border border-[#E3E9F2] flex items-center gap-1 cursor-pointer"
                          >
                            <IconEdit className="w-3.5 h-3.5 text-[#66758A]" />
                            <span>{finding.lawyerNotes ? "Edit Note" : "Add Note"}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleCreateQueryFromFinding(finding)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-[#2457C5] hover:bg-[#EEF4FF] border border-[#2457C5]/30 inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <IconPlus className="w-3.5 h-3.5" />
                          <span>Draft Bank Query</span>
                        </button>
                      </div>

                      {/* Inline Note Drawer */}
                      {editingNoteId === finding.id && (
                        <div
                          className="pt-2 space-y-2 border-t border-[#E3E9F2]/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            rows={2}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Record advocate notes regarding local revenue records, boundary survey, or required indemnity..."
                            className="w-full p-2.5 text-xs rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5] leading-relaxed"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs text-[#66758A] hover:bg-[#F7F9FC]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(finding.id)}
                              className="px-3.5 py-1 rounded-lg bg-[#16325C] text-white text-xs font-bold hover:bg-[#112442]"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Grounded Document Viewer (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
            {/* Viewer Navigation Bar */}
            <div className="p-3 border-b border-[#E3E9F2] bg-[#F7F9FC] flex items-center justify-between text-xs">
              {/* Document Selector Dropdown */}
              <div className="flex items-center gap-2 truncate max-w-[200px]">
                <IconFileText className="w-4 h-4 text-[#2457C5] flex-shrink-0" />
                <select
                  value={activeDocument?.id || ""}
                  onChange={(e) => {
                    setActiveDocOverrideId(e.target.value);
                    setActiveViewerPage(1);
                  }}
                  className="bg-transparent font-bold text-[#16325C] truncate focus:outline-none text-xs cursor-pointer"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fileName}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Switcher Tabs & Pop Out External Link */}
              <div className="flex items-center gap-2">
                {activeDocument?.fileUrl && (
                  <a
                    href={
                      formatFileUrl(activeDocument.fileUrl) +
                      (session?.access_token && !activeDocument.fileUrl.includes("token=")
                        ? (activeDocument.fileUrl.includes("?") ? "&" : "?") + "token=" + session.access_token
                        : "")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-[#E3E9F2] bg-white text-[#66758A] hover:text-[#16325C] hover:bg-[#F7F9FC] text-[11px] font-medium flex items-center gap-1 transition-colors"
                    title="Open original document in new tab"
                  >
                    <IconExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pop Out</span>
                  </a>
                )}
                <div className="flex items-center gap-1 bg-[#E3E9F2]/70 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    onClick={() => setViewerTab("visual")}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      viewerTab === "visual"
                        ? "bg-white text-[#16325C] shadow-xs font-bold"
                        : "text-[#66758A] hover:text-[#172B4D]"
                    }`}
                  >
                    Deed View
                  </button>
                  <button
                    onClick={() => setViewerTab("ocr")}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      viewerTab === "ocr"
                        ? "bg-white text-[#16325C] shadow-xs font-bold"
                        : "text-[#66758A] hover:text-[#172B4D]"
                    }`}
                  >
                    OCR / Recitals
                  </button>
                </div>
              </div>
            </div>

            {/* Page Navigation Sub-header */}
            <div className="px-4 py-2 border-b border-[#E3E9F2]/60 bg-white flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#66758A]">
                Grounding: Page {activeViewerPage} of {activeDocument?.pageCount || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveViewerPage(Math.max(1, activeViewerPage - 1))}
                  disabled={activeViewerPage <= 1}
                  className="px-2.5 py-0.5 rounded-lg border border-[#E3E9F2] hover:bg-[#F7F9FC] disabled:opacity-40 text-[11px] font-medium text-[#172B4D] cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="font-mono text-[11px] font-bold text-[#16325C]">
                  Page {activeViewerPage}
                </span>
                <button
                  onClick={() => setActiveViewerPage(Math.min((activeDocument?.pageCount || 100), activeViewerPage + 1))}
                  disabled={activeDocument?.pageCount ? activeViewerPage >= activeDocument.pageCount : false}
                  className="px-2.5 py-0.5 rounded-lg border border-[#E3E9F2] hover:bg-[#F7F9FC] disabled:opacity-40 text-[11px] font-medium text-[#172B4D] cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Document Surface Preview */}
            <div className="flex-1 bg-[#F7F9FC] p-4 overflow-y-auto min-h-[520px]">
              {viewerTab === "visual" ? (
                /* Real PDF Live Embed with Authenticated Stream */
                pdfLoading ? (
                  <div className="h-full min-h-[480px] flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-[#E3E9F2]">
                    <div className="w-7 h-7 border-2 border-[#2457C5] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-[#66758A]">Loading authenticated document stream...</p>
                  </div>
                ) : pdfBlobUrl ? (
                  <iframe
                    src={`${pdfBlobUrl}#page=${activeViewerPage}`}
                    className="w-full h-full min-h-[520px] rounded-xl border border-[#E3E9F2] shadow-inner bg-white"
                    title={activeDocument?.fileName || "Document Preview"}
                  />
                ) : pdfError ? (
                  <div className="h-full min-h-[480px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-rose-200 space-y-3">
                    <IconAlertTriangle className="w-8 h-8 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-sm text-[#16325C]">Document Stream Unavailable</h4>
                      <p className="text-xs text-[#66758A] mt-1">{pdfError}</p>
                    </div>
                    {activeDocument?.fileUrl && (
                      <a
                        href={formatFileUrl(activeDocument.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-[#2457C5] text-white text-xs font-semibold hover:bg-[#1B449C] transition-colors"
                      >
                        Download / View Document
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[480px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-[#E3E9F2] space-y-2">
                    <IconFileText className="w-8 h-8 text-[#66758A]/50" />
                    <p className="text-xs text-[#66758A]">No document file uploaded for this record.</p>
                  </div>
                )
              ) : (
                /* OCR / Recitals Plaintext Stream View (100% Genuine Document Text) */
                <div className="bg-white rounded-xl border border-[#E3E9F2] p-5 font-mono text-[11px] text-[#172B4D] space-y-3 leading-relaxed shadow-xs min-h-[460px]">
                  <div className="flex items-center justify-between border-b border-[#E3E9F2] pb-2">
                    <span className="font-bold text-[#16325C] uppercase tracking-wider text-[10px]">
                      Extracted Text Stream (Page {activeViewerPage} of {activeDocument?.pageCount || 1})
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      documentPages[activeViewerPage]?.ocrApplied
                        ? "text-[#16805D] bg-[#16805D]/10 border-[#16805D]/20"
                        : "text-[#2457C5] bg-[#2457C5]/10 border-[#2457C5]/20"
                    }`}>
                      {documentPages[activeViewerPage]?.ocrApplied ? "RapidOCR Stream" : "Vector Text Stream"}
                    </span>
                  </div>

                  {(() => {
                    const pageData = documentPages[activeViewerPage];
                    const rawText = pageData?.text || "";
                    const snippet = selectedFinding?.evidenceSnippet?.trim();

                    if (!rawText) {
                      return (
                        <div className="py-12 text-center text-[#66758A] space-y-2">
                          <p className="font-sans text-xs">
                            {loadingPages ? "Extracting document pages..." : `No text detected on Page ${activeViewerPage} of ${activeDocument?.fileName || "document"}.`}
                          </p>
                          <p className="font-sans text-[11px] text-[#66758A]">
                            High-density scanned deeds without embedded fonts are processed via RapidOCR.
                          </p>
                        </div>
                      );
                    }

                    if (snippet && rawText.toLowerCase().includes(snippet.toLowerCase())) {
                      const idx = rawText.toLowerCase().indexOf(snippet.toLowerCase());
                      const before = rawText.slice(0, idx);
                      const match = rawText.slice(idx, idx + snippet.length);
                      const after = rawText.slice(idx + snippet.length);

                      return (
                        <div className="text-[#172B4D] whitespace-pre-wrap font-sans text-xs leading-relaxed select-text">
                          <span>{before}</span>
                          <mark className="bg-amber-200/90 text-amber-950 font-semibold px-1 rounded border border-amber-300">
                            {match}
                          </mark>
                          <span>{after}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="text-[#172B4D] whitespace-pre-wrap font-sans text-xs leading-relaxed select-text">
                        {rawText}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Add Manual Finding */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E3E9F2]">
              <div className="flex items-center justify-between border-b border-[#E3E9F2] pb-3">
                <h3 className="font-bold text-base text-[#16325C]">Log Advocate Scrutiny Observation</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F7F9FC] text-[#66758A] transition-colors"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualFinding} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Observation Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unregistered Release Deed Recital"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Source Document</label>
                    <select
                      value={manualDocId}
                      onChange={(e) => setManualDocId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-[#E3E9F2] text-xs bg-white text-[#172B4D]"
                    >
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fileName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Page Number</label>
                    <input
                      type="number"
                      min={1}
                      value={manualPage}
                      onChange={(e) => setManualPage(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-[#E3E9F2] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value as FindingCategory)}
                      className="w-full p-2 rounded-xl border border-[#E3E9F2] text-xs bg-white text-[#172B4D]"
                    >
                      <option value="Chain of Title Break">Chain of Title Break</option>
                      <option value="Missing Mandatory Document">Missing Mandatory Document</option>
                      <option value="Boundary Mismatch">Boundary Mismatch</option>
                      <option value="Encumbrance / Charge">Encumbrance / Charge</option>
                      <option value="Tax / Revenue Default">Tax / Revenue Default</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">Severity</label>
                    <select
                      value={manualSeverity}
                      onChange={(e) => setManualSeverity(e.target.value as FindingSeverity)}
                      className="w-full p-2 rounded-xl border border-[#E3E9F2] font-semibold text-xs bg-white text-[#172B4D]"
                    >
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Observation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Description &amp; Reasoning</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe legal flaw, missing recital, or revenue mismatch..."
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3E9F2]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-[#66758A] hover:bg-[#F7F9FC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white font-bold cursor-pointer transition-colors"
                  >
                    Save Finding
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseScrutinyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#66758A]">Loading AI Scrutiny Workspace...</div>}>
      <CaseScrutinyContent />
    </Suspense>
  );
}
