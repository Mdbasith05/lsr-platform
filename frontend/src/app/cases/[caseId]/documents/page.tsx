"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { DocumentType, CaseDocument } from "@/types";
import {
  IconFileText,
  IconUploadCloud,
  IconEye,
  IconArrowLeft,
  IconArrowRight,
  IconShield,
  IconX,
} from "@/components/icons";

function CaseDocumentsContent() {
  const params = useParams();
  const caseId = params.caseId as string;
  const { getCaseById, getDocumentsByCaseId, addDocumentsToCase } = useCases();

  const currentCase = getCaseById(caseId);
  const documents = getDocumentsByCaseId(caseId);

  // Upload state
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("Sale Deed / Title Deed");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);

  const documentTypeOptions: DocumentType[] = [
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

  // Handle client-side mock file selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const newDocs = Array.from(files).map((f) => ({
        fileName: f.name.endsWith(".pdf") ? f.name : `${f.name}.pdf`,
        docType: selectedDocType,
        docDate: new Date().toISOString().split("T")[0],
        registrationNumber: `REG-${Math.floor(1000 + Math.random() * 9000)}-2026`,
        subRegistrarOffice: "Sub-Registrar Office, Jurisdictional",
        pageCount: Math.floor(4 + Math.random() * 12),
        fileSizeBytes: f.size || 2450000,
        sampleSnippets: [
          {
            page: 1,
            text: `Extracted text from ${f.name}: Title devolution verified for schedule property.`,
          },
        ],
      }));

      addDocumentsToCase(caseId, newDocs);
      setUploading(false);
      setUploadProgress(0);
    }, 900);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  if (!currentCase) {
    return (
      <AuthenticatedShell>
        <div className="p-8 text-center">Case not found.</div>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                Document Ingestion &amp; Repository
              </h1>
            </div>
          </div>

          <Link
            href={`/cases/${caseId}/scrutiny`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#356AE6] hover:bg-[#2655C4] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Proceed to Scrutiny Review</span>
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Confidentiality Sandbox Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
          <IconShield className="w-5 h-5 text-[#356AE6] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-semibold text-[#10233F]">
              Confidentiality &amp; Client-Side Demonstration Notice:
            </strong>
            <p className="text-blue-900/80 leading-relaxed text-[11px]">
              Document files and metadata are parsed locally in this browser demonstration. Confidential borrower documents are never uploaded to remote servers. The production architecture uses private Supabase Storage buckets with short-lived signed URLs.
            </p>
          </div>
        </div>

        {/* Multi-PDF Drag and Drop Upload Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
                Upload Property Deeds &amp; Revenue Records
              </h3>
              <p className="text-[11px] text-slate-500">
                Select legal document category, then drag &amp; drop PDF files or browse.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Document Type:</span>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
              >
                {documentTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${
              dragActive
                ? "border-[#356AE6] bg-blue-50/50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 pointer-events-none">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#356AE6] flex items-center justify-center">
                <IconUploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Drag and drop property PDFs here, or <span className="text-[#356AE6]">browse files</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supported format: PDF • Encrypted client-side demonstration processing
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#356AE6] font-semibold">
                <span>Extracting Text &amp; Parsing Document Hierarchy...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#356AE6] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ingested Documents Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#10233F]">
              Ingested Document Repository ({documents.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Extraction Engine: PyMuPDF + Density Analysis (Mock)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title &amp; File</th>
                  <th className="py-3 px-4">Classified Type</th>
                  <th className="py-3 px-4">Registration Ref</th>
                  <th className="py-3 px-4">Execution Date</th>
                  <th className="py-3 px-4">Pages / Size</th>
                  <th className="py-3 px-4">Status &amp; AI Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <IconFileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                            {doc.fileName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{doc.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{doc.docType}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {doc.registrationNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{doc.docDate}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{doc.pageCount} pages</span>
                      <span className="text-[10px] text-slate-400 block">
                        {(doc.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#16805D] border border-emerald-200">
                          {doc.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {Math.round(doc.confidenceScore * 100)}% conf
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-[#356AE6] hover:text-white text-slate-700 font-medium text-[11px] transition-colors"
                      >
                        <IconEye className="w-3 h-3" />
                        <span>Inspect Text</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Extracted Text Inspector */}
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <IconFileText className="w-5 h-5 text-[#356AE6]" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{previewDoc.fileName}</h3>
                    <p className="text-[10px] text-slate-500">
                      {previewDoc.docType} • {previewDoc.pageCount} pages parsed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px]">
                  <strong>PyMuPDF Extraction Sample:</strong> Demonstrates extracted text indexed per page for AI evidence citation.
                </div>

                <div className="space-y-3">
                  {previewDoc.sampleSnippets && previewDoc.sampleSnippets.length > 0 ? (
                    previewDoc.sampleSnippets.map((snip, i) => (
                      <div key={i} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                        <span className="font-mono text-[10px] font-bold text-[#356AE6] block">
                          Page {snip.page}
                        </span>
                        <p className="font-serif text-slate-800 text-xs leading-relaxed italic">
                          &ldquo;{snip.text}&rdquo;
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 font-serif italic text-xs">
                      &ldquo;Absolute registered deed conveying schedule property. Extracted text indexed across all {previewDoc.pageCount} pages. Ready for cross-document discrepancy scrutiny.&rdquo;
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Registered: {previewDoc.registrationNumber} ({previewDoc.subRegistrarOffice})
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#10233F] text-white text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}

export default function CaseDocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading documents repository...</div>}>
      <CaseDocumentsContent />
    </Suspense>
  );
}
