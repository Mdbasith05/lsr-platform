"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { Case } from "@/types";
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
} from "@/components/icons";

export default function DashboardPage() {
  const { cases, findings, userProfile, backendOnline, checkBackendConnection, backendCheckLoading } = useCases();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankFilter, setSelectedBankFilter] = useState("All");

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

  // Filtered in-progress cases for "Continue Your Work"
  const banks = useMemo(() => {
    const list = Array.from(new Set(cases.map((c) => c.bankName)));
    return ["All", ...list];
  }, [cases]);

  const activeCasesList = useMemo(() => {
    return cases.filter((c) => {
      const matchBank = selectedBankFilter === "All" || c.bankName === selectedBankFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.borrowerName.toLowerCase().includes(q) ||
        (c.coBorrowerName && c.coBorrowerName.toLowerCase().includes(q)) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.surveyNumber.toLowerCase().includes(q) ||
        c.bankName.toLowerCase().includes(q);

      return matchBank && matchQuery;
    });
  }, [cases, selectedBankFilter, searchQuery]);

  // Determine stage progress and immediate next action for any case
  const getCaseWorkflowDetails = (c: Case) => {
    switch (c.status) {
      case "Intake":
        return {
          stepNum: 2,
          stepName: "Upload Documents",
          progressPct: 20,
          nextActionLabel: "Upload Title Deeds",
          nextActionHref: `/cases/${c.id}/documents`,
          actionStyle: "bg-[#1D5BD8] hover:bg-[#1547B2] text-white",
          summary: "Case created. Waiting for deed PDF uploads.",
        };
      case "Document Processing":
        return {
          stepNum: 3,
          stepName: "Review Ingested Deeds",
          progressPct: 40,
          nextActionLabel: "Review & Start Scrutiny",
          nextActionHref: `/cases/${c.id}/documents`,
          actionStyle: "bg-[#10233F] hover:bg-[#1a3860] text-white",
          summary: `${c.documentCount} deeds uploaded. Ready for AI cross-examination.`,
        };
      case "Scrutiny Review":
        return {
          stepNum: 4,
          stepName: "Review Discrepancies",
          progressPct: 65,
          nextActionLabel: c.findingsCount.critical > 0 ? "Review Critical Discrepancies" : "Review Scrutiny Flags",
          nextActionHref: `/cases/${c.id}/scrutiny`,
          actionStyle: c.findingsCount.critical > 0 ? "bg-rose-700 hover:bg-rose-800 text-white" : "bg-[#1D5BD8] hover:bg-[#1547B2] text-white",
          summary: `${c.findingsCount.critical} critical title breaks, ${c.findingsCount.warning} warnings flagged.`,
        };
      case "Queries Raised":
        return {
          stepNum: 5,
          stepName: "Bank Requisitions",
          progressPct: 85,
          nextActionLabel: "Review & Send Queries",
          nextActionHref: `/cases/${c.id}/queries`,
          actionStyle: "bg-indigo-600 hover:bg-indigo-700 text-white",
          summary: `${c.openQueriesCount} formal requisitions drafted for bank credit officer.`,
        };
      case "Completed":
        return {
          stepNum: 6,
          stepName: "Report Signed",
          progressPct: 100,
          nextActionLabel: "View & Print Signed LSR",
          nextActionHref: `/cases/${c.id}/report`,
          actionStyle: "bg-emerald-700 hover:bg-emerald-800 text-white",
          summary: "Advocate opinion signed. Ready for mortgage creation.",
        };
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* =========================================================================
            1. EXECUTIVE WELCOME HEADER & PRIMARY ACTION
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Empaneled Legal Practice Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10233F]">
              Welcome back, {userProfile.name || "Advocate"}
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-xl">
              {userProfile.chamberName ? `${userProfile.chamberName} — ` : ""}Managing statutory title searches, 30-year chain verifications, and Draft Legal Scrutiny Reports (LSR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Upload from anywhere */}
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <IconUploadCloud className="w-4 h-4 text-[#1D5BD8]" />
              <span>Upload Deeds</span>
            </Link>

            {/* Prominent Primary Call-to-Action */}
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D5BD8] hover:bg-[#1547B2] text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <IconPlus className="w-4 h-4" />
              <span>Start New Property Scrutiny</span>
            </Link>
          </div>
        </div>

        {/* Priority Risk Banner if critical findings are pending */}
        {criticalFindingsCount > 0 && (
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <strong className="font-bold text-rose-950 block text-xs">
                  Advocate Action Required: {criticalFindingsCount} Priority Title Breaks Pending Decision
                </strong>
                <p className="text-rose-900/80 leading-relaxed text-[11px] mt-0.5">
                  AI discrepancy scrutiny identified boundary variances or missing parent link deeds across active mortgage files.
                </p>
              </div>
            </div>

            <Link
              href="/cases"
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              Review Flagged Matters
            </Link>
          </div>
        )}

        {/* =========================================================================
            2. KEY METRICS ROW (Clear at First Glance)
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Matters
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D5BD8] flex items-center justify-center">
                <IconBriefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#10233F] tracking-tight">
                {totalActiveCases}
              </span>
              <span className="text-xs text-slate-500 font-medium">dossiers in flight</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pending Scrutiny
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <IconScale className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#10233F] tracking-tight">
                {pendingScrutinyCases}
              </span>
              <span className="text-xs text-slate-500 font-medium">awaiting analysis</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Unresolved Findings
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <IconAlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#10233F] tracking-tight">
                {totalUnresolvedFindings}
              </span>
              <span className="text-xs text-rose-700 font-bold">
                ({criticalFindingsCount} critical)
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Signed Opinions
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center">
                <IconCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#10233F] tracking-tight">
                {completedReportsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">completed LSRs</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. "CONTINUE YOUR WORK" SECTION (Case Progress & Immediate Next Action)
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#10233F] tracking-tight">
                Continue Your Work
              </h2>
              <p className="text-xs text-slate-500">
                Every active case with its current stage, devolution progress, and immediate next action.
              </p>
            </div>

            {/* Quick Search & Bank Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter client, bank, or survey no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1D5BD8] w-48 sm:w-60"
                />
              </div>

              <select
                value={selectedBankFilter}
                onChange={(e) => setSelectedBankFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {banks.map((b) => (
                  <option key={b} value={b}>
                    {b === "All" ? "All Banks" : b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Work Items List */}
          {activeCasesList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconBriefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">
                {cases.length === 0 ? "No Active Scrutiny Matters" : "No Matching Scrutiny Files"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {cases.length === 0
                  ? "Welcome to Lawyer Copilot. Begin by creating your first property scrutiny matter or uploading title deeds."
                  : "No cases match your search query or bank filter."}
              </p>
              {cases.length === 0 && (
                <div className="pt-2">
                  <Link
                    href="/cases/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D5BD8] hover:bg-[#1547B2] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                  >
                    <IconPlus className="w-4 h-4" />
                    <span>Start First Scrutiny Matter</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeCasesList.map((c) => {
                const wf = getCaseWorkflowDetails(c);

                return (
                  <div
                    key={c.id}
                    className="py-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-xl transition-all"
                  >
                    {/* Left: Case Identity & Particulars */}
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] font-bold text-[#1D5BD8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c.id}
                        </span>
                        <h3 className="font-bold text-sm text-[#10233F]">
                          {c.borrowerName}
                          {c.coBorrowerName ? ` & ${c.coBorrowerName}` : ""}
                        </h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {c.propertyType}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">{c.bankName}</span>
                        <span className="text-slate-300">|</span>
                        <span>{c.branch}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-mono text-slate-700">Sy. No. {c.surveyNumber}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-bold text-emerald-700">{c.loanAmount}</span>
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {wf.summary}
                      </p>
                    </div>

                    {/* Right: Progress Meter & Immediate Next Action CTA */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Step Progress Tracker */}
                      <div className="text-right space-y-1 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-500">Workflow:</span>
                          <span className="font-bold text-[#10233F]">Step {wf.stepNum} of 6</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1D5BD8] rounded-full transition-all duration-300"
                            style={{ width: `${wf.progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {wf.stepName}
                        </span>
                      </div>

                      {/* Primary Next Action Button */}
                      <Link
                        href={wf.nextActionHref}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all whitespace-nowrap ${wf.actionStyle}`}
                      >
                        <span>{wf.nextActionLabel}</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            4. QUICK ACCESS WORKSPACE TILES & SYSTEM STATUS
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tile 1: Document Upload Fast-Track */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D5BD8] flex items-center justify-center font-bold">
              <IconUploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#10233F]">Upload Documents</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Drop multi-page registered sale deeds, mother deeds, and Encumbrance Certificates directly into any active matter dossier.
              </p>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D5BD8] hover:text-[#1547B2]"
            >
              <span>Select case dossier to upload</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 2: Bank Query Formulation */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#10233F]">Bank Requisitions</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Convert approved discrepancy flags into standardized formal clarification notices ready to copy or deliver to branch credit managers.
              </p>
            </div>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>View active requisitions</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 3: AI Engine Diagnostics */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <IconScale className="w-5 h-5" />
              </div>
              <button
                onClick={checkBackendConnection}
                disabled={backendCheckLoading}
                className="text-[10px] font-bold text-[#1D5BD8] hover:underline"
              >
                {backendCheckLoading ? "Pinging..." : "Re-Check"}
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-emerald-500" : "bg-amber-400"}`} />
                <h3 className="font-bold text-sm text-[#10233F]">
                  {backendOnline ? "FastAPI Backend Connected" : "Backend Disconnected / Auth Required"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                {backendOnline
                  ? "Connected to Python extraction & Gemini scrutiny service."
                  : "Backend requires Supabase JWT authentication. Real document scrutiny unavailable offline."}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              PyMuPDF extraction &bull; Pydantic v2
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
