"use client";

import React from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import {
  IconBriefcase,
  IconAlertTriangle,
  IconShield,
  IconCheckCircle,
  IconPlus,
  IconArrowRight,
  IconEye,
  IconBuilding,
} from "@/components/icons";

export default function DashboardPage() {
  const { cases, findings, queries } = useCases();

  const totalCases = cases.length;
  const pendingScrutiny = cases.filter((c) => c.status === "Scrutiny Review" || c.status === "Document Processing").length;
  const openQueries = queries.filter((q) => q.status === "Draft" || q.status === "Approved" || q.status === "Sent to Bank").length;
  const completedCases = cases.filter((c) => c.status === "Completed").length;

  const pendingCriticalFindings = findings.filter(
    (f) => f.severity === "critical" && f.lawyerDecision === "pending"
  );

  return (
    <AuthenticatedShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#10233F]">
              Advocate Scrutiny Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active loan property title verifications, chain devolution &amp; bank query requisitions.
            </p>
          </div>
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Scrutiny Case</span>
          </Link>
        </div>

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Cases */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Total Scrutiny Cases</span>
              <p className="text-2xl font-bold text-[#10233F]">{totalCases}</p>
              <span className="text-[10px] text-slate-400">All empaneled banks</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#356AE6] flex items-center justify-center">
              <IconBriefcase className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Pending Review</span>
              <p className="text-2xl font-bold text-amber-600">{pendingScrutiny}</p>
              <span className="text-[10px] text-amber-700/80 font-medium">Requires Lawyer Decision</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IconAlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Open Queries */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Open Bank Queries</span>
              <p className="text-2xl font-bold text-[#10233F]">{openQueries}</p>
              <span className="text-[10px] text-blue-600 font-medium">Drafted / Pending Answer</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#356AE6] flex items-center justify-center">
              <IconShield className="w-6 h-6" />
            </div>
          </div>

          {/* Completed LSRs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Completed &amp; Signed</span>
              <p className="text-2xl font-bold text-[#16805D]">{completedCases}</p>
              <span className="text-[10px] text-[#16805D] font-medium">Final LSR Issued</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#16805D] flex items-center justify-center">
              <IconCheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Urgent Attention / Critical Findings Alert Banner */}
        {pendingCriticalFindings.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-900 font-semibold text-xs">
                <IconAlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Urgent Scrutiny Attention Required ({pendingCriticalFindings.length} Critical Flags)</span>
              </div>
              <span className="text-[11px] text-amber-700">Action: Advocate Validation Needed</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingCriticalFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-xs flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {finding.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{finding.caseId}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 mt-1.5">{finding.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {finding.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                      {finding.sourceDocName} (p. {finding.pageNumber})
                    </span>
                    <Link
                      href={`/cases/${finding.caseId}/scrutiny`}
                      className="text-xs font-medium text-[#356AE6] hover:text-[#2655C4] inline-flex items-center gap-1"
                    >
                      <span>Review Evidence</span>
                      <IconArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content: Recent Cases Table & Panel Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Cases (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#10233F]">Recent Scrutiny Matters</h3>
                <p className="text-xs text-slate-500">Live property verification pipeline</p>
              </div>
              <Link
                href="/cases"
                className="text-xs font-semibold text-[#356AE6] hover:text-[#2655C4] inline-flex items-center gap-1"
              >
                <span>View All Cases</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Case / Borrower</th>
                    <th className="py-2.5 px-3">Bank &amp; Branch</th>
                    <th className="py-2.5 px-3">Property Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.slice(0, 5).map((c) => {
                    const statusColors = {
                      Intake: "bg-slate-100 text-slate-700",
                      "Document Processing": "bg-blue-50 text-blue-700 border-blue-200",
                      "Scrutiny Review": "bg-amber-50 text-amber-700 border-amber-200",
                      "Queries Raised": "bg-indigo-50 text-indigo-700 border-indigo-200",
                      Completed: "bg-emerald-50 text-[#16805D] border-emerald-200",
                    };
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-3">
                          <Link href={`/cases/${c.id}`} className="block">
                            <span className="font-semibold text-slate-900 group-hover:text-[#356AE6] transition-colors">
                              {c.borrowerName}
                            </span>
                            <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                              {c.id} • {c.caseNumber}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="font-medium text-slate-800">{c.bankName}</span>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">
                            {c.branch}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span>{c.propertyType}</span>
                          <span className="block text-[10px] text-slate-400">
                            Sy. {c.surveyNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              statusColors[c.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/cases/${c.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-[#356AE6] hover:text-white text-slate-700 font-medium text-[11px] transition-colors"
                          >
                            <IconEye className="w-3 h-3" />
                            <span>Open</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Empaneled Banks & Chamber Standards */}
          <div className="space-y-6">
            {/* Empaneled Banks */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Empaneled Banks Portfolio
              </h3>
              <div className="space-y-3">
                {[
                  { name: "State Bank of India", count: 2, share: "50%" },
                  { name: "HDFC Bank Ltd.", count: 1, share: "25%" },
                  { name: "ICICI Bank", count: 1, share: "25%" },
                  { name: "Axis Bank", count: 1, share: "25%" },
                ].map((bank) => (
                  <div key={bank.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <IconBuilding className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{bank.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600">
                      {bank.count} cases
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Legal Scrutiny Principles */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Statutory Checkpoints Active
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#16805D] font-bold">✓</span>
                  <span>13 / 30-Year Chain of Title Devolution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#16805D] font-bold">✓</span>
                  <span>Sub-Registrar Form 15 Encumbrance Search</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#16805D] font-bold">✓</span>
                  <span>Revenue Conversion &amp; Municipal Khata Check</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#16805D] font-bold">✓</span>
                  <span>Section 58(f) TPA Title Deed Deposit Requirements</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/settings/templates"
                  className="text-xs text-[#356AE6] hover:underline font-medium inline-block"
                >
                  Configure Bank Rule Templates →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
