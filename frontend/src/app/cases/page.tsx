"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { CaseStatus } from "@/types";
import {
  IconSearch,
  IconPlus,
  IconBriefcase,
  IconAlertTriangle,
} from "@/components/icons";

function CasesListContent() {
  const { cases } = useCases();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedBank, setSelectedBank] = useState<string>("All");

  const statusOptions: Array<string> = [
    "All",
    "Intake",
    "Document Processing",
    "Scrutiny Review",
    "Queries Raised",
    "Completed",
  ];

  const banks = useMemo(() => {
    const list = Array.from(new Set(cases.map((c) => c.bankName)));
    return ["All", ...list];
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchStatus = selectedStatus === "All" || c.status === selectedStatus;
      const matchBank = selectedBank === "All" || c.bankName === selectedBank;
      const query = search.toLowerCase().trim();
      const matchQuery =
        !query ||
        c.borrowerName.toLowerCase().includes(query) ||
        (c.coBorrowerName && c.coBorrowerName.toLowerCase().includes(query)) ||
        c.caseNumber.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.propertyAddress.toLowerCase().includes(query) ||
        c.surveyNumber.toLowerCase().includes(query) ||
        c.bankName.toLowerCase().includes(query);

      return matchStatus && matchBank && matchQuery;
    });
  }, [cases, selectedStatus, selectedBank, search]);

  const statusBadgeColors: Record<CaseStatus, string> = {
    Intake: "bg-slate-100 text-slate-700 border-slate-200",
    "Document Processing": "bg-blue-50 text-blue-700 border-blue-200",
    "Scrutiny Review": "bg-amber-50 text-amber-700 border-amber-200 font-bold",
    "Queries Raised": "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold",
    Completed: "bg-emerald-50 text-[#16805D] border-emerald-200 font-bold",
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#10233F]">
              Legal Scrutiny Matters
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active title verification dossiers, cross-document discrepancy flags, and draft LSR opinions.
            </p>
          </div>

          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Scrutiny Case</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by borrower, co-borrower, survey no, or bank reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#356AE6] bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Bank & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Bank:</span>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {banks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cases Table View */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconBriefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">
                {cases.length === 0 ? "No Scrutiny Matters Yet" : "No Matched Scrutiny Matters"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {cases.length === 0
                  ? "Your legal scrutiny workspace is clean. Create your first property scrutiny matter to begin document verification."
                  : "Try adjusting your search criteria or register a new property title matter."}
              </p>
              {cases.length === 0 && (
                <div className="pt-2">
                  <Link
                    href="/cases/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                  >
                    <IconPlus className="w-4 h-4" />
                    <span>Create Your First Scrutiny Matter</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto divide-y divide-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Matter Ref &amp; Borrower</th>
                    <th className="py-3 px-4">Property Schedule</th>
                    <th className="py-3 px-4">Bank &amp; Loan</th>
                    <th className="py-3 px-4">Discrepancy Audit</th>
                    <th className="py-3 px-4">Case Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#356AE6] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[11px]">
                              {c.id}
                            </span>
                            <span className="font-bold text-[#10233F] text-xs">
                              {c.borrowerName}
                            </span>
                          </div>
                          {c.coBorrowerName && (
                            <span className="text-[11px] text-slate-400 block">
                              Co-Borrower: {c.coBorrowerName}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-medium text-slate-800 block truncate">
                            {c.propertyAddress}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Sy. No: {c.surveyNumber} | {c.propertyType}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 block">
                            {c.bankName}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {c.loanAmount}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.findingsCount.critical > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <IconAlertTriangle className="w-3 h-3" />
                              <span>{c.findingsCount.critical} Critical</span>
                            </span>
                          ) : c.findingsCount.warning > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>{c.findingsCount.warning} Warning</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold">
                              Nil Critical Flags
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border ${statusBadgeColors[c.status]}`}>
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/cases/${c.id}`}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors"
                          >
                            Dossier
                          </Link>
                          <Link
                            href={`/cases/${c.id}/scrutiny`}
                            className="px-2.5 py-1 rounded-lg bg-[#10233F] hover:bg-[#1a3860] text-white font-semibold text-[11px] transition-colors"
                          >
                            Scrutiny
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading scrutiny matters...</div>}>
      <CasesListContent />
    </Suspense>
  );
}
