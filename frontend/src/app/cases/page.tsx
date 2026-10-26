"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { CaseStatus } from "@/types";
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconEye,
  IconBriefcase,
  IconFileText,
  IconScale,
} from "@/components/icons";

export default function CasesPage() {
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
    "Scrutiny Review": "bg-amber-50 text-amber-700 border-amber-200",
    "Queries Raised": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Completed: "bg-emerald-50 text-[#16805D] border-emerald-200",
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#10233F]">
              Legal Scrutiny Cases
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Master repository of active and archived property loan verifications.
            </p>
          </div>
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Case Intake</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs border-b border-slate-100">
            {statusOptions.map((st) => {
              const count =
                st === "All" ? cases.length : cases.filter((c) => c.status === st).length;
              const active = selectedStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    active
                      ? "bg-[#10233F] text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Inputs & Bank Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by borrower name, case ID, survey number, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6] focus:border-[#356AE6] transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <IconFilter className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6] focus:border-[#356AE6]"
              >
                <option value="All">All Banks</option>
                {banks
                  .filter((b) => b !== "All")
                  .map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <IconBriefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No cases found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No legal scrutiny cases matched your search query or filter selection.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("All");
                  setSelectedBank("All");
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Case Number</th>
                    <th className="py-3 px-4">Borrower Details</th>
                    <th className="py-3 px-4">Bank &amp; Branch</th>
                    <th className="py-3 px-4">Property Schedule</th>
                    <th className="py-3 px-4">Documents / Flags</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4">
                        <Link href={`/cases/${c.id}`} className="font-mono font-semibold text-[#356AE6] hover:underline">
                          {c.id}
                        </Link>
                        <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                          {c.caseNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-[#10233F]">
                          {c.borrowerName}
                        </div>
                        {c.coBorrowerName && (
                          <div className="text-[10px] text-slate-500">
                            Co-app: {c.coBorrowerName}
                          </div>
                        )}
                        <span className="text-[10px] font-medium text-slate-500">
                          {c.loanType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">{c.bankName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {c.branch}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{c.propertyType}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          Sy. No. {c.surveyNumber} • {c.propertyAddress}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                          <IconFileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.documentCount} docs</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] mt-0.5">
                          {c.findingsCount.critical > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              {c.findingsCount.critical} critical
                            </span>
                          )}
                          {c.openQueriesCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                              {c.openQueriesCount} queries
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusBadgeColors[c.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link
                            href={`/cases/${c.id}`}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                            title="Case Overview"
                          >
                            <IconEye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/cases/${c.id}/scrutiny`}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-slate-600 hover:text-[#356AE6]"
                            title="Scrutiny Discrepancies"
                          >
                            <IconScale className="w-4 h-4" />
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
