"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { useCases } from "@/context/case-context";
import { QueryStatus, CaseQuery } from "@/types";
import {
  IconShield,
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconEdit,
  IconCheckCircle,
  IconX,
  IconFileText,
} from "@/components/icons";

function CaseQueriesContent() {
  const params = useParams();
  const caseId = params.caseId as string;
  const {
    getCaseById,
    getQueriesByCaseId,
    getFindingsByCaseId,
    addQueryToCase,
    updateQueryStatus,
    updateQueryText,
    addToast,
    loadCaseDetails,
  } = useCases();

  React.useEffect(() => {
    if (caseId) {
      loadCaseDetails(caseId);
    }
  }, [caseId, loadCaseDetails]);

  const currentCase = getCaseById(caseId);
  const queries = getQueriesByCaseId(caseId);
  const findings = getFindingsByCaseId(caseId);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDraftText, setNewDraftText] = useState("");
  const [selectedFindingId, setSelectedFindingId] = useState("");

  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleOpenEdit = (q: CaseQuery) => {
    setEditingQueryId(q.id);
    setEditText(q.lawyerApprovedText || q.draftText);
  };

  const handleSaveEdit = (qId: string) => {
    updateQueryText(qId, editText);
    setEditingQueryId(null);
  };

  const handleCreateQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDraftText.trim()) return;

    const linked = findings.find((f) => f.id === selectedFindingId);

    addQueryToCase(caseId, {
      title: newTitle,
      draftText: newDraftText,
      linkedFindingId: linked?.id,
      linkedFindingTitle: linked?.title,
    });

    setNewTitle("");
    setNewDraftText("");
    setSelectedFindingId("");
    setShowNewModal(false);
  };

  const handleCopyFormalLetter = () => {
    if (!currentCase) return;
    const formatted = `LEGAL REQUISITIONS / SCRUTINY QUERIES
Matter Reference: ${currentCase.id} (${currentCase.caseNumber})
Bank / Institution: ${currentCase.bankName} - ${currentCase.branch}
Borrower: ${currentCase.borrowerName}
Property Schedule: ${currentCase.propertyType} situated at ${currentCase.propertyAddress}, Survey No. ${currentCase.surveyNumber}

The following formal requisitions are raised pursuant to preliminary legal scrutiny of submitted title deeds:

${queries
  .map(
    (q, idx) =>
      `${idx + 1}. [${q.queryCode}] ${q.title}
   Requisition: ${q.lawyerApprovedText || q.draftText}
   Status: ${q.status.toUpperCase()}
   ${q.linkedFindingTitle ? `(Referenced to Scrutiny Flag: ${q.linkedFindingTitle})` : ""}`
  )
  .join("\n\n")}

Dated: ${new Date().toLocaleDateString("en-IN")}
Advocate Chamber Scrutiny Section`;

    navigator.clipboard.writeText(formatted);
    addToast("Copied to Clipboard", "Formal bank query notice copied in plain-text format.", "success");
  };

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Case Dossier Not Found</h2>
          <Link
            href="/cases"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] text-white text-xs font-semibold rounded-lg"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>Return to All Matters</span>
          </Link>
        </div>
      </AuthenticatedShell>
    );
  }

  const statusBadgeStyle = (status: QueryStatus) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Approved":
        return "bg-emerald-50 text-[#16805D] border-emerald-200 font-bold";
      case "Sent to Bank":
        return "bg-blue-50 text-[#356AE6] border-blue-200 font-bold";
      case "Resolved":
        return "bg-purple-50 text-purple-700 border-purple-200 font-bold";
      case "Waived":
        return "bg-slate-100 text-slate-400 border-slate-200 line-through";
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}`}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#356AE6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentCase.id}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-slate-700">{currentCase.borrowerName}</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500">{currentCase.bankName}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#10233F] mt-1">
                Bank Legal Queries &amp; Requisitions
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyFormalLetter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
            >
              <IconFileText className="w-4 h-4 text-slate-500" />
              <span>Copy Query Notice</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
            >
              <IconPlus className="w-4 h-4 text-[#356AE6]" />
              <span>Add Custom Requisition</span>
            </button>

            <Link
              href={`/cases/${caseId}/report`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Compile Draft LSR</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 6-Step Guided Workflow Progress */}
        <WorkflowStepper
          caseId={caseId}
          currentStep={5}
          nextAction={{
            label: "Proceed to Step 6: Finalize LSR Report",
            href: `/cases/${caseId}/report`,
          }}
        />

        {/* Guidance Callout */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <IconShield className="w-4 h-4 text-[#356AE6] flex-shrink-0" />
            <span>
              <strong>Formal Requisitions to Credit / Branch Manager:</strong> Requisitions are drafted from accepted scrutiny discrepancy flags. Approve the wording before delivering to the bank.
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 font-bold hidden md:inline">
            {queries.filter((q) => q.status === "Approved" || q.status === "Sent to Bank").length} of {queries.length} Approved
          </span>
        </div>

        {/* Queries List */}
        <div className="space-y-4">
          {queries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <IconCheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Open Bank Requisitions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No requisitions have been drafted yet. Convert discrepancy flags in the AI Scrutiny workspace or add a custom requisition.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href={`/cases/${caseId}/scrutiny`}
                  className="px-4 py-1.5 rounded-lg bg-[#10233F] text-white text-xs font-semibold"
                >
                  Go to Scrutiny Flags
                </Link>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Create Custom Query
                </button>
              </div>
            </div>
          ) : (
            queries.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Query Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#356AE6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {q.queryCode}
                    </span>
                    <h3 className="font-bold text-sm text-[#10233F]">{q.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${statusBadgeStyle(q.status)}`}>
                      {q.status}
                    </span>

                    {/* Status Changer Select */}
                    <select
                      value={q.status}
                      onChange={(e) => updateQueryStatus(q.id, e.target.value as QueryStatus)}
                      className="py-1 px-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved</option>
                      <option value="Sent to Bank">Sent to Bank</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Waived">Waived</option>
                    </select>
                  </div>
                </div>

                {/* Linked Finding Citation Pill */}
                {q.linkedFindingTitle && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <IconShield className="w-3.5 h-3.5 text-[#356AE6] flex-shrink-0" />
                    <span className="font-medium text-slate-700 truncate">
                      Linked to Scrutiny Flag: {q.linkedFindingTitle}
                    </span>
                  </div>
                )}

                {/* Requisition Text Body */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Formal Requisition Language
                    </span>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="text-xs font-semibold text-[#356AE6] hover:text-[#2655C4] inline-flex items-center gap-1"
                    >
                      <IconEdit className="w-3 h-3" />
                      <span>Edit Language</span>
                    </button>
                  </div>

                  {editingQueryId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#356AE6]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingQueryId(null)}
                          className="px-3 py-1 rounded text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(q.id)}
                          className="px-3.5 py-1 rounded-lg bg-[#356AE6] text-white text-xs font-bold"
                        >
                          Save &amp; Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 leading-relaxed font-serif">
                      {q.lawyerApprovedText || q.draftText}
                    </div>
                  )}
                </div>

                {/* Response / Notes if present */}
                {q.responseNotes && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-0.5">
                    <strong className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Bank Response / Vendor Compliance:
                    </strong>
                    <p>{q.responseNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal: Add Custom Requisition */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-[#10233F]">Draft Bank Requisition</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateQuery} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requisition Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production of Original Title Deed"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  />
                </div>

                {findings.length > 0 && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Link to Scrutiny Flag <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={selectedFindingId}
                      onChange={(e) => setSelectedFindingId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    >
                      <option value="">No specific flag (General Bank Requisition)</option>
                      {findings.map((f) => (
                        <option key={f.id} value={f.id}>
                          [{f.severity.toUpperCase()}] {f.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Formal Requisition Text</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter formal instructions for the bank manager or borrower..."
                    value={newDraftText}
                    onChange={(e) => setNewDraftText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 rounded-lg bg-[#356AE6] text-white font-bold"
                  >
                    Create Requisition
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

export default function CaseQueriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading bank requisitions...</div>}>
      <CaseQueriesContent />
    </Suspense>
  );
}
