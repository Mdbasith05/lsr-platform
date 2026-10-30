"use client";

import React, { useState, Suspense } from "react";
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
  IconCheckCircle,
  IconFileText,
  IconUploadCloud,
  IconShield,
  IconClock,
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

  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "scrutiny" | "queries" | "report" | "activity">("overview");

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
        <div className="p-12 text-center space-y-4 bg-white rounded-2xl border border-[#E3E9F2]">
          <h2 className="text-base font-bold text-[#172B4D]">Case Record Not Found</h2>
          <p className="text-xs text-[#66758A]">The requested matter reference {caseId} does not exist in local state.</p>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2457C5] text-white text-xs font-semibold rounded-xl"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            <span>Return to All Matters</span>
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#2457C5] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#2457C5]/20">
                {currentCase.id}
              </span>
              <span className="text-[#CBD5E1]">&bull;</span>
              <span className="text-xs font-mono text-[#66758A]">{currentCase.caseNumber}</span>
              <span className="text-[#CBD5E1]">&bull;</span>
              <span className="text-xs text-[#66758A]">{currentCase.propertyType}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              {currentCase.borrowerName}
              {currentCase.coBorrowerName && (
                <span className="text-base font-normal text-[#66758A] ml-2">
                  &amp; {currentCase.coBorrowerName}
                </span>
              )}
            </h1>
            <p className="text-xs text-[#66758A] flex items-center gap-2">
              <span className="font-semibold text-[#172B4D]">{currentCase.bankName}</span>
              <span>&bull;</span>
              <span>{currentCase.branch}</span>
              <span>&bull;</span>
              <span className="font-bold text-[#16805D]">{currentCase.loanAmount}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Stage Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#66758A]">Stage:</span>
              <select
                value={currentCase.status}
                onChange={(e) => updateCaseStatus(currentCase.id, e.target.value as CaseStatus)}
                className="py-1.5 px-3 text-xs font-bold rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] text-[#172B4D] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all"
            >
              <IconScale className="w-4 h-4" />
              <span>Launch AI Scrutiny</span>
            </Link>

            <button
              onClick={handleDeleteCase}
              className="p-2 rounded-xl border border-[#E3E9F2] text-[#66758A] hover:text-[#C03945] hover:border-rose-300 transition-colors"
              title="Archive Matter"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Organized Navigation Tabs */}
        <div className="flex border-b border-[#E3E9F2] text-xs font-semibold space-x-2 sm:space-x-6 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-2 flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#2457C5] text-[#2457C5] font-bold"
                : "border-transparent text-[#66758A] hover:text-[#172B4D]"
            }`}
          >
            <IconFileText className="w-4 h-4" />
            <span>1. Overview</span>
          </button>
          <Link
            href={`/cases/${currentCase.id}/documents`}
            className="pb-3 px-2 flex items-center gap-1.5 border-b-2 border-transparent text-[#66758A] hover:text-[#2457C5] transition-colors whitespace-nowrap"
          >
            <IconUploadCloud className="w-4 h-4" />
            <span>2. Documents ({documents.length})</span>
          </Link>
          <Link
            href={`/cases/${currentCase.id}/scrutiny`}
            className="pb-3 px-2 flex items-center gap-1.5 border-b-2 border-transparent text-[#66758A] hover:text-[#2457C5] transition-colors whitespace-nowrap"
          >
            <IconScale className="w-4 h-4" />
            <span>3. AI Scrutiny ({findings.length})</span>
          </Link>
          <Link
            href={`/cases/${currentCase.id}/queries`}
            className="pb-3 px-2 flex items-center gap-1.5 border-b-2 border-transparent text-[#66758A] hover:text-[#2457C5] transition-colors whitespace-nowrap"
          >
            <IconShield className="w-4 h-4" />
            <span>4. Bank Queries ({queries.length})</span>
          </Link>
          <Link
            href={`/cases/${currentCase.id}/report`}
            className="pb-3 px-2 flex items-center gap-1.5 border-b-2 border-transparent text-[#66758A] hover:text-[#2457C5] transition-colors whitespace-nowrap"
          >
            <IconCheckCircle className="w-4 h-4" />
            <span>5. Reports</span>
          </Link>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 px-2 flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "activity"
                ? "border-[#2457C5] text-[#2457C5] font-bold"
                : "border-transparent text-[#66758A] hover:text-[#172B4D]"
            }`}
          >
            <IconClock className="w-4 h-4" />
            <span>6. Activity</span>
          </button>
        </div>

        {/* Tab 1: Overview Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Workflow Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Link
                href={`/cases/${currentCase.id}/documents`}
                className="p-4 rounded-2xl border border-[#E3E9F2] bg-white hover:border-[#2457C5] hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] text-[#2457C5] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-[#172B4D] block text-xs">Upload Deeds</span>
                    <span className="text-[11px] text-[#66758A]">{documents.length} ingested</span>
                  </div>
                </div>
                <IconArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2457C5] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href={`/cases/${currentCase.id}/scrutiny`}
                className="p-4 rounded-2xl border border-[#E3E9F2] bg-white hover:border-[#2457C5] hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#B7791F] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-[#172B4D] block text-xs">AI Scrutiny</span>
                    <span className="text-[11px] text-[#66758A]">{findings.length} flags</span>
                  </div>
                </div>
                <IconArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2457C5] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href={`/cases/${currentCase.id}/queries`}
                className="p-4 rounded-2xl border border-[#E3E9F2] bg-white hover:border-[#2457C5] hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-[#172B4D] block text-xs">Bank Queries</span>
                    <span className="text-[11px] text-[#66758A]">{queries.length} drafted</span>
                  </div>
                </div>
                <IconArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2457C5] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href={`/cases/${currentCase.id}/report`}
                className="p-4 rounded-2xl border border-[#E3E9F2] bg-white hover:border-[#2457C5] hover:shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-[#172B4D] block text-xs">Certified LSR</span>
                    <span className="text-[11px] text-[#66758A]">
                      {currentCase.status === "Completed" ? "Signed & Certified" : "Draft Opinion"}
                    </span>
                  </div>
                </div>
                <IconArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2457C5] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            {/* Particulars & Discrepancy Split */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 2 Cols: Schedule Property Particulars */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-4">
                <h2 className="text-sm font-bold text-[#172B4D] border-b border-[#E3E9F2] pb-2">
                  Schedule Property Particulars
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#66758A] block font-semibold text-[10px] uppercase">Property Type</span>
                    <span className="font-bold text-[#172B4D]">{currentCase.propertyType}</span>
                  </div>
                  <div>
                    <span className="text-[#66758A] block font-semibold text-[10px] uppercase">Survey / Plot No.</span>
                    <span className="font-mono font-bold text-[#172B4D]">{currentCase.surveyNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#66758A] block font-semibold text-[10px] uppercase">Khata Assessment</span>
                    <span className="font-mono text-[#172B4D]">{currentCase.khataNumber || "Registered"}</span>
                  </div>
                  <div>
                    <span className="text-[#66758A] block font-semibold text-[10px] uppercase">Assigned Advocate</span>
                    <span className="font-bold text-[#172B4D]">{currentCase.assignedLawyer}</span>
                  </div>
                </div>

                <div className="text-xs pt-1">
                  <span className="text-[#66758A] block font-semibold text-[10px] uppercase">Physical Schedule Address</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">
                    {currentCase.propertyAddress}
                  </p>
                </div>

                {/* Boundaries */}
                <div className="pt-2">
                  <span className="text-[#66758A] block font-semibold text-[10px] uppercase mb-1.5">
                    Schedule Boundaries
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                      <span className="font-bold text-[#66758A] block text-[10px] uppercase">North</span>
                      <span className="text-[#172B4D] text-[11px]">{currentCase.boundaries.north}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                      <span className="font-bold text-[#66758A] block text-[10px] uppercase">South</span>
                      <span className="text-[#172B4D] text-[11px]">{currentCase.boundaries.south}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                      <span className="font-bold text-[#66758A] block text-[10px] uppercase">East</span>
                      <span className="text-[#172B4D] text-[11px]">{currentCase.boundaries.east}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                      <span className="font-bold text-[#66758A] block text-[10px] uppercase">West</span>
                      <span className="text-[#172B4D] text-[11px]">{currentCase.boundaries.west}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1 Col: Scrutiny Discrepancy Health */}
              <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-5">
                <h2 className="text-sm font-bold text-[#172B4D] border-b border-[#E3E9F2] pb-2">
                  Scrutiny Discrepancy Audit
                </h2>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#C03945] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <IconAlertTriangle className="w-4 h-4 text-[#C03945]" />
                      <span>Critical Title Breaks</span>
                    </span>
                    <span className="font-mono font-bold text-rose-700">{criticalCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#B7791F] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <IconAlertTriangle className="w-4 h-4 text-[#B7791F]" />
                      <span>Warnings &amp; Variances</span>
                    </span>
                    <span className="font-mono font-bold text-amber-700">{warningCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2] text-xs text-[#172B4D] font-semibold">
                    <span>Advocate Reviewed</span>
                    <span className="font-mono text-[#172B4D] font-bold">{acceptedCount} of {findings.length}</span>
                  </div>

                  {pendingCount > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#EEF4FF] border border-blue-200 text-xs text-[#2457C5] font-semibold">
                      <span>Awaiting Advocate Decision</span>
                      <span className="font-mono text-[#2457C5] font-bold">{pendingCount}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    href={`/cases/${currentCase.id}/scrutiny`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <IconScale className="w-4 h-4 text-white" />
                    <span>Open AI Scrutiny Workspace</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Activity History */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#172B4D]">Matter Activity &amp; Audit Trail</h2>
            <div className="text-xs text-[#66758A] space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                <IconClock className="w-4 h-4 text-[#2457C5]" />
                <div className="flex-1">
                  <span className="font-semibold text-[#172B4D] block">Matter Dossier Created</span>
                  <span className="text-[11px] text-[#66758A]">
                    Created at {currentCase.createdAt ? new Date(currentCase.createdAt).toLocaleString() : "Recently"} by {currentCase.assignedLawyer}
                  </span>
                </div>
              </div>

              {documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                  <IconUploadCloud className="w-4 h-4 text-sky-600" />
                  <div className="flex-1">
                    <span className="font-semibold text-[#172B4D] block">Deed Uploaded: {d.docType}</span>
                    <span className="text-[11px] text-[#66758A]">
                      {d.fileName} ({d.pageCount} pages) uploaded at {new Date(d.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {findings.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F9FC] border border-[#E3E9F2]">
                  <IconScale className="w-4 h-4 text-[#B7791F]" />
                  <div className="flex-1">
                    <span className="font-semibold text-[#172B4D] block">Scrutiny Flag: {f.title}</span>
                    <span className="text-[11px] text-[#66758A]">
                      Decision: <strong className="text-[#172B4D]">{f.lawyerDecision.toUpperCase()}</strong> &bull; Severity: {f.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#66758A]">Loading case dossier...</div>}>
      <CaseDetailContent />
    </Suspense>
  );
}
