"use client";

import React, { useState, Suspense } from "react";
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
  IconCheckCircle,
  IconScale,
} from "@/components/icons";

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

  // Determine active document to show on right pane
  const activeDocument: CaseDocument | undefined =
    (activeDocOverrideId && documents.find((d) => d.id === activeDocOverrideId)) ||
    documents.find((d) => d.id === selectedFinding?.sourceDocId) ||
    documents.find((d) => d.fileName === selectedFinding?.sourceDocName) ||
    documents[0];

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Case Dossier Not Found</h2>
          <Link
            href="/cases"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] text-white text-xs font-bold rounded-xl"
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
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      case "info":
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const reviewedFindingsCount = findings.filter((f) => f.lawyerDecision !== "pending").length;

  return (
    <AuthenticatedShell>
      <div className="space-y-5">
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
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title="Return to Documents"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#1D5BD8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentCase.id}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-700">{currentCase.borrowerName}</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500 font-medium">{currentCase.bankName}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#10233F] mt-0.5">
                AI Scrutiny Workspace &amp; Evidence Grounding
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
            >
              <IconPlus className="w-4 h-4 text-[#1D5BD8]" />
              <span>Log Manual Flag</span>
            </button>

            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10233F] hover:bg-[#1a3860] text-white text-xs font-bold shadow-xs transition-all"
            >
              <IconScale className={`w-4 h-4 text-amber-400 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Cross-Checking Chain..." : "Re-Run AI Scrutiny"}</span>
            </button>

            <Link
              href={`/cases/${caseId}/queries`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D5BD8] hover:bg-[#1547B2] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Manage Bank Queries</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Advocate Supervisory Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <IconShield className="w-4 h-4 text-[#1D5BD8] flex-shrink-0" />
            <span>
              <strong>Grounded Advocate Scrutiny Mode:</strong> Every AI discrepancy flag links to the exact deed page coordinates. Review each item to Accept, Dismiss, or Rephrase into a Bank Requisition.
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 hidden md:inline font-bold">
            {reviewedFindingsCount} of {findings.length} Reviewed
          </span>
        </div>

        {/* =========================================================================
            2. SPLIT-SCREEN WORKSPACE (Left: Findings & Decision | Right: Grounded Viewer)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-230px)] min-h-[660px]">
          {/* LEFT PANE: Discrepancy Findings (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Filter Sub-bar */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Severity:</span>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="py-1 px-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical Only</option>
                    <option value="warning">Warnings</option>
                    <option value="info">Observations</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">Decision:</span>
                  <select
                    value={decisionFilter}
                    onChange={(e) => setDecisionFilter(e.target.value)}
                    className="py-1 px-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="accepted">Accepted Flags</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                {filteredFindings.length} discrepancy flags
              </span>
            </div>

            {/* Scrollable Findings Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFD]">
              {filteredFindings.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                  <IconShield className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {findings.length === 0 ? "No Scrutiny Findings Yet" : "No Discrepancies Match Filter"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {findings.length === 0
                      ? "Upload deeds in the Documents tab and run Title Scrutiny to analyze clauses, boundaries, and encumbrances."
                      : "Either no flags match your current filter, or title devolution appears clear."}
                  </p>
                  <button
                    onClick={handleRunAiAnalysis}
                    className="px-4 py-2 rounded-xl bg-[#1D5BD8] hover:bg-[#1547B2] text-white text-xs font-bold mt-2 shadow-xs"
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
                          ? "border-[#1D5BD8] ring-2 ring-[#1D5BD8]/20 shadow-md"
                          : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Top Row: Category, Severity & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${severityBadge(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {finding.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {finding.lawyerDecision === "accepted" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16805D] border border-emerald-300 flex items-center gap-1">
                              <IconCheck className="w-3 h-3" />
                              <span>Accepted by Advocate</span>
                            </span>
                          )}
                          {finding.lawyerDecision === "dismissed" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Dismissed
                            </span>
                          )}
                          {finding.lawyerDecision === "pending" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Pending Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Finding Title & Plain-English Description */}
                      <div className="space-y-1">
                        <h3 className="text-xs font-extrabold text-[#10233F] leading-snug">
                          {finding.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {finding.description}
                        </p>
                      </div>

                      {/* Grounded Evidence Box */}
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1.5">
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
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 font-sans">
                          <span className="text-[#1D5BD8] font-semibold">
                            {finding.isAiGenerated !== false ? "AI Grounded Title Finding" : "Advocate Document Note"}
                          </span>
                          <span>Confidence: {Math.round(finding.aiConfidence * 100)}%</span>
                        </div>
                      </div>

                      {/* Advocate Note if present */}
                      {finding.lawyerNotes && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-950 space-y-0.5">
                          <strong className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            Advocate Scrutiny Observation:
                          </strong>
                          <p className="leading-relaxed">{finding.lawyerNotes}</p>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div
                        className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDecision(finding.id, "accepted")}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              finding.lawyerDecision === "accepted"
                                ? "bg-[#16805D] text-white shadow-xs"
                                : "bg-emerald-50 text-[#16805D] hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>

                          <button
                            onClick={() => handleDecision(finding.id, "dismissed")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                              finding.lawyerDecision === "dismissed"
                                ? "bg-slate-700 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1"
                          >
                            <IconEdit className="w-3.5 h-3.5 text-slate-400" />
                            <span>{finding.lawyerNotes ? "Edit Note" : "Add Note"}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleCreateQueryFromFinding(finding)}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-[#1D5BD8] hover:bg-blue-50 border border-blue-200 inline-flex items-center gap-1 transition-all"
                        >
                          <IconPlus className="w-3.5 h-3.5" />
                          <span>Draft Bank Query</span>
                        </button>
                      </div>

                      {/* Inline Note Drawer */}
                      {editingNoteId === finding.id && (
                        <div
                          className="pt-2 space-y-2 border-t border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            rows={2}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Record advocate notes regarding local revenue records, boundary survey, or required indemnity..."
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1D5BD8] leading-relaxed"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 rounded text-xs text-slate-500 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(finding.id)}
                              className="px-3.5 py-1 rounded-lg bg-[#10233F] text-white text-xs font-bold"
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
          <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Viewer Navigation Bar */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              {/* Document Selector Dropdown */}
              <div className="flex items-center gap-2 truncate max-w-[240px]">
                <IconFileText className="w-4 h-4 text-[#1D5BD8] flex-shrink-0" />
                <select
                  value={activeDocument?.id || ""}
                  onChange={(e) => {
                    setActiveDocOverrideId(e.target.value);
                    setActiveViewerPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-900 truncate focus:outline-none text-xs cursor-pointer"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fileName}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  onClick={() => setViewerTab("visual")}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    viewerTab === "visual" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Deed View
                </button>
                <button
                  onClick={() => setViewerTab("ocr")}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    viewerTab === "ocr" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  OCR / Recitals
                </button>
              </div>
            </div>

            {/* Page Navigation Sub-header */}
            <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Grounding: Page {activeViewerPage} of {activeDocument?.pageCount || 14}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveViewerPage(Math.max(1, activeViewerPage - 1))}
                  className="px-2.5 py-0.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-medium"
                >
                  Prev
                </button>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  Page {activeViewerPage}
                </span>
                <button
                  onClick={() => setActiveViewerPage(activeViewerPage + 1)}
                  className="px-2.5 py-0.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-medium"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Document Surface Preview */}
            <div className="flex-1 bg-[#F5F7FB] p-4 overflow-y-auto">
              {activeDocument?.fileUrl && viewerTab === "visual" ? (
                /* Real PDF Live Embed */
                <iframe
                  src={`${activeDocument.fileUrl}${session?.access_token && !activeDocument.fileUrl.includes("token=") ? (activeDocument.fileUrl.includes("?") ? "&" : "?") + "token=" + session.access_token : ""}#page=${activeViewerPage}`}
                  className="w-full h-full min-h-[520px] rounded-xl border border-slate-300 shadow-inner bg-white"
                  title="Document Preview"
                />
              ) : viewerTab === "ocr" ? (
                /* OCR / Recitals Plaintext Stream View */
                <div className="bg-white rounded-xl border border-slate-300 p-5 font-mono text-[11px] text-slate-800 space-y-3 leading-relaxed shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      Extracted Text Stream (Page {activeViewerPage})
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      High Density OCR Match
                    </span>
                  </div>

                  <p className="text-slate-700 whitespace-pre-wrap font-sans text-xs">
                    {selectedFinding?.evidenceSnippet ? (
                      <>
                        <span>...and the Vendor further covenants with the Purchaser that the schedule property is free from all encumbrances, attachments, and charges. </span>
                        <mark className="bg-amber-200/90 text-amber-950 font-semibold px-1 rounded">
                          {selectedFinding.evidenceSnippet}
                        </mark>
                        <span> ...subject to verification of revenue patta records and municipal boundary demarcation.</span>
                      </>
                    ) : (
                      "Text extraction completed. Devolution sequence aligns with schedule recitals."
                    )}
                  </p>
                </div>
              ) : (
                /* High Fidelity Registered Deed Preview Sheet */
                <div className="max-w-md mx-auto bg-white border border-slate-300 shadow-md rounded-xl p-6 font-serif text-[11px] text-slate-800 space-y-4 relative select-text leading-relaxed">
                  {/* Government Registry Stamp Header */}
                  <div className="text-center pb-3 border-b border-slate-200 space-y-1 font-sans">
                    <div className="inline-block px-3 py-0.5 rounded border border-slate-400 font-bold text-[9px] uppercase tracking-widest text-slate-700">
                      Government of Karnataka | Department of Registration
                    </div>
                    <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 mt-1">
                      Certified Extract of Registered Conveyance
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Ref: {activeDocument?.registrationNumber || "BNG(U)-BK1-4192/2016"} | {activeDocument?.subRegistrarOffice || "SRO Office"}
                    </p>
                  </div>

                  {/* Recital Opening */}
                  <p className="text-slate-700 text-justify">
                    THIS ABSOLUTE CONVEYANCE is executed on the schedule date by the Vendor Sri M. Venkataswamy in favor of the Purchaser Sri Rajesh Kumar conveying all marketable rights, hereditaments, and interest over the subject schedule property free from registered encumbrances, attachments, and mortgage lis pendens...
                  </p>

                  {/* Grounded Evidence Highlight Box */}
                  <div className="p-3 bg-amber-50/90 border-2 border-amber-400 rounded-lg relative shadow-xs space-y-1 font-sans">
                    <div className="flex items-center justify-between text-[9px] font-bold text-amber-900 uppercase tracking-wider">
                      <span>Highlighted Cited Clause (Page {activeViewerPage})</span>
                      <span className="font-mono">Match: 94%</span>
                    </div>
                    <p className="text-[11px] font-serif text-amber-950 font-bold leading-relaxed">
                      {selectedFinding?.evidenceSnippet ||
                        "Schedule: Bound on East by: Site No. 15, West by: Site No. 12, North by: Site No. 13, South by: 30-Foot Road."}
                    </p>
                  </div>

                  {/* Schedule Description */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-sans text-[10px]">
                    <strong className="block text-slate-700 font-bold uppercase tracking-wider">
                      Schedule Property Particulars:
                    </strong>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <div>Survey No: {currentCase.surveyNumber}</div>
                      <div>Property Type: {currentCase.propertyType}</div>
                      <div>North: {currentCase.boundaries.north}</div>
                      <div>South: {currentCase.boundaries.south}</div>
                    </div>
                  </div>

                  {/* Stamp Seal Simulation */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-[10px] text-slate-400 font-sans">
                    <span>Sub-Registrar Seal Verified</span>
                    <span className="font-mono">Page {activeViewerPage}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Add Manual Finding */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-[#10233F]">Log Advocate Scrutiny Observation</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualFinding} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observation Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unregistered Release Deed Recital"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1D5BD8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Source Document</label>
                    <select
                      value={manualDocId}
                      onChange={(e) => setManualDocId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    >
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fileName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Page Number</label>
                    <input
                      type="number"
                      min={1}
                      value={manualPage}
                      onChange={(e) => setManualPage(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value as FindingCategory)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    >
                      <option value="Chain of Title Break">Chain of Title Break</option>
                      <option value="Missing Mandatory Document">Missing Mandatory Document</option>
                      <option value="Boundary Mismatch">Boundary Mismatch</option>
                      <option value="Encumbrance / Charge">Encumbrance / Charge</option>
                      <option value="Tax / Revenue Default">Tax / Revenue Default</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Severity</label>
                    <select
                      value={manualSeverity}
                      onChange={(e) => setManualSeverity(e.target.value as FindingSeverity)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-semibold"
                    >
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Observation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description &amp; Reasoning</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe legal flaw, missing recital, or revenue mismatch..."
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1D5BD8]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 rounded-lg bg-[#1D5BD8] text-white font-bold"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading AI Scrutiny Workspace...</div>}>
      <CaseScrutinyContent />
    </Suspense>
  );
}
