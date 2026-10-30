"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import {
  IconSearch,
  IconScale,
  IconAlertTriangle,
  IconCheckCircle,
  IconArrowRight,
  IconX,
} from "@/components/icons";

export default function MainScrutinyPage() {
  const { cases, findings } = useCases();
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");

  const banks = useMemo(() => {
    const list = Array.from(new Set(cases.map((c) => c.bankName).filter(Boolean)));
    return ["All", ...list];
  }, [cases]);

  // Aggregate findings per case
  const casesWithFindings = useMemo(() => {
    return cases.map((c) => {
      const caseFindings = findings.filter((f) => f.caseId === c.id);
      const criticalCount = caseFindings.filter((f) => f.severity === "critical" && f.lawyerDecision === "pending").length;
      const warningCount = caseFindings.filter((f) => f.severity === "warning" && f.lawyerDecision === "pending").length;
      const totalPending = caseFindings.filter((f) => f.lawyerDecision === "pending").length;
      const resolvedCount = caseFindings.filter((f) => f.lawyerDecision !== "pending").length;

      return {
        ...c,
        caseFindings,
        criticalCount,
        warningCount,
        totalPending,
        resolvedCount,
      };
    });
  }, [cases, findings]);

  const filteredCases = useMemo(() => {
    return casesWithFindings.filter((c) => {
      const matchBank = selectedBank === "All" || c.bankName === selectedBank;
      const matchSev =
        selectedSeverity === "All" ||
        (selectedSeverity === "critical" && c.criticalCount > 0) ||
        (selectedSeverity === "warning" && c.warningCount > 0) ||
        (selectedSeverity === "clean" && c.criticalCount === 0 && c.warningCount === 0);

      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.borrowerName.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.bankName.toLowerCase().includes(q) ||
        c.surveyNumber.toLowerCase().includes(q);

      return matchBank && matchSev && matchQuery;
    });
  }, [casesWithFindings, selectedBank, selectedSeverity, search]);

  const totalCritical = findings.filter((f) => f.severity === "critical" && f.lawyerDecision === "pending").length;
  const totalWarnings = findings.filter((f) => f.severity === "warning" && f.lawyerDecision === "pending").length;

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                AI Scrutiny Hub
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20">
                {findings.length} total findings
              </span>
            </div>
            <p className="text-xs text-[#66758A] mt-1">
              Cross-document AI discrepancy analysis, chain-of-title gap detection, and lawyer decision workbench.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#66758A]">Pending Decisions:</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#C03945] font-bold text-xs border border-rose-200">
              {totalCritical} Critical
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#B7791F] font-bold text-xs border border-amber-200">
              {totalWarnings} Warnings
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by borrower, matter ref, survey no, bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E3E9F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] bg-[#F7F9FC] focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66758A] hover:text-[#172B4D]"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[#66758A] text-[11px] font-medium">Bank:</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                {banks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#66758A] text-[11px] font-medium">Risk Status:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                <option value="All">All Severity Levels</option>
                <option value="critical">Has Critical Flags</option>
                <option value="warning">Has Warning Flags</option>
                <option value="clean">Clear Title Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cases List with Scrutiny Status */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconScale className="w-8 h-8 text-[#66758A] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#172B4D]">No Matters Found</h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                No matters match your selected search or risk criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E3E9F2]">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F7F9FC]/60 transition-colors"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#2457C5] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#E3E9F2]">
                        {c.caseNumber || c.id}
                      </span>
                      <h3 className="font-bold text-sm text-[#172B4D]">{c.borrowerName}</h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {c.propertyType}
                      </span>
                    </div>
                    <p className="text-xs text-[#66758A]">
                      <span className="font-semibold text-[#172B4D]">{c.bankName}</span> &bull; {c.branch} &bull; Sy. No. {c.surveyNumber}
                    </p>
                    <p className="text-[11px] text-[#66758A]">
                      {c.documentCount} deeds ingested &bull; Status: <span className="font-medium text-[#172B4D]">{c.status}</span>
                    </p>
                  </div>

                  {/* Scrutiny Flags Counter */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      {c.criticalCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-[#C03945] border border-rose-200">
                          <IconAlertTriangle className="w-3.5 h-3.5" />
                          <span>{c.criticalCount} Critical Breaks</span>
                        </span>
                      ) : c.warningCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-[#B7791F] border border-amber-200">
                          <IconAlertTriangle className="w-3.5 h-3.5" />
                          <span>{c.warningCount} Warnings</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-[#16805D] border border-emerald-200">
                          <IconCheckCircle className="w-3.5 h-3.5" />
                          <span>Clean / Resolved</span>
                        </span>
                      )}

                      <span className="text-xs text-[#66758A] hidden sm:inline">
                        ({c.resolvedCount} resolved)
                      </span>
                    </div>

                    <Link
                      href={`/cases/${c.id}/scrutiny`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
                    >
                      <span>Open Scrutiny Workspace</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
}

