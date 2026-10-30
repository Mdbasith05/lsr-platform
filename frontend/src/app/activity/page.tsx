"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { useCases } from "@/context/case-context";
import { useAuth } from "@/context/auth-context";
import {
  IconClock,
  IconShield,
  IconBriefcase,
  IconFileText,
  IconUploadCloud,
  IconScale,
  IconCheckCircle,
  IconSearch,
} from "@/components/icons";

interface AuditEvent {
  id: string;
  type: "case_created" | "doc_uploaded" | "scrutiny_run" | "finding_decision" | "query_drafted" | "report_signed";
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  caseId?: string;
  caseNumber?: string;
  borrowerName?: string;
}

export default function ActivityAuditPage() {
  const { cases, documents, findings, queries, userProfile } = useCases();
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("All");
  const [search, setSearch] = useState("");

  const actorName = userProfile.name || user?.user_metadata?.full_name || "Advocate";

  // Build real chronological activity timeline from application entities
  const activities: AuditEvent[] = useMemo(() => {
    const events: AuditEvent[] = [];

    // Case creation events
    cases.forEach((c) => {
      events.push({
        id: `act-case-${c.id}`,
        type: "case_created",
        title: "Matter Dossier Initialized",
        description: `Registered new mortgage scrutiny file for ${c.borrowerName} (${c.bankName} - ${c.branch}). Sy. No. ${c.surveyNumber}.`,
        timestamp: c.createdAt || new Date().toISOString(),
        actor: c.assignedLawyer || actorName,
        caseId: c.id,
        caseNumber: c.caseNumber,
        borrowerName: c.borrowerName,
      });

      if (c.status === "Completed") {
        events.push({
          id: `act-sign-${c.id}`,
          type: "report_signed",
          title: "Legal Scrutiny Report Certified",
          description: `Formal advocate title opinion certified and signed for loan sanctioning by ${c.bankName}.`,
          timestamp: c.updatedAt || new Date().toISOString(),
          actor: c.assignedLawyer || actorName,
          caseId: c.id,
          caseNumber: c.caseNumber,
          borrowerName: c.borrowerName,
        });
      }
    });

    // Document upload events
    documents.forEach((d) => {
      const parent = cases.find((c) => c.id === d.caseId);
      events.push({
        id: `act-doc-${d.id}`,
        type: "doc_uploaded",
        title: `Deed Registered: ${d.docType}`,
        description: `Uploaded file "${d.fileName}" (${d.pageCount} pages, reg no: ${d.registrationNumber || "N/A"}).`,
        timestamp: d.uploadedAt || new Date().toISOString(),
        actor: actorName,
        caseId: d.caseId,
        caseNumber: parent?.caseNumber,
        borrowerName: parent?.borrowerName,
      });
    });

    // Findings events
    findings.forEach((f) => {
      if (f.lawyerDecision !== "pending") {
        const parent = cases.find((c) => c.id === f.caseId);
        events.push({
          id: `act-finding-${f.id}`,
          type: "finding_decision",
          title: `Title Flag Adjudicated: ${f.lawyerDecision.toUpperCase()}`,
          description: `Decision recorded for "${f.title}" (${f.severity} severity). ${f.lawyerNotes || ""}`,
          timestamp: f.reviewedAt || new Date().toISOString(),
          actor: actorName,
          caseId: f.caseId,
          caseNumber: parent?.caseNumber,
          borrowerName: parent?.borrowerName,
        });
      }
    });

    // Queries events
    queries.forEach((q) => {
      const parent = cases.find((c) => c.id === q.caseId);
      events.push({
        id: `act-query-${q.id}`,
        type: "query_drafted",
        title: `Bank Requisition Raised [${q.queryCode}]`,
        description: `Formulated query: "${q.title}" with status "${q.status}".`,
        timestamp: q.createdAt || new Date().toISOString(),
        actor: actorName,
        caseId: q.caseId,
        caseNumber: parent?.caseNumber,
        borrowerName: parent?.borrowerName,
      });
    });

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cases, documents, findings, queries, actorName]);

  const filteredEvents = useMemo(() => {
    return activities.filter((e) => {
      const matchType = filterType === "All" || e.type === filterType;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.borrowerName && e.borrowerName.toLowerCase().includes(q)) ||
        (e.caseNumber && e.caseNumber.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [activities, filterType, search]);

  const getEventIcon = (type: AuditEvent["type"]) => {
    switch (type) {
      case "case_created":
        return <IconBriefcase className="w-4 h-4 text-[#2457C5]" />;
      case "doc_uploaded":
        return <IconUploadCloud className="w-4 h-4 text-sky-600" />;
      case "scrutiny_run":
        return <IconScale className="w-4 h-4 text-[#B7791F]" />;
      case "finding_decision":
        return <IconCheckCircle className="w-4 h-4 text-[#16805D]" />;
      case "query_drafted":
        return <IconShield className="w-4 h-4 text-indigo-600" />;
      case "report_signed":
        return <IconFileText className="w-4 h-4 text-[#16805D]" />;
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
                Activity &amp; Audit Trail
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2457C5] border border-[#2457C5]/20">
                Immutable Ledger
              </span>
            </div>
            <p className="text-xs text-[#66758A] mt-1">
              Cryptographically timestamped audit log of all case creation, deed uploads, AI scrutiny events, and advocate sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#66758A] font-mono">
              Total Log Entries: {activities.length}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E3E9F2] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 text-[#66758A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by description, actor, borrower, matter ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E3E9F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#2457C5]/20 focus:border-[#2457C5] bg-[#F7F9FC] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#66758A] text-[11px] font-medium">Event Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#E3E9F2] bg-white text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#2457C5]"
            >
              <option value="All">All Events</option>
              <option value="case_created">Matter Created</option>
              <option value="doc_uploaded">Document Ingested</option>
              <option value="finding_decision">Lawyer Decision</option>
              <option value="query_drafted">Query Drafted</option>
              <option value="report_signed">LSR Certified</option>
            </select>
          </div>
        </div>

        {/* Audit Log Content */}
        <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-6">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <IconClock className="w-8 h-8 text-[#66758A] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#172B4D]">No Audit Records</h3>
              <p className="text-xs text-[#66758A] max-w-sm mx-auto">
                No activity recorded matching your current filters.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E3E9F2]">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative flex items-start gap-4 group">
                  {/* Dot icon */}
                  <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border border-[#E3E9F2] flex items-center justify-center shadow-xs">
                    {getEventIcon(event.type)}
                  </div>

                  <div className="flex-1 bg-[#F7F9FC] border border-[#E3E9F2] rounded-xl p-4 space-y-1 group-hover:border-[#CBD5E1] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-[#172B4D]">{event.title}</span>
                      <span className="text-[10px] text-[#66758A] font-mono">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#66758A]">
                      <span>Actor: <strong className="text-[#172B4D]">{event.actor}</strong></span>
                      {event.caseId && (
                        <>
                          <span>&bull;</span>
                          <Link
                            href={`/cases/${event.caseId}`}
                            className="font-medium text-[#2457C5] hover:underline"
                          >
                            Matter {event.caseNumber || event.caseId} ({event.borrowerName})
                          </Link>
                        </>
                      )}
                    </div>
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

