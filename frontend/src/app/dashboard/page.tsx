"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { Case, CaseStatus } from "@/types";
import {
  IconBriefcase,
  IconAlertTriangle,
  IconShield,
  IconCheckCircle,
  IconPlus,
  IconArrowRight,
  IconScale,
  IconSearch,
  IconUploadCloud,
  IconX,
} from "@/components/icons";

// Local lightweight refresh icon
function IconRefresh({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

const statusBadgeStyles: Record<CaseStatus, { bg: string; text: string; border: string; dot: string }> = {
  Intake: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  "Document Processing": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  "Scrutiny Review": {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "Queries Raised": {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  Completed: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
    dot: "bg-teal-500",
  },
};

export default function DashboardPage() {
  const { cases, findings, userProfile, backendOnline, checkBackendConnection, backendCheckLoading } = useCases();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankFilter, setSelectedBankFilter] = useState("All");
  const [selectedStageFilter, setSelectedStageFilter] = useState("All");

  // Key KPI Metrics
  const totalActiveCases = cases.filter((c) => c.status !== "Completed").length;
  const pendingScrutinyCases = cases.filter(
    (c) => c.status === "Scrutiny Review" || c.status === "Document Processing"
  ).length;
  const totalUnresolvedFindings = findings.filter((f) => f.lawyerDecision === "pending").length;
  const criticalFindingsCount = findings.filter(
    (f) => f.severity === "critical" && f.lawyerDecision === "pending"
  ).length;
  const completedReportsCount = cases.filter((c) => c.status === "Completed").length;

  // Bank list for filter dropdown
  const banks = useMemo(() => {
    const list = Array.from(new Set(cases.map((c) => c.bankName).filter(Boolean)));
    return ["All", ...list];
  }, [cases]);

  // Filtered active & in-progress cases for Recent Cases Table
  const activeCasesList = useMemo(() => {
    return cases.filter((c) => {
      const matchBank = selectedBankFilter === "All" || c.bankName === selectedBankFilter;
      const matchStage = selectedStageFilter === "All" || c.status === selectedStageFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.borrowerName.toLowerCase().includes(q) ||
        (c.coBorrowerName && c.coBorrowerName.toLowerCase().includes(q)) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.surveyNumber.toLowerCase().includes(q) ||
        c.bankName.toLowerCase().includes(q);

      return matchBank && matchStage && matchQuery;
    });
  }, [cases, selectedBankFilter, selectedStageFilter, searchQuery]);

  // Determine stage progress and immediate next action for any case
  const getCaseWorkflowDetails = (c: Case) => {
    switch (c.status) {
      case "Intake":
        return {
          stepNum: 2,
          stepName: "Upload Title Deeds",
          progressPct: 20,
          nextActionLabel: "Upload Deeds",
          nextActionHref: `/cases/${c.id}/documents`,
          actionStyle: "bg-[#10233F] hover:bg-[#1A365D] text-white",
          summary: "Case created. Waiting for registered deed uploads.",
        };
      case "Document Processing":
        return {
          stepNum: 3,
          stepName: "Review Deeds",
          progressPct: 40,
          nextActionLabel: "Review & Scrutinize",
          nextActionHref: `/cases/${c.id}/documents`,
          actionStyle: "bg-[#1D5BD8] hover:bg-[#1547B2] text-white",
          summary: `${c.documentCount} deeds uploaded. Ready for AI cross-examination.`,
        };
      case "Scrutiny Review":
        return {
          stepNum: 4,
          stepName: "Title Discrepancies",
          progressPct: 65,
          nextActionLabel: c.findingsCount.critical > 0 ? "Resolve Breaks" : "Review Flags",
          nextActionHref: `/cases/${c.id}/scrutiny`,
          actionStyle:
            c.findingsCount.critical > 0
              ? "bg-rose-700 hover:bg-rose-800 text-white"
              : "bg-[#1D5BD8] hover:bg-[#1547B2] text-white",
          summary: `${c.findingsCount.critical} title breaks, ${c.findingsCount.warning} warnings flagged.`,
        };
      case "Queries Raised":
        return {
          stepNum: 5,
          stepName: "Bank Requisitions",
          progressPct: 85,
          nextActionLabel: "Review Requisitions",
          nextActionHref: `/cases/${c.id}/queries`,
          actionStyle: "bg-indigo-600 hover:bg-indigo-700 text-white",
          summary: `${c.openQueriesCount} requisitions drafted for bank credit officer.`,
        };
      case "Completed":
        return {
          stepNum: 6,
          stepName: "Report Signed",
          progressPct: 100,
          nextActionLabel: "View Signed LSR",
          nextActionHref: `/cases/${c.id}/report`,
          actionStyle: "bg-teal-700 hover:bg-teal-800 text-white",
          summary: "Advocate opinion signed. Ready for mortgage creation.",
        };
    }
  };

  const isFiltered = searchQuery.trim() !== "" || selectedBankFilter !== "All" || selectedStageFilter !== "All";

  return (
    <AuthenticatedShell>
      <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
        {/* =========================================================================
            1. EXECUTIVE WELCOME HEADER & PRIMARY ACTIONS
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200/70">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Empaneled Legal Practice Portal
              </span>
              <span className="text-xs text-slate-300 font-medium">|</span>
              <span className="text-xs text-slate-500 font-mono">
                {userProfile.barEnrollmentNumber ? `Bar Reg: ${userProfile.barEnrollmentNumber}` : "Bar Reg: Active"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10233F]">
              Welcome back, {userProfile.name || "Advocate"}
            </h1>

            <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
              {userProfile.chamberName ? `${userProfile.chamberName} — ` : ""}
              Managing statutory title searches, 30-year chain verifications, discrepancy audits, and certified Legal Scrutiny Reports (LSR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Quick Refresh / Sync Connection Button */}
            <button
              onClick={checkBackendConnection}
              disabled={backendCheckLoading}
              title="Ping and refresh backend service connection"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs disabled:opacity-60"
            >
              <IconRefresh className={`w-3.5 h-3.5 text-slate-600 ${backendCheckLoading ? "animate-spin text-[#1D5BD8]" : ""}`} />
              <span className="hidden sm:inline">{backendCheckLoading ? "Syncing..." : "Sync"}</span>
            </button>

            {/* Quick Upload from anywhere */}
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <IconUploadCloud className="w-4 h-4 text-[#1D5BD8]" />
              <span>Upload Deeds</span>
            </Link>

            {/* Prominent Primary Call-to-Action */}
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10233F] hover:bg-[#1A365D] text-white text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <IconPlus className="w-4 h-4 text-teal-400" />
              <span>Start Property Scrutiny</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            2. SERVICE STATUS & ERROR/WARNING ALERTS
           ========================================================================= */}
        {/* Backend Disconnected Notice (Error State) */}
        {!backendOnline && (
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconAlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <strong className="font-bold text-[#10233F] text-xs">
                    FastAPI Scrutiny Service Disconnected &bull; Local Cache Active
                  </strong>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">
                  Automated OCR deed extraction and Gemini discrepancy scrutiny require an active backend microservice and valid Supabase credentials. Dossiers remain accessible in offline mode.
                </p>
              </div>
            </div>

            <button
              onClick={checkBackendConnection}
              disabled={backendCheckLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto disabled:opacity-60"
            >
              <IconRefresh className={`w-3.5 h-3.5 text-[#1D5BD8] ${backendCheckLoading ? "animate-spin" : ""}`} />
              <span>{backendCheckLoading ? "Pinging Service..." : "Re-Check Connection"}</span>
            </button>
          </div>
        )}

        {/* Priority Risk Banner if critical findings are pending */}
        {criticalFindingsCount > 0 && (
          <div className="rounded-2xl border border-rose-200/90 bg-rose-50/90 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconAlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div className="space-y-0.5">
                <strong className="font-bold text-rose-950 block text-xs">
                  Advocate Action Required: {criticalFindingsCount} Priority Title Breaks Pending Decision
                </strong>
                <p className="text-rose-900/80 leading-relaxed text-xs max-w-2xl">
                  AI discrepancy scrutiny identified boundary variances or missing parent link deeds across active mortgage files requiring formal lawyer adjudication.
                </p>
              </div>
            </div>

            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>Review Flagged Matters</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* =========================================================================
            3. KEY METRICS ROW (4 Cards with subtle accents)
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Active Dossiers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Matters
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D5BD8] border border-blue-100 flex items-center justify-center">
                <IconBriefcase className="w-4 h-4 text-[#1D5BD8]" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#10233F] tracking-tight tabular-nums">
                  {totalActiveCases}
                </span>
                <span className="text-xs text-slate-500 font-medium">in-flight</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active title verification dossiers
              </p>
            </div>
          </div>

          {/* Card 2: Pending Scrutiny */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pending Scrutiny
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                <IconScale className="w-4 h-4 text-amber-700" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#10233F] tracking-tight tabular-nums">
                  {pendingScrutinyCases}
                </span>
                <span className="text-xs text-slate-500 font-medium">awaiting review</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deed OCR & AI cross-checks ready
              </p>
            </div>
          </div>

          {/* Card 3: Unresolved Findings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Unresolved Flags
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
                <IconAlertTriangle className="w-4 h-4 text-rose-700" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#10233F] tracking-tight tabular-nums">
                  {totalUnresolvedFindings}
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                  {criticalFindingsCount} critical
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Title breaks & boundary variances
              </p>
            </div>
          </div>

          {/* Card 4: Signed Opinions with subtle teal accent */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-200/90 transition-all space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Signed Opinions
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70 flex items-center justify-center">
                <IconCheckCircle className="w-4 h-4 text-teal-700" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#10233F] tracking-tight tabular-nums">
                  {completedReportsCount}
                </span>
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                  Certified LSRs
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Delivered to bank credit managers
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. "CONTINUE YOUR WORK" SECTION (Recent Cases Table with Desktop & Mobile)
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Section Toolbar & Filters */}
          <div className="p-5 md:p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#10233F] tracking-tight">
                    Continue Your Work
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {activeCasesList.length} of {cases.length} matters
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every active property matter dossier with its devolution progress, discrepancy flags, and immediate advocate action.
                </p>
              </div>

              <Link
                href="/cases"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5BD8] hover:text-[#1547B2]"
              >
                <span>View All Matters</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Search & Filters Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
              {/* Search Input */}
              <div className="relative flex-1">
                <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by borrower, co-borrower, case ref, survey no, bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Bank Filter */}
                <select
                  value={selectedBankFilter}
                  onChange={(e) => setSelectedBankFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {banks.map((b) => (
                    <option key={b} value={b}>
                      {b === "All" ? "All Lending Banks" : b}
                    </option>
                  ))}
                </select>

                {/* Stage Filter */}
                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="All">All Workflow Stages</option>
                  <option value="Intake">Intake</option>
                  <option value="Document Processing">Document Processing</option>
                  <option value="Scrutiny Review">Scrutiny Review</option>
                  <option value="Queries Raised">Queries Raised</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Reset Filters Button */}
                {isFiltered && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedBankFilter("All");
                      setSelectedStageFilter("All");
                    }}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors flex items-center gap-1"
                    title="Reset filters"
                  >
                    <IconX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              RECENT CASES CONTENT: TABLE (Desktop) & CARDS (Mobile) & EMPTY STATES
             ========================================================================= */}
          {activeCasesList.length === 0 ? (
            /* Clean & Consistent Empty State */
            <div className="p-10 md:p-14 text-center space-y-4">
              {cases.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 text-[#10233F] flex items-center justify-center mx-auto shadow-xs">
                    <IconScale className="w-8 h-8 text-[#10233F]" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-[#10233F] tracking-tight">
                      No Active Scrutiny Matters
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Welcome to Lawyer Copilot. Begin by creating your first property scrutiny dossier or uploading registered title deeds for automated devolution analysis.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/cases/new"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10233F] hover:bg-[#1A365D] text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <IconPlus className="w-4 h-4 text-teal-400" />
                      <span>Start First Scrutiny Matter</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-600 flex items-center justify-center mx-auto">
                    <IconSearch className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-[#10233F]">
                      No Matching Scrutiny Files Found
                    </h3>
                    <p className="text-xs text-slate-500">
                      No matters match your filter criteria. Try adjusting your search query, bank selection, or stage filter.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedBankFilter("All");
                      setSelectedStageFilter("All");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <IconX className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <th className="py-3 px-6">Matter Ref & Borrower</th>
                      <th className="py-3 px-6">Property Schedule & Bank</th>
                      <th className="py-3 px-6">Discrepancy Audit</th>
                      <th className="py-3 px-6">Devolution Workflow</th>
                      <th className="py-3 px-6 text-right">Immediate Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeCasesList.map((c) => {
                      const wf = getCaseWorkflowDetails(c);
                      const badge = statusBadgeStyles[c.status];

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Matter Ref & Borrower */}
                          <td className="py-4 px-6 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {c.caseNumber || c.id}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100/80 text-slate-600">
                                  {c.propertyType}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm text-[#10233F]">
                                {c.borrowerName}
                                {c.coBorrowerName ? ` & ${c.coBorrowerName}` : ""}
                              </h3>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{c.status}</span>
                              </span>
                            </div>
                          </td>

                          {/* Property Schedule & Bank */}
                          <td className="py-4 px-6 align-middle">
                            <div className="space-y-0.5 max-w-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <span>{c.bankName}</span>
                                <span className="text-slate-300 font-normal">&bull;</span>
                                <span className="text-slate-500 font-medium text-[11px]">{c.branch}</span>
                              </div>
                              <p className="text-slate-600 font-mono text-[11px] truncate">
                                Sy. No. {c.surveyNumber}
                              </p>
                              <p className="text-emerald-700 font-bold text-[11px]">
                                Loan: {c.loanAmount}
                              </p>
                            </div>
                          </td>

                          {/* Discrepancy Audit */}
                          <td className="py-4 px-6 align-middle">
                            <div className="space-y-1">
                              {c.findingsCount.critical > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                                  <IconAlertTriangle className="w-3.5 h-3.5" />
                                  <span>{c.findingsCount.critical} Critical Title Breaks</span>
                                </span>
                              ) : c.findingsCount.warning > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                                  <IconAlertTriangle className="w-3.5 h-3.5" />
                                  <span>{c.findingsCount.warning} Non-Critical Flags</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70">
                                  <IconCheckCircle className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Clean Title Verified</span>
                                </span>
                              )}
                              <p className="text-[10px] text-slate-400 font-medium">
                                {c.documentCount} deeds registered &bull; {c.openQueriesCount} queries
                              </p>
                            </div>
                          </td>

                          {/* Devolution Workflow Progress */}
                          <td className="py-4 px-6 align-middle">
                            <div className="space-y-1.5 min-w-[150px] max-w-[180px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-500">Stage:</span>
                                <span className="font-bold text-[#10233F]">Step {wf.stepNum} of 6</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${c.status === "Completed" ? "bg-teal-600" : "bg-[#1D5BD8]"
                                    }`}
                                  style={{ width: `${wf.progressPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {wf.stepName}
                              </span>
                            </div>
                          </td>

                          {/* Immediate Action CTA */}
                          <td className="py-4 px-6 align-middle text-right">
                            <Link
                              href={wf.nextActionHref}
                              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all whitespace-nowrap ${wf.actionStyle}`}
                            >
                              <span>{wf.nextActionLabel}</span>
                              <IconArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< md screens) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {activeCasesList.map((c) => {
                  const wf = getCaseWorkflowDetails(c);
                  const badge = statusBadgeStyles[c.status];

                  return (
                    <div key={c.id} className="p-4 space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {c.caseNumber || c.id}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {c.propertyType}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#10233F]">
                            {c.borrowerName}
                            {c.coBorrowerName ? ` & ${c.coBorrowerName}` : ""}
                          </h3>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{c.status}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank / Branch</span>
                          <span className="font-semibold text-slate-800">{c.bankName}</span>
                          <span className="text-[11px] text-slate-500 block truncate">{c.branch}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Survey & Loan</span>
                          <span className="font-mono font-medium text-slate-700 block truncate">Sy. No. {c.surveyNumber}</span>
                          <span className="font-bold text-emerald-700 text-[11px]">{c.loanAmount}</span>
                        </div>
                      </div>

                      {/* Discrepancy & Workflow Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          {c.findingsCount.critical > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <IconAlertTriangle className="w-3.5 h-3.5" />
                              <span>{c.findingsCount.critical} Critical Breaks</span>
                            </span>
                          ) : c.findingsCount.warning > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                              <IconAlertTriangle className="w-3.5 h-3.5" />
                              <span>{c.findingsCount.warning} Non-Critical</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                              <IconCheckCircle className="w-3.5 h-3.5 text-teal-600" />
                              <span>Clean Title Verified</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-500">Step {wf.stepNum} of 6</span>
                        </div>

                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${c.status === "Completed" ? "bg-teal-600" : "bg-[#1D5BD8]"
                              }`}
                            style={{ width: `${wf.progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {wf.summary}
                        </span>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={wf.nextActionHref}
                        className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all ${wf.actionStyle}`}
                      >
                        <span>{wf.nextActionLabel}</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* =========================================================================
            5. QUICK ACCESS WORKSPACE TILES & SYSTEM DIAGNOSTICS
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tile 1: Document Upload Fast-Track */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 p-6 space-y-3.5 flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D5BD8] border border-blue-100 flex items-center justify-center font-bold">
                <IconUploadCloud className="w-5 h-5 text-[#1D5BD8]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#10233F]">Title Deed Ingestion</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Drop multi-page registered sale deeds, prior mother deeds, patta certificates, and ECs directly into active matter dossiers for automated text extraction.
                </p>
              </div>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5BD8] hover:text-[#1547B2] pt-1"
            >
              <span>Select dossier to upload</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 2: Bank Query Formulation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 p-6 space-y-3.5 flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
                <IconShield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#10233F]">Bank Requisitions</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Convert approved title breaks into standardized formal clarification notices ready to deliver directly to branch credit managers.
                </p>
              </div>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-1"
            >
              <span>View active requisitions</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 3: AI Engine Diagnostics */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 p-6 space-y-3.5 flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-bold">
                  <IconScale className="w-5 h-5 text-slate-700" />
                </div>
                <button
                  onClick={checkBackendConnection}
                  disabled={backendCheckLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D5BD8] hover:underline disabled:opacity-60"
                >
                  <IconRefresh className={`w-3 h-3 ${backendCheckLoading ? "animate-spin" : ""}`} />
                  <span>{backendCheckLoading ? "Checking..." : "Re-Check"}</span>
                </button>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-teal-500" : "bg-amber-400"}`} />
                  <h3 className="font-bold text-sm text-[#10233F]">
                    {backendOnline ? "FastAPI Scrutiny Service Online" : "Backend Disconnected / Auth Required"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  {backendOnline
                    ? "Connected to Python extraction & Gemini scrutiny microservice."
                    : "Requires active Supabase session & local FastAPI server on port 8000."}
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>PyMuPDF extraction &bull; Gemini 2.5 Flash Scrutiny</span>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
