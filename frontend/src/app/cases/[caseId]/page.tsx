"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { CaseStatus } from "@/types";
import {
  IconFileText,
  IconScale,
  IconArrowRight,
  IconArrowLeft,
} from "@/components/icons";

function CaseDetailContent() {
  const params = useParams();
  const caseId = params.caseId as string;

  const { getCaseById, getDocumentsByCaseId, getFindingsByCaseId, getQueriesByCaseId, updateCaseStatus } = useCases();

  const currentCase = getCaseById(caseId);
  const documents = getDocumentsByCaseId(caseId);
  const findings = getFindingsByCaseId(caseId);
  const queries = getQueriesByCaseId(caseId);

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-12 text-center space-y-4 bg-white rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Case Record Not Found</h2>
          <p className="text-xs text-slate-500">The requested case reference {caseId} does not exist in local state.</p>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] text-white text-xs font-semibold rounded-lg"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cases List</span>
          </Link>
        </div>
      </AuthenticatedShell>
    );
  }

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const acceptedCount = findings.filter((f) => f.lawyerDecision === "accepted").length;
  const pendingCount = findings.filter((f) => f.lawyerDecision === "pending").length;

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        {/* Header with Case Title & Status Pill */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#356AE6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentCase.id}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-500">{currentCase.caseNumber}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#10233F]">
              {currentCase.borrowerName}
              {currentCase.coBorrowerName && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  &amp; {currentCase.coBorrowerName}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>{currentCase.bankName}</span>
              <span>•</span>
              <span>{currentCase.branch}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Case Stage:</span>
              <select
                value={currentCase.status}
                onChange={(e) => updateCaseStatus(currentCase.id, e.target.value as CaseStatus)}
                className="py-1.5 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
              >
                <option value="Intake">Intake</option>
                <option value="Document Processing">Document Processing</option>
                <option value="Scrutiny Review">Scrutiny Review</option>
                <option value="Queries Raised">Queries Raised</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <Link
              href={`/cases/${currentCase.id}/scrutiny`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <IconScale className="w-4 h-4" />
              <span>Launch Scrutiny Review</span>
            </Link>
          </div>
        </div>

        {/* Workflow Stepper Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            href={`/cases/${currentCase.id}/documents`}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#356AE6] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#356AE6] flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <span className="font-semibold text-slate-900 group-hover:text-[#356AE6] block">
                  Documents
                </span>
                <span className="text-[11px] text-slate-500">{documents.length} files ingested</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6]" />
          </Link>

          <Link
            href={`/cases/${currentCase.id}/scrutiny`}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#356AE6] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <span className="font-semibold text-slate-900 group-hover:text-[#356AE6] block">
                  Scrutiny &amp; Flags
                </span>
                <span className="text-[11px] text-slate-500">{findings.length} findings identified</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6]" />
          </Link>

          <Link
            href={`/cases/${currentCase.id}/queries`}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#356AE6] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#356AE6] flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <span className="font-semibold text-slate-900 group-hover:text-[#356AE6] block">
                  Bank Queries
                </span>
                <span className="text-[11px] text-slate-500">{queries.length} queries drafted</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6]" />
          </Link>

          <Link
            href={`/cases/${currentCase.id}/report`}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#356AE6] transition-all flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16805D] flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <span className="font-semibold text-slate-900 group-hover:text-[#356AE6] block">
                  Draft LSR Report
                </span>
                <span className="text-[11px] text-slate-500">Preview &amp; Sign</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6]" />
          </Link>
        </div>

        {/* Detailed Grid: Property Schedule & Findings Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Schedule & Legal Particulars (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Schedule */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
                  Schedule Property Demarcation
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {currentCase.propertyType}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Address:</span>
                  <p className="font-medium text-slate-800 leading-relaxed">
                    {currentCase.propertyAddress}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Survey Number</span>
                    <span className="font-bold font-mono text-slate-800 text-xs">
                      Sy. No. {currentCase.surveyNumber}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Khata / PID No.</span>
                    <span className="font-bold font-mono text-slate-800 text-xs">
                      {currentCase.khataNumber || "Registered"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Sanction Amount</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {currentCase.loanAmount}
                    </span>
                  </div>
                </div>

                {/* Boundaries */}
                <div className="pt-2">
                  <span className="text-slate-400 block text-[11px] mb-1.5 font-semibold">
                    Four Boundaries (as specified in Conveyance Deed):
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <strong className="text-slate-700">North:</strong>{" "}
                      <span className="text-slate-600">{currentCase.boundaries.north}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <strong className="text-slate-700">South:</strong>{" "}
                      <span className="text-slate-600">{currentCase.boundaries.south}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <strong className="text-slate-700">East:</strong>{" "}
                      <span className="text-slate-600">{currentCase.boundaries.east}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <strong className="text-slate-700">West:</strong>{" "}
                      <span className="text-slate-600">{currentCase.boundaries.west}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingested Documents List Preview */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
                  Property Title Documents ({documents.length})
                </h3>
                <Link
                  href={`/cases/${currentCase.id}/documents`}
                  className="text-xs font-semibold text-[#356AE6] hover:underline"
                >
                  Manage &amp; Upload More →
                </Link>
              </div>

              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconFileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 truncate block">
                          {doc.fileName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {doc.docType} • Dated: {doc.docDate} • {doc.pageCount} pages
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-[#16805D] border border-emerald-200 whitespace-nowrap">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scrutiny Status & Queries Sidebar (1 Col) */}
          <div className="space-y-6">
            {/* Scrutiny Flags Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Scrutiny Findings Summary
                </h3>
                <span className="text-xs font-bold text-[#10233F]">{findings.length} Total</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  <span className="text-lg font-bold block">{criticalCount}</span>
                  <span className="text-[10px] font-medium">Critical</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                  <span className="text-lg font-bold block">{warningCount}</span>
                  <span className="text-[10px] font-medium">Warnings</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#16805D]">
                  <span className="text-lg font-bold block">{acceptedCount}</span>
                  <span className="text-[10px] font-medium">Accepted</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Advocate Review Progress:</span>
                  <span className="font-semibold text-slate-900">
                    {findings.length - pendingCount} / {findings.length} decided
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#356AE6] h-full transition-all"
                    style={{
                      width: `${findings.length ? ((findings.length - pendingCount) / findings.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <Link
                href={`/cases/${currentCase.id}/scrutiny`}
                className="w-full py-2 px-3 rounded-lg bg-[#10233F] hover:bg-[#152e52] text-white text-xs font-medium text-center block transition-colors shadow-xs"
              >
                Review Evidence &amp; Flags →
              </Link>
            </div>

            {/* Queries Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Draft Bank Requisitions
                </h3>
                <span className="text-xs font-bold text-[#10233F]">{queries.length}</span>
              </div>

              <div className="space-y-2 text-xs">
                {queries.map((q) => (
                  <div key={q.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#356AE6]">{q.queryCode}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 line-clamp-1">{q.title}</p>
                  </div>
                ))}
              </div>

              <Link
                href={`/cases/${currentCase.id}/queries`}
                className="text-xs text-[#356AE6] hover:underline font-semibold block text-center pt-2"
              >
                Open Bank Query Manager →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading case details...</div>}>
      <CaseDetailContent />
    </Suspense>
  );
}
