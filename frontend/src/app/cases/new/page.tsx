"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { PropertyType } from "@/types";
import {
  IconPlus,
  IconBuilding,
  IconUser,
  IconFileText,
  IconArrowLeft,
  IconCheck,
} from "@/components/icons";

export default function NewCasePage() {
  const router = useRouter();
  const { addCase, userProfile, addToast } = useCases();

  // Form State - Clean initial state with zero prefilled mock data
  const [bankName, setBankName] = useState("State Bank of India");
  const [branch, setBranch] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanType, setLoanType] = useState("Housing Loan (Home Purchase)");

  const [borrowerName, setBorrowerName] = useState("");
  const [coBorrowerName, setCoBorrowerName] = useState("");

  const [propertyType, setPropertyType] = useState<PropertyType>("Independent House / Villa");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [khataNumber, setKhataNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  const [boundaryNorth, setBoundaryNorth] = useState("");
  const [boundarySouth, setBoundarySouth] = useState("");
  const [boundaryEast, setBoundaryEast] = useState("");
  const [boundaryWest, setBoundaryWest] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!borrowerName.trim()) {
      setError("Please provide the Primary Borrower / Title Holder name.");
      return;
    }
    if (!surveyNumber.trim()) {
      setError("Please enter the Revenue Survey / CTS / Plot Number.");
      return;
    }
    if (!propertyAddress.trim()) {
      setError("Please enter the complete physical schedule property address.");
      return;
    }

    setSubmitting(true);

    const newCaseId = await addCase({
      caseNumber: caseNumber.trim() || `LSR/${Date.now().toString().slice(-4)}`,
      borrowerName: borrowerName.trim(),
      coBorrowerName: coBorrowerName.trim() || undefined,
      bankName: bankName.trim(),
      branch: branch.trim() || "Main Branch",
      propertyAddress: propertyAddress.trim(),
      propertyType,
      surveyNumber: surveyNumber.trim(),
      khataNumber: khataNumber.trim() || undefined,
      boundaries: {
        north: boundaryNorth.trim() || "As per deed",
        south: boundarySouth.trim() || "Road",
        east: boundaryEast.trim() || "Adjacent Property",
        west: boundaryWest.trim() || "Adjacent Property",
      },
      loanAmount: loanAmount.trim() || "To be sanctioned",
      loanType: loanType.trim() || "Housing Loan / Mortgage Scrutiny",
      status: "Intake",
      assignedLawyer: userProfile.name,
    });

    // Transition straight into Document Ingestion
    router.push(`/cases/${newCaseId}/documents`);
  };

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/cases"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#10233F]">
                New Scrutiny Case Intake
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Register property schedule and bank loan parameters for AI title devolution analysis.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <span>?</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Lending Institution & Facility */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IconBuilding className="w-4 h-4 text-[#356AE6]" />
              <h2 className="text-sm font-bold text-[#10233F]">1. Lending Institution &amp; Sanction Particulars</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empaneled Bank Name</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#356AE6]"
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank Limited</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Other Bank / NBFC">Other Bank / Housing Finance Company</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch &amp; Processing Hub</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Commercial Branch, Bengaluru"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Loan Reference / File No.</label>
                <input
                  type="text"
                  placeholder="e.g. SBI/IND/2026/8941"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loan Amount &amp; Facility Type</label>
                <input
                  type="text"
                  placeholder="e.g. ? 1,25,00,000 (Home Purchase Loan)"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Borrower & Ownership Particulars */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IconUser className="w-4 h-4 text-[#356AE6]" />
              <h2 className="text-sm font-bold text-[#10233F]">2. Applicant &amp; Co-Owner Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Title Holder / Borrower <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name as appearing on registered title deed"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Co-Borrower / Joint Owner <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Spouse / Co-applicant name"
                  value={coBorrowerName}
                  onChange={(e) => setCoBorrowerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Schedule Property Particulars */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IconFileText className="w-4 h-4 text-[#356AE6]" />
              <h2 className="text-sm font-bold text-[#10233F]">3. Schedule Property &amp; Revenue Survey</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Classification</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#356AE6]"
                >
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="Apartment / Flat">Apartment / Flat</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Commercial Property">Commercial Property</option>
                  <option value="Agricultural / Non-Agricultural Land">Converted Land</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Survey / CTS / Site No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sy. No. 89/1, Site No. 22"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khata / Municipal Assessment No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. BBMP A-Khata 89-01"
                  value={khataNumber}
                  onChange={(e) => setKhataNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Complete Schedule Address Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Site/Flat No, Layout Name, Ward, Hobli, Village, Taluk, District, State and Pin code..."
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#356AE6]"
              />
            </div>

            {/* Schedule Boundaries Sub-Grid */}
            <div className="pt-2">
              <span className="block font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Four Quadrant Schedule Boundaries (Crucial for AI Mismatch Detection)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">North Boundary</label>
                  <input
                    type="text"
                    placeholder="e.g. Site No. 21"
                    value={boundaryNorth}
                    onChange={(e) => setBoundaryNorth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">South Boundary</label>
                  <input
                    type="text"
                    placeholder="e.g. 30-Foot Main Access Road"
                    value={boundarySouth}
                    onChange={(e) => setBoundarySouth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">East Boundary</label>
                  <input
                    type="text"
                    placeholder="e.g. Site No. 23"
                    value={boundaryEast}
                    onChange={(e) => setBoundaryEast(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">West Boundary</label>
                  <input
                    type="text"
                    placeholder="e.g. Drainage Buffer / Road"
                    value={boundaryWest}
                    onChange={(e) => setBoundaryWest(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/cases"
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
            >
              Cancel &amp; Return
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <IconPlus className="w-4 h-4" />
              <span>{submitting ? "Initializing Case..." : "Create Case & Upload Deeds"}</span>
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
