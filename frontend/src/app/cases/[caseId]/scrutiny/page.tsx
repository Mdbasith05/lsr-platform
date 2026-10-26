"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { ScrutinyFinding, LawyerDecision, FindingSeverity } from "@/types";
import {
  IconArrowLeft,
  IconArrowRight,
  IconShield,
  IconCheck,
  IconX,
  IconEdit,
  IconFileText,
  IconPlus,
} from "@/components/icons";

function CaseScrutinyContent() {
  const params = useParams();
  const caseId = params.caseId as string;
  const { getCaseById, getFindingsByCaseId, updateFindingDecision, addQueryToCase } = useCases();

  const currentCase = getCaseById(caseId);
  const findings = getFindingsByCaseId(caseId);

  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    findings[0]?.id || ""
  );
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [activeViewerPage, setActiveViewerPage] = useState<number>(1);

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
  };

  const handleDecision = (findingId: string, decision: LawyerDecision) => {
    updateFindingDecision(findingId, decision);
  };

  const handleSaveNote = (findingId: string) => {
    updateFindingDecision(findingId, selectedFinding.lawyerDecision, noteText);
    setEditingNoteId(null);
  };

  const handleCreateQueryFromFinding = (finding: ScrutinyFinding) => {
    addQueryToCase(caseId, {
      title: `Requisition: ${finding.title}`,
      draftText:
        finding.suggestedQueryText ||
        `Please furnish formal clarification regarding ${finding.title}. Referenced in ${finding.sourceDocName} (Page ${finding.pageNumber}).`,
      linkedFindingId: finding.id,
      linkedFindingTitle: finding.title,
    });
  };

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-8 text-center">Case not found.</div>
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

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}`}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#356AE6]">{currentCase.id}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{currentCase.borrowerName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{currentCase.bankName}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#10233F]">
                Split-Screen Evidence &amp; Discrepancy Scrutiny
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}/queries`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Manage Bank Queries</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Legal Authority Callout */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconShield className="w-4 h-4 text-[#356AE6]" />
            <span>
              <strong>Human-in-the-Loop Scrutiny:</strong> AI identifies discrepancies and cites exact page coordinates. Advocate retains sole authority to Accept, Dismiss, or Rephrase findings.
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 hidden md:inline">
            {findings.filter((f) => f.lawyerDecision !== "pending").length} of {findings.length} Reviewed
          </span>
        </div>

        {/* Split-Screen Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[600px]">
          {/* LEFT PANE: Findings List & Advocate Decisioning (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Filter Sub-bar */}
            <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="py-1 px-2 rounded border border-slate-200 bg-white text-slate-700 text-xs"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Observations</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Lawyer Decision:</span>
                <select
                  value={decisionFilter}
                  onChange={(e) => setDecisionFilter(e.target.value)}
                  className="py-1 px-2 rounded border border-slate-200 bg-white text-slate-700 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="accepted">Accepted Flags</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-400">
                Showing {filteredFindings.length} flags
              </span>
            </div>

            {/* Scrollable Findings Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredFindings.map((finding) => {
                const isSelected = selectedFinding?.id === finding.id;
                return (
                  <div
                    key={finding.id}
                    onClick={() => handleSelectFinding(finding)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? "border-[#356AE6] bg-blue-50/20 shadow-sm ring-1 ring-[#356AE6]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {/* Header: Severity, Category, Decision Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${severityBadge(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                        <span className="font-semibold text-xs text-slate-600">
                          {finding.category}
                        </span>
                      </div>

                      {/* Lawyer Decision Badge */}
                      <div>
                        {finding.lawyerDecision === "pending" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Advocate Review
                          </span>
                        )}
                        {finding.lawyerDecision === "accepted" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#16805D] border border-emerald-200">
                            <IconCheck className="w-3 h-3" />
                            <span>Accepted by Lawyer</span>
                          </span>
                        )}
                        {finding.lawyerDecision === "dismissed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <IconX className="w-3 h-3" />
                            <span>Dismissed as Non-Issue</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title and Detailed Description */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{finding.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {finding.description}
                      </p>
                    </div>

                    {/* Evidence Grounding Citation Box */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <IconFileText className="w-3.5 h-3.5 text-[#356AE6]" />
                          <span>{finding.sourceDocName}</span>
                        </span>
                        <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          Page {finding.pageNumber}
                        </span>
                      </div>
                      <blockquote className="border-l-2 border-[#356AE6] pl-2.5 text-[11px] text-slate-800 italic font-serif leading-relaxed">
                        &ldquo;{finding.evidenceSnippet}&rdquo;
                      </blockquote>
                      <div className="text-[10px] text-slate-400 text-right">
                        AI Citation Grounding: {Math.round(finding.aiConfidence * 100)}% Match
                      </div>
                    </div>

                    {/* Lawyer Notes Display */}
                    {finding.lawyerNotes && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 text-[11px] text-emerald-900 space-y-0.5">
                        <strong className="font-semibold block text-[10px] text-emerald-800 uppercase tracking-wider">
                          Advocate Scrutiny Note:
                        </strong>
                        <p className="leading-relaxed">{finding.lawyerNotes}</p>
                      </div>
                    )}

                    {/* Action Bar: Accept, Dismiss, Note, Convert to Query */}
                    <div
                      className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDecision(finding.id, "accepted")}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                            finding.lawyerDecision === "accepted"
                              ? "bg-[#16805D] text-white"
                              : "bg-emerald-50 text-[#16805D] hover:bg-emerald-100"
                          }`}
                        >
                          <IconCheck className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => handleDecision(finding.id, "dismissed")}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
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
                          className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                        >
                          <IconEdit className="w-3.5 h-3.5 text-slate-400" />
                          <span>{finding.lawyerNotes ? "Edit Note" : "Add Note"}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleCreateQueryFromFinding(finding)}
                        className="text-xs font-medium text-[#356AE6] hover:text-[#2655C4] inline-flex items-center gap-1"
                      >
                        <IconPlus className="w-3 h-3" />
                        <span>Draft Bank Query</span>
                      </button>
                    </div>

                    {/* Inline Note Editor */}
                    {editingNoteId === finding.id && (
                      <div
                        className="pt-2 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Record advocate legal observations, local revenue rules, or required indemnity..."
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
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
                            className="px-3 py-1 rounded bg-[#10233F] text-white text-xs font-semibold"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANE: Source Document Viewer & Evidence Highlight (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Viewer Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <IconFileText className="w-4 h-4 text-[#356AE6] flex-shrink-0" />
                <span className="font-semibold text-slate-900 truncate">
                  {selectedFinding ? selectedFinding.sourceDocName : "Source Document Viewer"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                <button
                  onClick={() => setActiveViewerPage(Math.max(1, activeViewerPage - 1))}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[11px]"
                >
                  Prev
                </button>
                <span className="font-mono text-[11px]">
                  Page {activeViewerPage}
                </span>
                <button
                  onClick={() => setActiveViewerPage(activeViewerPage + 1)}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[11px]"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Document Surface Preview */}
            <div className="flex-1 bg-[#F9FAFC] p-4 overflow-y-auto">
              <div className="max-w-md mx-auto bg-white border border-slate-300 shadow-md rounded p-6 font-serif text-[11px] text-slate-800 space-y-4 relative select-text leading-relaxed">
                {/* Simulated Deed Stamp & Heading */}
                <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                  <div className="inline-block px-3 py-1 rounded border-2 border-slate-400 font-sans font-bold text-[9px] uppercase tracking-widest text-slate-600">
                    Government of Karnataka • Department of Registration
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 mt-2">
                    Certified Extract of Registered Conveyance
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Document Ref: {selectedFinding?.sourceDocId || "REG-2016"} • SRO Sub-Registry
                  </p>
                </div>

                {/* Recitals */}
                <p className="text-slate-700 text-justify">
                  THIS ABSOLUTE CONVEYANCE is executed on the schedule date by the Vendor in favor of the Purchaser conveying all marketable rights, titles, hereditaments, and interest over the subject schedule property free from registered encumbrances, attachments, and mortgage lis pendens...
                </p>

                {/* Highlighted Evidence Section */}
                <div className="p-3 bg-amber-50/80 border-2 border-amber-400 rounded relative shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-sans font-bold text-amber-900 uppercase tracking-wider">
                    <span>★ Evidence Snippet Highlighted by AI</span>
                    <span className="bg-amber-200/60 px-1 rounded">Page {activeViewerPage}</span>
                  </div>
                  <p className="text-xs font-serif font-medium text-slate-900 leading-relaxed bg-amber-100/60 px-1.5 py-1 rounded">
                    &ldquo;{selectedFinding ? selectedFinding.evidenceSnippet : "Select a finding on the left to inspect grounded snippet evidence."}&rdquo;
                  </p>
                </div>

                {/* Additional simulated deed clauses */}
                <p className="text-slate-700 text-justify">
                  AND THE VENDOR FURTHER DECLARES that the schedule property is not subject to any prior lis pendens in civil suits, statutory notices under Karnataka Land Revenue Act, or minor coparcenary shares. The purchaser shall quietly possess and enjoy the property with full ingress and egress rights...
                </p>

                <div className="pt-4 border-t border-slate-200 text-right text-[10px] text-slate-400 font-sans">
                  Digitally Indexed by LSR PyMuPDF Engine • Grounded Citation
                </div>
              </div>
            </div>

            {/* Viewer Footer Details */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Status: Grounded with Bounding Box</span>
              <span className="font-mono text-slate-600">Case Ref: {currentCase.id}</span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseScrutinyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading scrutiny review workspace...</div>}>
      <CaseScrutinyContent />
    </Suspense>
  );
}
