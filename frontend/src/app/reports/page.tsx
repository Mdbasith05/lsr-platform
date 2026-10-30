"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import {
  IconSearch,
  IconFileText,
  IconCheckCircle,
  IconScale,
  IconArrowRight,
  IconX,
} from "@/components/icons";

export default function ReportsListPage() {
  const { cases, reports, userProfile } = useCases();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Combine cases and reports to list all draft and finalized reports
  const reportList = useMemo(() => {
    return cases.map((c) => {
      const rep = reports[c.id];
      const isSigned = rep?.isSigned || c.status === "Completed";
      return {
        caseId: c.id,
        caseNumber: c.caseNumber,
        borrowerName: c.borrowerName,
        bankName: c.bankName,
        branch: c.branch,
        propertyType: c.propertyType,
        opinionOutcome: rep?.opinionOutcome || (isSigned ? "Clear and Marketable Title" : "Draft Title Opinion"),
        reportRefNumber: rep?.reportRefNumber || `LSR/${c.caseNumber}`,
        isSigned,
        signedAt: rep?.signedAt || (isSigned ? c.updatedAt : undefined),
        advocateName: rep?.advocateName || userProfile.name || "Empaneled Advocate",
      };
    });
  }, [cases, reports, userProfile]);

  const filteredReports = useMemo(() => {
    return reportList.filter((r) => {
      const matchStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Signed" && r.isSigned) ||
        (selectedStatus === "Draft" && !r.isSigned);

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.borrowerName.toLowerCase().includes(q) ||
        r.caseNumber.toLowerCase().includes(q) ||
        r.caseId.toLowerCase().includes(q) ||
        r.reportRefNumber.toLowerCase().includes(q) ||
        r.bankName.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [reportList, selectedStatus, search]);

  const signedCount = reportList.filter((r) => r.isSigned).length;
  const draftCount = reportList.filter((r) => !r.isSigned).length;

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                Legal Scrutiny Reports (LSR)
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20">
                {signedCount} signed opinions
              </span>
            </div>
            <p className="text-xs text-[#66758A] mt-1">
              Official advocate title opinions, pre-disbursement conditions, and certified Draft &amp; Final Legal Scrutiny Reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-[#16805D] font-bold text-xs border border-emerald-200">
              {signedCount} Certified LSRs
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
              {draftCount} In Progress
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by borrower, report ref, bank, case number..."
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

          <div className="flex items-center gap-2">
            <span className="text-[#66758A] text-[11px] font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
            >
              <option value="All">All Reports</option>
              <option value="Signed">Signed / Certified</option>
              <option value="Draft">Draft Opinions</option>
            </select>
          </div>
        </div>

        {/* Reports Content */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconFileText className="w-8 h-8 text-[#66758A] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#172B4D]">No Reports Found</h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                No legal scrutiny reports match your search criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E3E9F2]">
              {filteredReports.map((r) => (
                <div
                  key={r.caseId}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F7F9FC]/60 transition-colors"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#2457C5] bg-[#EEF4FF] px-2 py-0.5 rounded border border-[#E3E9F2]">
                        {r.reportRefNumber}
                      </span>
                      <h3 className="font-bold text-sm text-[#172B4D]">{r.borrowerName}</h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {r.propertyType}
                      </span>
                    </div>

                    <p className="text-xs text-[#66758A]">
                      Lending Bank: <span className="font-semibold text-[#172B4D]">{r.bankName}</span> ({r.branch})
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.isSigned
                            ? "bg-emerald-50 text-[#16805D] border-emerald-200"
                            : "bg-blue-50 text-[#2457C5] border-blue-200"
                        }`}
                      >
                        {r.isSigned ? (
                          <>
                            <IconCheckCircle className="w-3 h-3 text-[#16805D]" />
                            <span>Signed LSR Opinion</span>
                          </>
                        ) : (
                          <>
                            <IconScale className="w-3 h-3 text-[#2457C5]" />
                            <span>Draft Scrutiny Opinion</span>
                          </>
                        )}
                      </span>

                      <span className="text-[11px] text-[#66758A] italic">
                        {r.opinionOutcome}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/cases/${r.caseId}/report`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
                    >
                      <span>{r.isSigned ? "View Certified LSR" : "Review Draft Report"}</span>
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

