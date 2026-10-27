"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { useCases } from "@/context/case-context";
import { LegalOpinionOutcome } from "@/types";
import {
  IconArrowLeft,
  IconPrinter,
  IconDownload,
  IconEdit,
  IconCheckCircle,
  IconShield,
  IconCheck,
  IconScale,
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
    userProfile,
    addToast,
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
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Case or Report Draft Not Found</h2>
          <Link
            href="/cases"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] text-white text-xs font-semibold rounded-lg"
          >
            <IconArrowLeft className="w-4 h-4" />
            <span>Return to All Matters</span>
          </Link>
        </div>
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
    addToast("Changes Saved", "Report narrative and opinion classification updated.", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignOff = () => {
    signReport(caseId);
  };

  const getOutcomeBadgeStyle = (outcome: LegalOpinionOutcome) => {
    switch (outcome) {
      case "Clear and Marketable Title":
        return "bg-emerald-50 text-[#16805D] border-emerald-300";
      case "Clear with Pre-Disbursement Conditions":
        return "bg-blue-50 text-[#356AE6] border-blue-300";
      case "Defective Title - Unfit for Mortgage":
        return "bg-rose-50 text-rose-700 border-rose-300";
      case "Awaiting Critical Query Resolution":
        return "bg-amber-50 text-amber-700 border-amber-300";
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header - Hidden in Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <Link
              href={`/cases/${caseId}`}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#356AE6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentCase.id}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-slate-700">{currentCase.borrowerName}</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500">{currentCase.bankName}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#10233F] mt-1">
                Draft Legal Scrutiny Report (LSR)
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
            >
              <IconEdit className="w-4 h-4 text-slate-500" />
              <span>{isEditing ? "Close Editor" : "Edit Report Narrative"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold transition-colors shadow-xs"
            >
              <IconPrinter className="w-4 h-4 text-[#356AE6]" />
              <span>Print Preview</span>
            </button>

            <a
              href={`http://localhost:8000/api/v1/cases/${caseId}/report/export-pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-bold transition-colors shadow-xs"
              title="Download Server-Rendered Official Bank Scrutiny PDF"
            >
              <IconDownload className="w-4 h-4 text-[#16805D]" />
              <span>Download PDF</span>
            </a>

            {!report.isSigned ? (
              <button
                onClick={handleSignOff}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#16805D] hover:bg-[#11664a] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                <IconCheckCircle className="w-4 h-4" />
                <span>Advocate Final Sign-Off</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-[#16805D] text-xs font-bold shadow-xs">
                <IconCheck className="w-4 h-4" />
                <span>Signed &amp; Approved by Advocate</span>
              </div>
            )}
          </div>
        </div>

        {/* 6-Step Guided Workflow Progress - Hidden in Print */}
        <div className="no-print">
          <WorkflowStepper
            caseId={caseId}
            currentStep={6}
            nextAction={{
              label: "Print / Export Official LSR",
              onClick: handlePrint,
            }}
          />
        </div>

        {/* Mandatory Legal Draft Disclaimer Banner - Hidden in Print */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 flex items-start gap-3 no-print shadow-xs">
          <IconShield className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-bold text-amber-950 uppercase tracking-wide">
              Statutory Advocate Opinion Notice &mdash; Advocates Act, 1961
            </strong>
            <p className="text-amber-900/80 leading-relaxed text-[11px]">
              This report has been compiled utilizing AI-assisted title extraction, boundary coordinate comparison, and encumbrance verification. It is strictly an advisory aid for the empaneled advocate. Final professional approval and certification remain exclusively with the Advocate.
            </p>
          </div>
        </div>

        {/* Interactive Editor Drawer when isEditing is true */}
        {isEditing && (
          <div className="bg-white p-6 rounded-2xl border-2 border-[#356AE6] shadow-xl space-y-4 text-xs no-print">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#10233F]">
                Edit Legal Scrutiny Report Narrative
              </h3>
              <button
                onClick={handleSaveEdits}
                className="px-4 py-1.5 rounded-lg bg-[#356AE6] text-white font-bold flex items-center gap-1 text-xs shadow-xs"
              >
                <IconCheck className="w-3.5 h-3.5" />
                <span>Apply &amp; Save Changes</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Final Legal Opinion Classification
                </label>
                <select
                  value={opinionOutcome}
                  onChange={(e) => setOpinionOutcome(e.target.value as LegalOpinionOutcome)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold"
                >
                  <option value="Clear and Marketable Title">Clear and Marketable Title</option>
                  <option value="Clear with Pre-Disbursement Conditions">Clear with Pre-Disbursement Conditions</option>
                  <option value="Defective Title - Unfit for Mortgage">Defective Title - Unfit for Mortgage</option>
                  <option value="Awaiting Critical Query Resolution">Awaiting Critical Query Resolution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Devolution of Title Chronological Chain Narrative
                </label>
                <textarea
                  rows={5}
                  value={chainNarrative}
                  onChange={(e) => setChainNarrative(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
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
                  className="w-full p-3 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  General Advocate Observations &amp; Advice
                </label>
                <textarea
                  rows={3}
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            FORMAL REPORT PAPER SHEET (Court & Bank Standard Print Layout)
           ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 md:p-12 space-y-8 text-slate-900 report-sheet">
          {/* Chamber Letterhead Header */}
          <div className="border-b-2 border-slate-800 pb-5 text-center space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#10233F] text-white flex items-center justify-center mx-auto mb-2">
              <IconScale className="w-6 h-6 text-[#356AE6]" />
            </div>
            <h2 className="text-xl font-serif font-extrabold tracking-wide text-[#10233F] uppercase">
              {userProfile.chamberName}
            </h2>
            <p className="text-xs text-slate-600 font-medium font-sans">
              Advocates &amp; Legal Consultants ? High Court of Karnataka Empaneled
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Chamber: {userProfile.address} | Tel: {userProfile.phone}
            </p>
          </div>

          {/* Reference Meta Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-slate-200 pb-4 gap-2">
            <div>
              <span className="font-semibold text-slate-500">Report Reference:</span>{" "}
              <strong className="font-mono text-slate-900 font-bold">{report.reportRefNumber}</strong>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Date of Search:</span>{" "}
              <strong className="text-slate-900 font-bold">{report.reportDate}</strong>
            </div>
          </div>

          {/* Subject Addressed to Bank */}
          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-600">To,</p>
            <p className="font-bold text-slate-900">The Branch Manager / Chief Manager</p>
            <p className="text-slate-800">{currentCase.bankName}</p>
            <p className="text-slate-600">{currentCase.branch}</p>
            <p className="pt-2 text-xs font-semibold text-[#10233F]">
              <strong>SUBJECT:</strong> Title Search and Legal Scrutiny Report (LSR) for proposed credit facility of{" "}
              <strong>{currentCase.loanAmount}</strong> favoring <strong>{currentCase.borrowerName}</strong>
              {currentCase.coBorrowerName ? ` & ${currentCase.coBorrowerName}` : ""}.
            </p>
          </div>

          {/* Legal Opinion Outcome Highlight Box */}
          <div className={`p-4 rounded-xl border-2 text-center space-y-1 ${getOutcomeBadgeStyle(report.opinionOutcome)}`}>
            <span className="text-[10px] uppercase font-bold tracking-widest block">
              Formal Legal Opinion Finding
            </span>
            <h3 className="text-base font-extrabold tracking-wide uppercase">
              {report.opinionOutcome}
            </h3>
          </div>

          {/* Section 1: Property Description & Schedule */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span>1. Description of Schedule Property</span>
            </h4>
            <p className="text-slate-700 leading-relaxed font-serif">
              {report.propertyDescription}
            </p>

            {/* Boundaries Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 text-xs mt-2">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Direction</th>
                    <th className="py-2 px-3">Boundary as per Title Deed &amp; Ground Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-serif">
                  <tr>
                    <td className="py-2 px-3 font-bold font-sans text-slate-700">North by:</td>
                    <td className="py-2 px-3">{currentCase.boundaries.north}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold font-sans text-slate-700">South by:</td>
                    <td className="py-2 px-3">{currentCase.boundaries.south}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold font-sans text-slate-700">East by:</td>
                    <td className="py-2 px-3">{currentCase.boundaries.east}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold font-sans text-slate-700">West by:</td>
                    <td className="py-2 px-3">{currentCase.boundaries.west}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scrutinized Documents List */}
            {documents.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200 text-xs mt-3">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">No.</th>
                      <th className="py-2 px-3">Document Ingested &amp; Scrutinized</th>
                      <th className="py-2 px-3">Registration Ref &amp; Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-serif text-[11px]">
                    {documents.map((doc, idx) => (
                      <tr key={doc.id}>
                        <td className="py-2 px-3 font-sans font-bold text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-3">{doc.docType} ({doc.fileName})</td>
                        <td className="py-2 px-3 font-mono">{doc.registrationNumber || "Unregistered"} | {doc.docDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Chain of Title Devolution */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              2. Chronological Flow of Title (Devolution of Ownership)
            </h4>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-800 whitespace-pre-wrap font-serif leading-relaxed text-justify">
              {report.chainOfTitleNarrative}
            </div>
          </div>

          {/* Section 3: Encumbrance Certificate Verification */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              3. Encumbrance &amp; Revenue Search Verification
            </h4>
            <p className="text-slate-700 font-serif leading-relaxed text-justify">
              {report.encumbranceVerificationNotes}
            </p>
            <p className="text-slate-700 font-serif leading-relaxed">
              <strong>Revenue Records:</strong> {report.revenueRecordsNotes}
            </p>
          </div>

          {/* Section 4: Pre-Disbursement Requisitions / Conditions */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 text-rose-900">
              4. Pre-Disbursement Conditions &amp; Original Deeds Deposit
            </h4>
            <p className="text-slate-600 text-[11px]">
              The lending institution is advised to ensure compliance with the following mandatory conditions prior to loan release:
            </p>
            <ul className="space-y-2 list-none font-serif">
              {report.preDisbursementConditions.map((cond, index) => (
                <li key={index} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-sans font-bold text-slate-500">{index + 1}.</span>
                  <span className="text-slate-800 leading-relaxed">{cond}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5: Post-Disbursement Conditions */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              5. Post-Disbursement Requirements
            </h4>
            <ul className="space-y-1.5 list-disc pl-5 font-serif text-slate-700">
              {report.postDisbursementConditions.map((cond, index) => (
                <li key={index} className="leading-relaxed">
                  {cond}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 6: Certification & Signature Block */}
          <div className="pt-6 border-t-2 border-slate-800 space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-serif text-[11px] leading-relaxed text-justify">
              <strong>ADVOCATE CERTIFICATION:</strong> I hereby certify that I have personally scrutinized the title documents, link mother deeds, encumbrance certificates, and revenue extracts produced before me. Subject to the fulfillment of stated pre-disbursement conditions, the title of Sri {currentCase.borrowerName} is clear, marketable, and valid for the creation of an equitable mortgage by deposit of title deeds in favor of {currentCase.bankName}.
            </div>

            <div className="flex flex-col sm:flex-row items-end justify-between pt-4 gap-4">
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>Place: Bengaluru, Karnataka</div>
                <div>Date: {report.reportDate}</div>
                <div className="font-mono text-[10px] text-slate-400">
                  Digitally Compiled via Lawyer Copilot Engine
                </div>
              </div>

              <div className="text-right space-y-2">
                {report.isSigned ? (
                  <div className="inline-block p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 text-center shadow-xs">
                    <div className="font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1">
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Digitally Signed &amp; Approved</span>
                    </div>
                    <div className="font-serif font-bold text-xs mt-1 text-slate-900">
                      {report.advocateName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-600">
                      Enrollment: {report.barEnrollmentNumber}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {report.signedAt ? new Date(report.signedAt).toLocaleString("en-IN") : ""}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 p-4 rounded-xl text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Awaiting Advocate Sign-Off
                    </div>
                    <div className="font-serif font-bold text-xs text-slate-700">
                      {report.advocateName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {report.barEnrollmentNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Draft LSR Report...</div>}>
      <CaseReportContent />
    </Suspense>
  );
}
