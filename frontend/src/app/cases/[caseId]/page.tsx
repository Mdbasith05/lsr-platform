"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { CaseStatus } from "@/types";
import {
  IconScale,
  IconArrowRight,
  IconArrowLeft,
  IconAlertTriangle,
  IconX,
} from "@/components/icons";

function CaseDetailContent() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const {
    getCaseById,
    getDocumentsByCaseId,
    getFindingsByCaseId,
    getQueriesByCaseId,
    updateCaseStatus,
    deleteCase,
    loadCaseDetails,
  } = useCases();

  React.useEffect(() => {
    if (caseId) {
      loadCaseDetails(caseId);
    }
  }, [caseId, loadCaseDetails]);

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

  const handleDeleteCase = async () => {
    if (confirm(`Are you sure you want to archive matter ${currentCase.id} (${currentCase.borrowerName})?`)) {
      await deleteCase(currentCase.id);
      router.push("/cases");
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header with Case Title & Stage Selector */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#356AE6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentCase.id}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-xs font-mono text-slate-500">{currentCase.caseNumber}</span>
              <span className="text-slate-400">|</span>
              <span className="text-xs text-slate-500">{currentCase.propertyType}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#10233F]">
              {currentCase.borrowerName}
              {currentCase.coBorrowerName && (
                <span className="text-base font-normal text-slate-500 ml-2">
                  &amp; {currentCase.coBorrowerName}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-slate-700">{currentCase.bankName}</span>
              <span>|</span>
              <span>{currentCase.branch}</span>
              <span>|</span>
              <span className="font-semibold text-emerald-700">{currentCase.loanAmount}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Stage Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Case Stage:</span>
              <select
                value={currentCase.status}
                onChange={(e) => updateCaseStatus(currentCase.id, e.target.value as CaseStatus)}
                className="py-1.5 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#356AE6]"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <IconScale className="w-4 h-4" />
              <span>Launch AI Scrutiny</span>
            </Link>

            <button
              onClick={handleDeleteCase}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
              title="Archive Matter"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Step Case Workflow Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            href={`/cases/${currentCase.id}/documents`}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#356AE6] hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#356AE6] flex items-center justify-center font-extrabold text-sm group-hover:scale-105 transition-transform">
                1
              </div>
              <div>
                <span className="font-bold text-slate-900 group-hover:text-[#356AE6] block text-xs">
                  Upload Deeds
                </span>
                <span className="text-[11px] text-slate-500">{documents.length} files ingested</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href={`/cases/${currentCase.id}/scrutiny`}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#356AE6] hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-sm group-hover:scale-105 transition-transform">
                2
              </div>
              <div>
                <span className="font-bold text-slate-900 group-hover:text-[#356AE6] block text-xs">
                  Evidence Scrutiny
                </span>
                <span className="text-[11px] text-slate-500">{findings.length} discrepancy flags</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href={`/cases/${currentCase.id}/queries`}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#356AE6] hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#356AE6] flex items-center justify-center font-extrabold text-sm group-hover:scale-105 transition-transform">
                3
              </div>
              <div>
                <span className="font-bold text-slate-900 group-hover:text-[#356AE6] block text-xs">
                  Bank Requisitions
                </span>
                <span className="text-[11px] text-slate-500">{queries.length} queries drafted</span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href={`/cases/${currentCase.id}/report`}
            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#356AE6] hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center font-extrabold text-sm group-hover:scale-105 transition-transform">
                4
              </div>
              <div>
                <span className="font-bold text-slate-900 group-hover:text-[#356AE6] block text-xs">
                  Draft LSR Report
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentCase.status === "Completed" ? "Signed & Finalized" : "Ready for Opinion"}
                </span>
              </div>
            </div>
            <IconArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#356AE6] group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Particulars & Discrepancy Overview Split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 2 Cols: Schedule Property Particulars */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#10233F] border-b border-slate-100 pb-2">
              Schedule Property Particulars
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Property Type</span>
                <span className="font-bold text-slate-800">{currentCase.propertyType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Survey / Plot No.</span>
                <span className="font-mono font-bold text-slate-800">{currentCase.surveyNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Khata Assessment</span>
                <span className="font-mono text-slate-800">{currentCase.khataNumber || "Registered"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Assigned Advocate</span>
                <span className="font-bold text-slate-800">{currentCase.assignedLawyer}</span>
              </div>
            </div>

            <div className="text-xs pt-1">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Physical Schedule Address</span>
              <p className="text-slate-700 font-serif leading-relaxed mt-0.5">
                {currentCase.propertyAddress}
              </p>
            </div>

            {/* Boundaries Table */}
            <div className="pt-2">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1.5">
                Schedule Boundaries
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">North</span>
                  <span className="text-slate-800 text-[11px]">{currentCase.boundaries.north}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">South</span>
                  <span className="text-slate-800 text-[11px]">{currentCase.boundaries.south}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">East</span>
                  <span className="text-slate-800 text-[11px]">{currentCase.boundaries.east}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">West</span>
                  <span className="text-slate-800 text-[11px]">{currentCase.boundaries.west}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1 Col: Discrepancy Health & Scrutiny Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-[#10233F] border-b border-slate-100 pb-2">
              Scrutiny Discrepancy Audit
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <IconAlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Critical Title Breaks</span>
                </span>
                <span className="font-mono font-bold text-rose-700">{criticalCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <IconAlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Warnings &amp; Variances</span>
                </span>
                <span className="font-mono font-bold text-amber-700">{warningCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
                <span>Advocate Reviewed</span>
                <span className="font-mono text-slate-900 font-bold">{acceptedCount} of {findings.length}</span>
              </div>

              {pendingCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 font-semibold">
                  <span>Awaiting Advocate Action</span>
                  <span className="font-mono text-blue-700 font-bold">{pendingCount}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href={`/cases/${currentCase.id}/scrutiny`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#10233F] hover:bg-[#1a3860] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <IconScale className="w-4 h-4 text-[#356AE6]" />
                <span>Open Split-Screen Review</span>
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading case dossier...</div>}>
      <CaseDetailContent />
    </Suspense>
  );
}
