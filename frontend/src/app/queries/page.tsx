"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { QueryStatus } from "@/types";
import {
  IconSearch,
  IconShield,
  IconArrowRight,
  IconX,
} from "@/components/icons";

export default function QueriesListPage() {
  const { cases, queries } = useCases();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedCase, setSelectedCase] = useState<string>("All");

  const caseMap = useMemo(() => {
    const map = new Map<string, (typeof cases)[0]>();
    cases.forEach((c) => map.set(c.id, c));
    return map;
  }, [cases]);

  const queryStatuses: Array<string> = ["All", "Draft", "Approved", "Sent to Bank", "Resolved", "Waived"];

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchStatus = selectedStatus === "All" || q.status === selectedStatus;
      const matchCase = selectedCase === "All" || q.caseId === selectedCase;
      const term = search.toLowerCase().trim();
      const parentCase = caseMap.get(q.caseId);
      const matchSearch =
        !term ||
        q.queryCode.toLowerCase().includes(term) ||
        q.title.toLowerCase().includes(term) ||
        q.draftText.toLowerCase().includes(term) ||
        (parentCase && parentCase.borrowerName.toLowerCase().includes(term)) ||
        (parentCase && parentCase.caseNumber.toLowerCase().includes(term));

      return matchStatus && matchCase && matchSearch;
    });
  }, [queries, selectedStatus, selectedCase, search, caseMap]);

  const getStatusBadge = (status: QueryStatus) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Approved":
        return "bg-blue-50 text-[#2457C5] border-blue-200 font-semibold";
      case "Sent to Bank":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold";
      case "Resolved":
        return "bg-emerald-50 text-[#16805D] border-emerald-200 font-semibold";
      case "Waived":
        return "bg-amber-50 text-[#B7791F] border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const isFiltered = search.trim() !== "" || selectedStatus !== "All" || selectedCase !== "All";

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                Bank Requisitions &amp; Queries
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20">
                {queries.length} total requisitions
              </span>
            </div>
            <p className="text-xs text-[#66758A] mt-1">
              Formal legal requisitions, missing document notices, and boundary clarifications dispatched to bank credit officers.
            </p>
          </div>

          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <IconShield className="w-4 h-4" />
            <span>Select Matter to Formulate Query</span>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search query code, title, legal requisition text, borrower..."
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
              <span className="text-[#66758A] text-[11px] font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                {queryStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#66758A] text-[11px] font-medium">Matter:</span>
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                <option value="All">All Matters</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} - {c.borrowerName.split(" ")[0]}
                  </option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("All");
                  setSelectedCase("All");
                }}
                className="py-1.5 px-2.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] hover:bg-slate-100 text-xs font-semibold text-[#66758A] transition-colors flex items-center gap-1"
              >
                <IconX className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Queries List */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
          {filteredQueries.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconShield className="w-8 h-8 text-[#66758A] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#172B4D]">
                {queries.length === 0 ? "No Bank Queries Formulated" : "No Matching Queries Found"}
              </h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                {queries.length === 0
                  ? "When title breaks or missing deeds are identified during AI scrutiny, formal requisitions are generated here for bank credit officers."
                  : "Try clearing search filters or selecting another query status."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E3E9F2]">
              {filteredQueries.map((q) => {
                const parentCase = caseMap.get(q.caseId);
                return (
                  <div
                    key={q.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F7F9FC]/60 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#2457C5] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#E3E9F2]">
                          {q.queryCode}
                        </span>
                        <h3 className="font-bold text-sm text-[#172B4D]">{q.title}</h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${getStatusBadge(
                            q.status
                          )}`}
                        >
                          {q.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {q.lawyerApprovedText || q.draftText}
                      </p>

                      {parentCase && (
                        <p className="text-[11px] text-[#66758A]">
                          Matter: <span className="font-medium text-[#172B4D]">{parentCase.borrowerName}</span> ({parentCase.bankName} - {parentCase.caseNumber})
                          {q.linkedFindingTitle && <span> &bull; Linked to flag: {q.linkedFindingTitle}</span>}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/cases/${q.caseId}/queries`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2457C5] hover:text-[#1B449E] whitespace-nowrap"
                      >
                        <span>Manage Requisition</span>
                        <IconArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
}

