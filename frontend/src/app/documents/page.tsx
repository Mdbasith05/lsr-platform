"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import {
  IconSearch,
  IconUploadCloud,
  IconFileText,
  IconBriefcase,
  IconArrowRight,
  IconX,
} from "@/components/icons";

export default function DocumentLibraryPage() {
  const { cases, documents } = useCases();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedCase, setSelectedCase] = useState<string>("All");

  const documentTypes: Array<string> = [
    "All",
    "Sale Deed / Title Deed",
    "Mother Deed / Prior Deed",
    "Encumbrance Certificate (EC)",
    "Khata Certificate / Patta",
    "Khata Extract / RTC",
    "Property Tax Receipt",
    "Building Plan Approval",
    "Possession Certificate",
    "Identity Proof (Aadhaar/PAN)",
    "Other Ancillary Document",
  ];

  const caseMap = useMemo(() => {
    const map = new Map<string, (typeof cases)[0]>();
    cases.forEach((c) => map.set(c.id, c));
    return map;
  }, [cases]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchType = selectedType === "All" || doc.docType === selectedType;
      const matchCase = selectedCase === "All" || doc.caseId === selectedCase;
      const q = search.toLowerCase().trim();
      const parentCase = caseMap.get(doc.caseId);
      const matchSearch =
        !q ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.docType.toLowerCase().includes(q) ||
        doc.caseId.toLowerCase().includes(q) ||
        (parentCase && parentCase.borrowerName.toLowerCase().includes(q)) ||
        (parentCase && parentCase.caseNumber.toLowerCase().includes(q));

      return matchType && matchCase && matchSearch;
    });
  }, [documents, selectedType, selectedCase, search, caseMap]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Review Ready":
      case "Classified":
        return "bg-emerald-50 text-[#16805D] border-emerald-200";
      case "Extracting Text":
        return "bg-blue-50 text-[#2457C5] border-blue-200 animate-pulse";
      case "Failed":
        return "bg-rose-50 text-[#C03945] border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const isFiltered = search.trim() !== "" || selectedType !== "All" || selectedCase !== "All";

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                Document Library
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20">
                {documents.length} deeds &amp; records
              </span>
            </div>
            <p className="text-xs text-[#66758A] mt-1">
              Centralized repository of registered sale deeds, prior link deeds, ECs, and revenue records across all active matters.
            </p>
          </div>

          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <IconUploadCloud className="w-4 h-4" />
            <span>Select Case to Ingest Deeds</span>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename, document type, borrower name, case reference..."
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
              <span className="text-[#66758A] text-[11px] font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
              >
                {documentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                  setSelectedType("All");
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

        {/* Documents Content */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs overflow-hidden">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconFileText className="w-8 h-8 text-[#66758A] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#172B4D]">
                {documents.length === 0 ? "No Documents Uploaded Yet" : "No Matching Documents Found"}
              </h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                {documents.length === 0
                  ? "Upload registered sale deeds, parent title documents, or encumbrance certificates to active cases to begin scrutiny."
                  : "Try clearing search filters or selecting another document category."}
              </p>
              {documents.length === 0 && (
                <div className="pt-2">
                  <Link
                    href="/cases"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all"
                  >
                    <IconBriefcase className="w-4 h-4" />
                    <span>Go to Matters &amp; Ingest Deeds</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F9FC] text-[#66758A] font-semibold border-b border-[#E3E9F2]">
                    <tr>
                      <th className="py-3 px-4">Document Details</th>
                      <th className="py-3 px-4">Associated Matter</th>
                      <th className="py-3 px-4">Registration Ref</th>
                      <th className="py-3 px-4">Pages / Size</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E9F2]">
                    {filteredDocs.map((doc) => {
                      const parentCase = caseMap.get(doc.caseId);
                      return (
                        <tr key={doc.id} className="hover:bg-[#F7F9FC]/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[#172B4D] block truncate max-w-xs">
                                {doc.fileName}
                              </span>
                              <span className="text-[11px] text-[#2457C5] font-medium block">
                                {doc.docType}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {parentCase ? (
                              <div className="space-y-0.5">
                                <Link
                                  href={`/cases/${parentCase.id}`}
                                  className="font-semibold text-[#172B4D] hover:text-[#2457C5] block"
                                >
                                  {parentCase.borrowerName}
                                </Link>
                                <span className="text-[10px] text-[#66758A] font-mono block">
                                  {parentCase.caseNumber} &bull; {parentCase.bankName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">{doc.caseId}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                            {doc.registrationNumber || "Unregistered / Draft"}
                          </td>

                          <td className="py-3 px-4 text-[#66758A]">
                            <span>{doc.pageCount} pages</span>
                            <span className="text-[10px] text-[#66758A] block">
                              {formatFileSize(doc.fileSizeBytes)}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                                doc.status
                              )}`}
                            >
                              {doc.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/cases/${doc.caseId}/documents`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2457C5] hover:text-[#1B449E]"
                            >
                              <span>View in Case</span>
                              <IconArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-[#E3E9F2]">
                {filteredDocs.map((doc) => {
                  const parentCase = caseMap.get(doc.caseId);
                  return (
                    <div key={doc.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-xs text-[#172B4D]">{doc.fileName}</h4>
                          <span className="text-[11px] text-[#2457C5] font-medium block">{doc.docType}</span>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </div>

                      {parentCase && (
                        <div className="text-xs text-[#66758A] bg-[#F7F9FC] p-2 rounded-xl">
                          <span className="font-semibold text-[#172B4D] block">{parentCase.borrowerName}</span>
                          <span className="text-[10px] font-mono">
                            {parentCase.caseNumber} &bull; {parentCase.bankName}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[#66758A] pt-1">
                        <span>{doc.pageCount} pages &bull; {formatFileSize(doc.fileSizeBytes)}</span>
                        <Link
                          href={`/cases/${doc.caseId}/documents`}
                          className="inline-flex items-center gap-1 font-semibold text-[#2457C5]"
                        >
                          <span>Open &rarr;</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthenticatedShell>
  );
}

