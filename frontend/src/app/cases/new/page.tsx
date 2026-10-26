"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  const { addCase } = useCases();

  // Form State
  const [bankName, setBankName] = useState("State Bank of India");
  const [branch, setBranch] = useState("Koramangala Commercial Branch, Bengaluru");
  const [caseNumber, setCaseNumber] = useState("SBI/BLR/2026/4102");
  const [loanAmount, setLoanAmount] = useState("₹ 95,00,000 (INR 95 Lakhs)");
  const [loanType, setLoanType] = useState("Home Purchase Loan");

  const [borrowerName, setBorrowerName] = useState("");
  const [coBorrowerName, setCoBorrowerName] = useState("");

  const [propertyType, setPropertyType] = useState<PropertyType>("Residential Plot");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [khataNumber, setKhataNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  const [boundaryNorth, setBoundaryNorth] = useState("");
  const [boundarySouth, setBoundarySouth] = useState("");
  const [boundaryEast, setBoundaryEast] = useState("");
  const [boundaryWest, setBoundaryWest] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Autofill fictional data helper
  const handleAutofill = () => {
    setBorrowerName("Girish M. Hegde");
    setCoBorrowerName("Sunanda G. Hegde");
    setBankName("State Bank of India");
    setBranch("Indiranagar Branch, Bengaluru");
    setCaseNumber("SBI/IND/2026/8941");
    setLoanAmount("₹ 1,10,00,000 (INR 1.10 Crore)");
    setLoanType("Housing Loan (Individual Construction)");
    setPropertyType("Residential Plot");
    setSurveyNumber("88/2B");
    setKhataNumber("BBMP/E-KHATA/882-B");
    setPropertyAddress("Site No. 24, BDA Approved Layout, 3rd Block, HBR Layout, Bengaluru - 560043");
    setBoundaryNorth("Site No. 23 (Private Owner)");
    setBoundarySouth("Site No. 25 (Vacant Plot)");
    setBoundaryEast("40-Feet Main Layout Road");
    setBoundaryWest("Survey No. 88/1 Agricultural Border");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!borrowerName.trim()) {
      setError("Please enter the primary Borrower / Title Holder name.");
      return;
    }
    if (!propertyAddress.trim() || !surveyNumber.trim()) {
      setError("Property Address and Survey / Khasra number are mandatory for title scrutiny.");
      return;
    }

    setSubmitting(true);

    const newId = addCase({
      caseNumber,
      borrowerName,
      coBorrowerName: coBorrowerName || undefined,
      bankName,
      branch,
      propertyAddress,
      propertyType,
      surveyNumber,
      khataNumber: khataNumber || undefined,
      boundaries: {
        north: boundaryNorth || "Demarcated Site",
        south: boundarySouth || "Demarcated Site",
        east: boundaryEast || "Layout Road",
        west: boundaryWest || "Boundary",
      },
      loanAmount,
      loanType,
      status: "Intake",
      assignedLawyer: "Adv. K. R. Sreenivasan (Chambers)",
    });

    setTimeout(() => {
      setSubmitting(false);
      // Navigate to the documents upload stage for this new case
      router.push(`/cases/${newId}/documents`);
    }, 500);
  };

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#10233F]">
                New Case Intake: Property Scrutiny
              </h1>
              <p className="text-xs text-slate-500">
                Register property schedule and bank loan details to initiate chain verification.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutofill}
            className="text-xs font-medium text-[#356AE6] hover:text-[#2655C4] border border-[#356AE6]/30 bg-blue-50/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <IconCheck className="w-3.5 h-3.5" />
            <span>Autofill Fictional Sample</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700">
            <strong>Validation Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Bank & Loan File Information */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IconBuilding className="w-4 h-4 text-[#356AE6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
                1. Bank &amp; Loan Reference
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empaneled Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                >
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="HDFC Bank Ltd.">HDFC Bank Ltd.</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Branch</label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Case / LOS Reference</label>
                <input
                  type="text"
                  required
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loan Category</label>
                <input
                  type="text"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sanction / Applied Amount</label>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Borrower Information */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IconUser className="w-4 h-4 text-[#356AE6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
                2. Borrower / Title Holder Particulars
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Borrower / Title Holder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri. Ramesh Chandra"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Co-Borrower / Joint Owner (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smt. Kavitha Ramesh"
                  value={coBorrowerName}
                  onChange={(e) => setCoBorrowerName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Property Schedule */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IconFileText className="w-4 h-4 text-[#356AE6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
                3. Property Schedule &amp; Identification
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                >
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="Apartment / Flat">Apartment / Flat</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Commercial Property">Commercial Property</option>
                  <option value="Agricultural / Non-Agricultural Land">Agricultural / Non-Agricultural Land</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Survey / Khasra Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 42/1A or 108/2"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khata / Patta / PID Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BBMP/150200..."
                  value={khataNumber}
                  onChange={(e) => setKhataNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Complete Property Address &amp; Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Plot/Flat No, Layout, Village/Hobli, Taluk, City/District, PIN"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
                />
              </div>
            </div>

            {/* Boundaries Subgrid */}
            <div className="pt-3 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Four Boundaries (as per Sale Deed schedule):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">North Boundary</label>
                  <input
                    type="text"
                    placeholder="Adjacent Site / Road"
                    value={boundaryNorth}
                    onChange={(e) => setBoundaryNorth(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">South Boundary</label>
                  <input
                    type="text"
                    placeholder="Adjacent Site / Road"
                    value={boundarySouth}
                    onChange={(e) => setBoundarySouth(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">East Boundary</label>
                  <input
                    type="text"
                    placeholder="Road / Drainage"
                    value={boundaryEast}
                    onChange={(e) => setBoundaryEast(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">West Boundary</label>
                  <input
                    type="text"
                    placeholder="Private Property"
                    value={boundaryWest}
                    onChange={(e) => setBoundaryWest(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Registering Case...</span>
                </>
              ) : (
                <>
                  <IconPlus className="w-4 h-4" />
                  <span>Initialize Case &amp; Proceed to Upload Documents</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
