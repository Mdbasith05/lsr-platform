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
  IconCheckCircle,
  IconArrowRight,
  IconX,
} from "@/components/icons";

function CasesListContent() {
  const { cases } = useCases();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedBank, setSelectedBank] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "borrower" | "status">("newest");

  const statusOptions: Array<string> = [
    "All",
    "Intake",
    "Document Processing",
    "Scrutiny Review",
    "Queries Raised",
    "Completed",
  ];

  const banks = useMemo(() => {
    const list = Array.from(new Set(cases.map((c) => c.bankName).filter(Boolean)));
    return ["All", ...list];
  }, [cases]);

  const filteredCases = useMemo(() => {
    const filtered = cases.filter((c) => {
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

    return filtered.sort((a, b) => {
      if (sortBy === "borrower") return a.borrowerName.localeCompare(b.borrowerName);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [cases, selectedStatus, selectedBank, search, sortBy]);

  const statusBadgeColors: Record<CaseStatus, string> = {
    Intake: "bg-slate-100 text-slate-700 border-slate-200",
    "Document Processing": "bg-blue-50 text-[#2457C5] border-blue-200",
    "Scrutiny Review": "bg-amber-50 text-[#B7791F] border-amber-200 font-semibold",
    "Queries Raised": "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold",
    Completed: "bg-emerald-50 text-[#16805D] border-emerald-200 font-semibold",
  };

  const isFiltered = search.trim() !== "" || selectedStatus !== "All" || selectedBank !== "All";

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                Legal Scrutiny Matters
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20">
                {cases.length} active dossiers
              </span>
            </div>
            <p className="text-xs text-[#66758A] mt-1">
              Active title verification dossiers, 30-year chain devolution tracking, and draft LSR legal opinions.
            </p>
          </div>

          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <IconPlus className="w-4 h-4" />
            <span>Create New Case</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by borrower, co-borrower, survey no, bank reference..."
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

          {/* Filters */}
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
              <span className="text-[#66758A] text-[11px] font-medium">Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#66758A] text-[11px] font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                <option value="newest">Recently Active</option>
                <option value="borrower">Borrower Name</option>
                <option value="status">Workflow Stage</option>
              </select>
            </div>

            {isFiltered && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("All");
                  setSelectedBank("All");
                }}
                className="py-1.5 px-2.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] hover:bg-slate-100 text-xs font-semibold text-[#66758A] transition-colors flex items-center gap-1"
              >
                <IconX className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Cases Data View */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconBriefcase className="w-8 h-8 text-[#66758A] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#172B4D]">
                {cases.length === 0 ? "No Scrutiny Matters Yet" : "No Matching Scrutiny Matters"}
              </h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                {cases.length === 0
                  ? "Your legal scrutiny workspace is clean. Create your first property scrutiny matter to begin document verification."
                  : "Try adjusting your search criteria or register a new property title matter."}
              </p>
              {cases.length === 0 && (
                <div className="pt-2">
                  <Link
                    href="/cases/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all"
                  >
                    <IconPlus className="w-4 h-4" />
                    <span>Create Your First Scrutiny Matter</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F9FC] text-[#66758A] font-semibold border-b border-[#E3E9F2]">
                    <tr>
                      <th className="py-3 px-4">Matter Ref &amp; Borrower</th>
                      <th className="py-3 px-4">Property Schedule</th>
                      <th className="py-3 px-4">Bank &amp; Loan</th>
                      <th className="py-3 px-4">Discrepancy Audit</th>
                      <th className="py-3 px-4">Case Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E9F2]">
                    {filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F7F9FC]/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#2457C5] bg-[#EEF4FF] px-1.5 py-0.5 rounded border border-[#2457C5]/20 text-[11px]">
                                {c.caseNumber || c.id}
                              </span>
                              <Link
                                href={`/cases/${c.id}`}
                                className="font-bold text-[#172B4D] hover:text-[#2457C5] text-xs"
                              >
                                {c.borrowerName}
                              </Link>
                            </div>
                            {c.coBorrowerName && (
                              <span className="text-[11px] text-[#66758A] block">
                                Co-Borrower: {c.coBorrowerName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 max-w-xs">
                            <span className="font-medium text-[#172B4D] block truncate">
                              {c.propertyAddress}
                            </span>
                            <span className="text-[10px] text-[#66758A] font-mono">
                              Sy. No: {c.surveyNumber} &bull; {c.propertyType}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#172B4D] block">
                              {c.bankName}
                            </span>
                            <span className="text-[11px] font-bold text-[#16805D]">
                              {c.loanAmount}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {c.findingsCount.critical > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#C03945] border border-rose-200">
                                <IconAlertTriangle className="w-3 h-3" />
                                <span>{c.findingsCount.critical} Critical</span>
                              </span>
                            ) : c.findingsCount.warning > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-[#B7791F] border border-amber-200">
                                <span>{c.findingsCount.warning} Warning</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#16805D] font-semibold">
                                <IconCheckCircle className="w-3.5 h-3.5" />
                                <span>Clean Title</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${statusBadgeColors[c.status]}`}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/cases/${c.id}`}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-[#172B4D] hover:bg-[#F7F9FC] border border-[#E3E9F2]"
                            >
                              Overview
                            </Link>
                            <Link
                              href={`/cases/${c.id}/scrutiny`}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#2457C5] hover:bg-[#1B449E] text-white"
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

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-[#E3E9F2]">
                {filteredCases.map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#2457C5] bg-[#EEF4FF] px-1.5 py-0.5 rounded text-[10px]">
                            {c.caseNumber || c.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusBadgeColors[c.status]}`}>
                            {c.status}
                          </span>
                        </div>
                        <Link
                          href={`/cases/${c.id}`}
                          className="font-bold text-sm text-[#172B4D] block mt-1 hover:text-[#2457C5]"
                        >
                          {c.borrowerName}
                        </Link>
                      </div>

                      {c.findingsCount.critical > 0 ? (
                        <span className="text-[10px] font-bold text-[#C03945] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {c.findingsCount.critical} Critical
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#16805D]">
                          Clean
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#66758A] space-y-0.5 bg-[#F7F9FC] p-2.5 rounded-xl">
                      <div><strong className="text-[#172B4D]">{c.bankName}</strong> ({c.branch})</div>
                      <div className="truncate">Sy. No. {c.surveyNumber} &bull; {c.propertyType}</div>
                      <div className="font-bold text-[#16805D]">{c.loanAmount}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/cases/${c.id}/documents`}
                        className="text-xs text-[#66758A] hover:text-[#172B4D]"
                      >
                        {c.documentCount} deeds
                      </Link>
                      <Link
                        href={`/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2457C5]"
                      >
                        <span>Open Workspace</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function CasesListPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#66758A]">
          Loading scrutiny cases...
        </div>
      }
    >
      <CasesListContent />
    </Suspense>
  );
}
