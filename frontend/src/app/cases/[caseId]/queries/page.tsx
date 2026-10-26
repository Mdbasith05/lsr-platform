"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { QueryStatus, CaseQuery } from "@/types";
import {
  IconShield,
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconCheck,
  IconEdit,
  IconCheckCircle,
  IconX,
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
  } = useCases();

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

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-8 text-center">Case not found.</div>
      </AuthenticatedShell>
    );
  }

  const statusBadgeStyle = (status: QueryStatus) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Approved":
        return "bg-emerald-50 text-[#16805D] border-emerald-200 font-semibold";
      case "Sent to Bank":
        return "bg-blue-50 text-[#356AE6] border-blue-200 font-semibold";
      case "Resolved":
        return "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
      case "Waived":
        return "bg-slate-100 text-slate-400 border-slate-200 line-through";
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
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
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#10233F]">
                Bank Legal Queries &amp; Requisitions
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <IconPlus className="w-4 h-4 text-[#356AE6]" />
              <span>Add Custom Query</span>
            </button>

            <Link
              href={`/cases/${caseId}/report`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Compile Draft LSR Report</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 text-xs text-slate-600 flex items-start gap-3 shadow-xs">
          <IconShield className="w-5 h-5 text-[#356AE6] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900">
              Bank Branch Legal Requisition Workflow:
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Queries drafted here originate from accepted discrepancy findings or advocate statutory checks. Once marked as <strong>Approved by Advocate</strong>, they become part of the formal pre-disbursement requisition schedule submitted to the bank loan officer.
            </p>
          </div>
        </div>

        {/* Queries List */}
        <div className="space-y-4">
          {queries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <IconShield className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800">No Requisitions Raised</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No bank queries currently exist for this matter. You can convert accepted scrutiny findings into queries or add a custom bank requisition.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#10233F] text-white text-xs font-medium"
              >
                Draft First Query
              </button>
            </div>
          ) : (
            queries.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3"
              >
                {/* Header: Code, Title, Status Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#356AE6] border border-blue-200">
                      {q.queryCode}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{q.title}</h3>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400">Status:</span>
                    <select
                      value={q.status}
                      onChange={(e) => updateQueryStatus(q.id, e.target.value as QueryStatus)}
                      className={`text-xs py-1 px-2.5 rounded-full border ${statusBadgeStyle(
                        q.status
                      )} focus:outline-none`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved by Lawyer</option>
                      <option value="Sent to Bank">Sent to Bank</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Waived">Waived</option>
                    </select>
                  </div>
                </div>

                {/* Linked Finding Banner if exists */}
                {q.linkedFindingTitle && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Linked Scrutiny Flag:</span>
                    <span className="text-slate-600">{q.linkedFindingTitle}</span>
                  </div>
                )}

                {/* Query Text Presentation or Inline Editor */}
                {editingQueryId === q.id ? (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Official Requisition Text for Bank:
                    </label>
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6] leading-relaxed font-sans"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingQueryId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(q.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#16805D] text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Save &amp; Approve Text</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-slate-800 leading-relaxed font-sans">
                      {q.lawyerApprovedText || q.draftText}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Drafted: {new Date(q.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="text-[#356AE6] hover:underline font-semibold flex items-center gap-1 text-xs"
                        >
                          <IconEdit className="w-3 h-3" />
                          <span>Edit Query Text</span>
                        </button>
                        {q.status === "Draft" && (
                          <button
                            onClick={() => updateQueryStatus(q.id, "Approved")}
                            className="text-[#16805D] hover:underline font-semibold flex items-center gap-1 text-xs"
                          >
                            <IconCheckCircle className="w-3 h-3" />
                            <span>Mark Approved</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank / Applicant Response Notes */}
                {q.responseNotes && (
                  <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-[11px] text-blue-900 space-y-0.5">
                    <span className="font-semibold block text-[10px] text-blue-800 uppercase tracking-wider">
                      Branch Feedback / Customer Response:
                    </span>
                    <p>{q.responseNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal: Add Custom Query */}
        {showNewModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-[#10233F]">Draft Bank Requisition</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateQuery} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Query Subject / Requisition Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production of Original Title Deed dated 2016"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Link to Scrutiny Flag (Optional)
                  </label>
                  <select
                    value={selectedFindingId}
                    onChange={(e) => setSelectedFindingId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  >
                    <option value="">No linked finding (General Requisition)</option>
                    {findings.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} ({f.severity.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Formal Requisition Instruction for Bank / Applicant
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="State exact documents, certificates, or indemnities required prior to loan disbursal..."
                    value={newDraftText}
                    onChange={(e) => setNewDraftText(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white font-semibold"
                  >
                    Save as Draft Query
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
