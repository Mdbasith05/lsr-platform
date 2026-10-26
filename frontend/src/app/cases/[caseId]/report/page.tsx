"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { LegalOpinionOutcome } from "@/types";
import {
  IconArrowLeft,
  IconPrinter,
  IconEdit,
  IconCheckCircle,
  IconShield,
  IconCheck,
} from "@/components/icons";

function CaseReportContent() {
  const params = useParams();
  const caseId = params.caseId as string;
  const {
    getCaseById,
    getDocumentsByCaseId,
    getReportByCaseId,
    updateReportData,
    signReport,
  } = useCases();

  const currentCase = getCaseById(caseId);
  const documents = getDocumentsByCaseId(caseId);
  const report = getReportByCaseId(caseId);

  const [isEditing, setIsEditing] = useState(false);

  // Editable fields in state
  const [opinionOutcome, setOpinionOutcome] = useState<LegalOpinionOutcome>(
    report?.opinionOutcome || "Clear with Pre-Disbursement Conditions"
  );
  const [chainNarrative, setChainNarrative] = useState(
    report?.chainOfTitleNarrative || ""
  );
  const [encumbranceNotes, setEncumbranceNotes] = useState(
    report?.encumbranceVerificationNotes || ""
  );
  const [generalObservations, setGeneralObservations] = useState(
    report?.generalObservations || ""
  );

  if (!currentCase || !report) {
    return (
      <AuthenticatedShell>
        <div className="p-8 text-center">Case or report draft not found.</div>
      </AuthenticatedShell>
    );
  }

  const handleSaveEdits = () => {
    updateReportData(caseId, {
      opinionOutcome,
      chainOfTitleNarrative: chainNarrative,
      encumbranceVerificationNotes: encumbranceNotes,
      generalObservations: generalObservations,
    });
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignOff = () => {
    signReport(caseId);
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header - Hidden in Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}`}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#356AE6]">{currentCase.id}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{currentCase.borrowerName}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#10233F]">
                Draft Legal Scrutiny Report (LSR) Preview
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
            >
              <IconEdit className="w-4 h-4 text-slate-500" />
              <span>{isEditing ? "View Clean Preview" : "Edit Report Text"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
            >
              <IconPrinter className="w-4 h-4 text-slate-500" />
              <span>Print / Export PDF</span>
            </button>

            {!report.isSigned ? (
              <button
                onClick={handleSignOff}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16805D] hover:bg-[#11664a] text-white text-xs font-semibold shadow-sm transition-all"
              >
                <IconCheckCircle className="w-4 h-4" />
                <span>Advocate Final Sign-Off</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-[#16805D] text-xs font-bold">
                <IconCheck className="w-4 h-4" />
                <span>Signed &amp; Approved by Advocate</span>
              </div>
            )}
          </div>
        </div>

        {/* Mandatory Legal Draft Disclaimer Banner */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 flex items-start gap-3 no-print">
          <IconShield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-amber-950 uppercase tracking-wide">
              Preliminary Draft Document — For Advocate Evaluation Only
            </strong>
            <p className="text-amber-900/80 leading-relaxed text-[11px]">
              This Legal Scrutiny Report draft is prepared with AI-assisted title extraction and cross-verification. It is strictly an advisory aid for the empaneled advocate. It does not constitute a final binding legal opinion until formally signed by the advocate under the Advocates Act, 1961.
            </p>
          </div>
        </div>

        {/* Edit Panel Drawer when isEditing is true */}
        {isEditing && (
          <div className="bg-white p-6 rounded-xl border-2 border-[#356AE6] shadow-md space-y-4 text-xs no-print">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-[#10233F]">
                Edit Legal Scrutiny Report Narrative
              </h3>
              <button
                onClick={handleSaveEdits}
                className="px-4 py-1.5 rounded-lg bg-[#356AE6] text-white font-semibold flex items-center gap-1 text-xs"
              >
                <IconCheck className="w-3.5 h-3.5" />
                <span>Apply &amp; Save Changes</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Final Legal Opinion Outcome
                </label>
                <select
                  value={opinionOutcome}
                  onChange={(e) => setOpinionOutcome(e.target.value as LegalOpinionOutcome)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  <option value="Clear and Marketable Title">Clear and Marketable Title</option>
                  <option value="Clear with Pre-Disbursement Conditions">Clear with Pre-Disbursement Conditions</option>
                  <option value="Defective Title - Unfit for Mortgage">Defective Title - Unfit for Mortgage</option>
                  <option value="Awaiting Critical Query Resolution">Awaiting Critical Query Resolution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chronological Chain of Title Devolution Narrative
                </label>
                <textarea
                  rows={4}
                  value={chainNarrative}
                  onChange={(e) => setChainNarrative(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Encumbrance Certificate &amp; Revenue Search Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={encumbranceNotes}
                  onChange={(e) => setEncumbranceNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Final Concluding Legal Observations &amp; Declarations
                </label>
                <textarea
                  rows={3}
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            FORMAL REPORT DOCUMENT SHEET (A4 Print Layout)
           ========================================================================= */}
        <div className="report-sheet bg-white border border-slate-300 shadow-lg rounded-xl p-8 sm:p-14 text-slate-900 font-serif leading-relaxed text-xs space-y-6 relative print:border-none print:shadow-none print:p-0">
          {/* Draft Watermark for Screen and Print */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none">
            <span className="text-8xl sm:text-9xl font-sans font-black tracking-widest text-slate-900 rotate-[-30deg]">
              DRAFT REPORT
            </span>
          </div>

          {/* Letterhead Header */}
          <div className="text-center border-b-2 border-slate-800 pb-5 space-y-1">
            <h2 className="text-base sm:text-lg font-bold tracking-wider text-slate-900 uppercase font-sans">
              {report.advocateName}
            </h2>
            <p className="text-[11px] font-sans text-slate-600 font-medium">
              Advocate • High Court of Karnataka &amp; Subordinate Courts
            </p>
            <p className="text-[10px] font-sans text-slate-500">
              Bar Council Enrollment No.: {report.barEnrollmentNumber}
            </p>
            <p className="text-[10px] font-sans text-slate-500">
              {report.chamberAddress}
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-0.5 rounded border border-slate-400 font-sans text-[9px] uppercase tracking-widest font-bold text-slate-700">
                Empaneled Legal Scrutiny Report (LSR)
              </span>
            </div>
          </div>

          {/* Addressee & Reference Details */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 font-sans text-xs border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">To:</span>
              <p className="font-bold text-slate-900">The Branch Manager</p>
              <p className="text-slate-700">{currentCase.bankName}</p>
              <p className="text-slate-600">{currentCase.branch}</p>
            </div>
            <div className="sm:text-right space-y-1">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Report Ref: </span>
                <span className="font-mono font-bold text-slate-900">{report.reportRefNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Date: </span>
                <span className="font-semibold text-slate-900">{report.reportDate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Bank File No: </span>
                <span className="font-mono text-slate-700">{currentCase.caseNumber}</span>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 font-sans text-xs font-semibold text-slate-900 leading-snug">
            SUBJECT: Legal Scrutiny Report on Devolution of Title in respect of Schedule Property standing in the name of{" "}
            <span className="text-[#10233F] underline">{currentCase.borrowerName}</span>
            {currentCase.coBorrowerName ? ` and ${currentCase.coBorrowerName}` : ""} for sanction of{" "}
            {currentCase.loanType} of {currentCase.loanAmount}.
          </div>

          {/* 1. Schedule of Property */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              1. Description &amp; Schedule of the Property
            </h3>
            <p className="text-justify leading-relaxed">
              {report.propertyDescription}
            </p>
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded text-[11px] font-sans space-y-1">
              <strong className="block text-slate-800 text-[10px] uppercase tracking-wider">
                Demarcated Boundaries:
              </strong>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div><strong>North:</strong> {currentCase.boundaries.north}</div>
                <div><strong>South:</strong> {currentCase.boundaries.south}</div>
                <div><strong>East:</strong> {currentCase.boundaries.east}</div>
                <div><strong>West:</strong> {currentCase.boundaries.west}</div>
              </div>
            </div>
          </div>

          {/* 2. Documents Scrutinized */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              2. Title &amp; Revenue Documents Scrutinized ({documents.length} Items)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-200 text-[11px] font-sans">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Sl.</th>
                    <th className="p-2 border-b border-slate-200">Nature of Deed / Document</th>
                    <th className="p-2 border-b border-slate-200">Registered Number &amp; Date</th>
                    <th className="p-2 border-b border-slate-200">Issuing Office</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-2 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2 font-semibold text-slate-900">{d.docType}</td>
                      <td className="p-2 font-mono text-slate-700">
                        {d.registrationNumber || "Ref"} dt. {d.docDate}
                      </td>
                      <td className="p-2 text-slate-600">{d.subRegistrarOffice || "Competent Authority"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Chain of Title Devolution */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              3. Chronological Devolution &amp; Flow of Title (Chain Verification)
            </h3>
            <div className="whitespace-pre-line text-justify leading-relaxed">
              {report.chainOfTitleNarrative}
            </div>
          </div>

          {/* 4. Encumbrance & Revenue Search Verification */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              4. Encumbrance Search &amp; Local Revenue Status
            </h3>
            <p className="text-justify leading-relaxed">
              {report.encumbranceVerificationNotes}
            </p>
            <p className="text-justify leading-relaxed mt-1">
              {report.revenueRecordsNotes}
            </p>
          </div>

          {/* 5. Pre-Disbursement Conditions & Requisitions */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              5. Special Pre-Disbursement Requisitions for the Bank
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
              {report.preDisbursementConditions.map((cond, i) => (
                <li key={i} className="text-slate-800">
                  {cond}
                </li>
              ))}
            </ol>
          </div>

          {/* 6. Post-Disbursement Conditions */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              6. Post-Disbursement Compliance
            </h3>
            <ul className="list-disc list-inside space-y-1 leading-relaxed pl-1 text-slate-800">
              {report.postDisbursementConditions.map((cond, i) => (
                <li key={i}>{cond}</li>
              ))}
            </ul>
          </div>

          {/* 7. Final Legal Opinion Declaration */}
          <div className="p-4 rounded border-2 border-slate-800 bg-slate-50 space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
              7. Final Legal Opinion &amp; Certification
            </h3>
            <div className="font-sans text-xs">
              <span className="font-semibold text-slate-700">TITLE VERDICT: </span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                {report.opinionOutcome}
              </span>
            </div>
            <p className="text-justify leading-relaxed italic">
              &ldquo;{report.generalObservations}&rdquo;
            </p>
          </div>

          {/* 8. Signature Block */}
          <div className="pt-8 flex justify-between items-end font-sans text-xs border-t border-slate-200">
            <div>
              <p className="text-slate-500 text-[10px]">Place: Bengaluru</p>
              <p className="text-slate-500 text-[10px]">Date: {report.reportDate}</p>
              {report.isSigned && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-[#16805D] border border-emerald-300 text-[10px] font-bold">
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Digitally Validated by Advocate</span>
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <div className="w-44 border-b border-slate-400 mb-2 pb-6 text-center font-serif text-[10px] text-slate-400 italic">
                {report.isSigned ? `Signed: ${report.advocateName}` : "(Advocate Signature & Seal)"}
              </div>
              <p className="font-bold text-slate-900">{report.advocateName}</p>
              <p className="text-[10px] text-slate-500">Enrolment: {report.barEnrollmentNumber}</p>
              <p className="text-[10px] text-slate-500">Senior Empaneled Advocate</p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading draft report preview...</div>}>
      <CaseReportContent />
    </Suspense>
  );
}
