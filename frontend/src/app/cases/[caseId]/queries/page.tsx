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

  const statusBadgeStyle = (status: QueryStatus) => {
    switch (status) {
      case "Draft":
        return "bg-[#F7F9FC] text-[#66758A] border-[#E3E9F2]";
      case "Approved":
        return "bg-[#16805D]/10 text-[#16805D] border-[#16805D]/20 font-bold";
      case "Sent to Bank":
        return "bg-[#EEF4FF] text-[#2457C5] border-[#2457C5]/20 font-bold";
      case "Resolved":
        return "bg-purple-50 text-purple-700 border-purple-200 font-bold";
      case "Waived":
        return "bg-[#F7F9FC] text-[#66758A]/60 border-[#E3E9F2] line-through";
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
              className="p-2.5 rounded-xl border border-[#E3E9F2] bg-white text-[#66758A] hover:text-[#172B4D] hover:bg-[#F7F9FC] transition-colors shadow-xs"
              title="Return to Case Overview"
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
                Bank Legal Queries &amp; Requisitions
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyFormalLetter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E3E9F2] text-[#172B4D] hover:bg-[#F7F9FC] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <IconFileText className="w-4 h-4 text-[#66758A]" />
              <span>Copy Query Notice</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E3E9F2] text-[#172B4D] hover:bg-[#F7F9FC] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <IconPlus className="w-4 h-4 text-[#2457C5]" />
              <span>Add Custom Requisition</span>
            </button>

            <Link
              href={`/cases/${caseId}/report`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-md shadow-[#2457C5]/20 transition-all"
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
        <div className="rounded-xl border border-[#2457C5]/20 bg-[#EEF4FF] p-3.5 text-xs text-[#16325C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <IconShield className="w-4 h-4 text-[#2457C5] flex-shrink-0" />
            <span>
              <strong>Formal Requisitions to Credit / Branch Manager:</strong> Requisitions are drafted from accepted scrutiny discrepancy flags. Approve the wording before delivering to the bank.
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#2457C5] font-bold whitespace-nowrap self-start sm:self-auto">
            {queries.filter((q) => q.status === "Approved" || q.status === "Sent to Bank").length} of {queries.length} Approved
          </span>
        </div>

        {/* Queries List */}
        <div className="space-y-4">
          {queries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E3E9F2] p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#16805D]/10 text-[#16805D] flex items-center justify-center mx-auto">
                <IconCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">No Open Bank Requisitions</h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                No requisitions have been drafted yet. Convert discrepancy flags in the AI Scrutiny workspace or add a custom requisition.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/cases/${caseId}/scrutiny`}
                  className="px-4 py-2 rounded-xl bg-[#16325C] hover:bg-[#112442] text-white text-xs font-semibold transition-colors"
                >
                  Go to Scrutiny Flags
                </Link>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="px-4 py-2 rounded-xl border border-[#E3E9F2] bg-white hover:bg-[#F7F9FC] text-[#172B4D] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Custom Query
                </button>
              </div>
            </div>
          ) : (
            queries.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-5 space-y-4 hover:border-[#2457C5]/40 transition-all"
              >
                {/* Query Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E9F2]/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#2457C5] bg-[#EEF4FF] px-2.5 py-0.5 rounded border border-[#2457C5]/20">
                      {q.queryCode}
                    </span>
                    <h3 className="font-bold text-sm text-[#16325C]">{q.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${statusBadgeStyle(q.status)}`}>
                      {q.status}
                    </span>

                    {/* Status Changer Select */}
                    <select
                      value={q.status}
                      onChange={(e) => updateQueryStatus(q.id, e.target.value as QueryStatus)}
                      className="py-1 px-2.5 rounded-xl border border-[#E3E9F2] text-xs text-[#172B4D] bg-white focus:outline-none focus:ring-1 focus:ring-[#2457C5] cursor-pointer"
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
                  <div className="flex items-center gap-2 text-[11px] text-[#66758A] bg-[#F7F9FC] p-2.5 rounded-xl border border-[#E3E9F2]">
                    <IconShield className="w-3.5 h-3.5 text-[#2457C5] flex-shrink-0" />
                    <span className="font-medium text-[#172B4D] truncate">
                      Linked to Scrutiny Flag: {q.linkedFindingTitle}
                    </span>
                  </div>
                )}

                {/* Requisition Text Body */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#66758A] tracking-wider">
                      Formal Requisition Language
                    </span>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="text-xs font-semibold text-[#2457C5] hover:text-[#1B449E] inline-flex items-center gap-1 cursor-pointer"
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
                        className="w-full p-3 text-xs rounded-xl border border-[#E3E9F2] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingQueryId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-[#66758A] hover:bg-[#F7F9FC]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(q.id)}
                          className="px-4 py-1.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Save &amp; Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2] text-xs text-[#172B4D] leading-relaxed font-serif">
                      {q.lawyerApprovedText || q.draftText}
                    </div>
                  )}
                </div>

                {/* Response / Notes if present */}
                {q.responseNotes && (
                  <div className="p-3 rounded-xl bg-[#16805D]/10 border border-[#16805D]/20 text-[11px] text-[#16805D] space-y-0.5">
                    <strong className="block text-[10px] font-bold text-[#16805D] uppercase tracking-wider">
                      Bank Response / Vendor Compliance:
                    </strong>
                    <p className="text-[#172B4D]">{q.responseNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal: Add Custom Requisition */}
        {showNewModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E3E9F2]">
              <div className="flex items-center justify-between border-b border-[#E3E9F2] pb-3">
                <h3 className="font-bold text-base text-[#16325C]">Draft Bank Requisition</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F7F9FC] text-[#66758A] transition-colors"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateQuery} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Requisition Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production of Original Title Deed"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5]"
                  />
                </div>

                {findings.length > 0 && (
                  <div>
                    <label className="block font-semibold text-[#172B4D] mb-1">
                      Link to Scrutiny Flag <span className="text-[#66758A] font-normal">(Optional)</span>
                    </label>
                    <select
                      value={selectedFindingId}
                      onChange={(e) => setSelectedFindingId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E3E9F2] bg-white text-[#172B4D]"
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
                  <label className="block font-semibold text-[#172B4D] mb-1">Formal Requisition Text</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter formal instructions for the bank manager or borrower..."
                    value={newDraftText}
                    onChange={(e) => setNewDraftText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E3E9F2] focus:outline-none focus:ring-2 focus:ring-[#2457C5]/30 focus:border-[#2457C5] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E3E9F2]">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-xl text-[#66758A] hover:bg-[#F7F9FC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white font-bold cursor-pointer transition-colors"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#66758A]">Loading bank requisitions...</div>}>
      <CaseQueriesContent />
    </Suspense>
  );
}
