"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { PropertyType } from "@/types";
import {
  IconBuilding,
  IconUser,
  IconFileText,
  IconArrowLeft,
  IconCheck,
} from "@/components/icons";

export default function NewCasePage() {
  const router = useRouter();
  const { addCase, userProfile } = useCases();

  // Form State
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

    try {
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

      router.push(`/cases/${newCaseId}/documents`);
    } catch {
      setSubmitting(false);
      setError("Failed to create matter. Please check inputs and try again.");
    }
  };

  return (
    <AuthenticatedShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/cases"
              className="p-2 rounded-xl border border-[#E3E9F2] bg-white text-[#66758A] hover:text-[#172B4D] transition-colors shadow-xs"
            >
              <IconArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                New Scrutiny Matter Intake
              </h1>
              <p className="text-xs text-[#66758A] mt-0.5">
                Register a new borrower property file for bank title verification and 30-year chain scrutiny.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#66758A]">Assigned Advocate:</span>
            <span className="px-2.5 py-1 rounded-xl bg-[#EEF4FF] text-[#2457C5] font-bold text-xs border border-[#2457C5]/20">
              {userProfile.name || "Advocate"}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-[#C03945] font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Bank & Loan Details */}
          <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E3E9F2]">
              <IconBuilding className="w-4 h-4 text-[#2457C5]" />
              <h2 className="text-sm font-bold text-[#172B4D]">
                1. Lending Bank &amp; Loan Particulars
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Empaneled Bank <span className="text-[#C03945]">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                >
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Other Bank / Housing Finance">Other Financial Institution</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar Branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Chamber Matter Ref #
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Sanction / Loan Amount
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹ 85,00,000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Facility / Loan Product
                </label>
                <input
                  type="text"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  placeholder="Housing Loan / Mortgage Scrutiny"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Borrower Particulars */}
          <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E3E9F2]">
              <IconUser className="w-4 h-4 text-[#2457C5]" />
              <h2 className="text-sm font-bold text-[#172B4D]">
                2. Borrower &amp; Title Holder Particulars
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Primary Borrower / Title Holder <span className="text-[#C03945]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Reddy"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Co-Borrower / Joint Title Holder (if any)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Reddy"
                  value={coBorrowerName}
                  onChange={(e) => setCoBorrowerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule Property Particulars */}
          <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E3E9F2]">
              <IconFileText className="w-4 h-4 text-[#2457C5]" />
              <h2 className="text-sm font-bold text-[#172B4D]">
                3. Schedule Property Particulars
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Property Classification <span className="text-[#C03945]">*</span>
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5]"
                >
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="Apartment / Flat">Apartment / Flat</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Commercial Property">Commercial Property</option>
                  <option value="Agricultural / Non-Agricultural Land">Converted Land</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Survey / CTS / Plot No. <span className="text-[#C03945]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 142/3A"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Khata / Assessment No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. BBMP/KA/2022/91"
                  value={khataNumber}
                  onChange={(e) => setKhataNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Complete Schedule Property Address <span className="text-[#C03945]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Site No. 42, Ward No. 84, Domlur Layout, Bangalore - 560071"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] placeholder-[#66758A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] resize-none"
                />
              </div>
            </div>

            {/* Boundary Schedule */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#172B4D] mb-2">
                Property Boundaries (Schedule &lsquo;A&rsquo; / &lsquo;B&rsquo;)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#66758A] block mb-1">North</span>
                  <input
                    type="text"
                    placeholder="Adjacent Site No. 41"
                    value={boundaryNorth}
                    onChange={(e) => setBoundaryNorth(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#66758A] block mb-1">South</span>
                  <input
                    type="text"
                    placeholder="30-ft Road"
                    value={boundarySouth}
                    onChange={(e) => setBoundarySouth(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#66758A] block mb-1">East</span>
                  <input
                    type="text"
                    placeholder="Private Property"
                    value={boundaryEast}
                    onChange={(e) => setBoundaryEast(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#66758A] block mb-1">West</span>
                  <input
                    type="text"
                    placeholder="Drainage / Open Space"
                    value={boundaryWest}
                    onChange={(e) => setBoundaryWest(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E3E9F2] bg-[#F7F9FC] focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/cases"
              className="px-4 py-2 text-xs font-semibold text-[#66758A] hover:text-[#172B4D]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Registering Matter...</span>
                </>
              ) : (
                <>
                  <IconCheck className="w-4 h-4" />
                  <span>Create Case &amp; Proceed to Deed Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
