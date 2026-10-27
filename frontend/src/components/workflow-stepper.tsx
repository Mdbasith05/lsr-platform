"use client";

import React from "react";
import Link from "next/link";
import { IconCheck, IconArrowRight } from "@/components/icons";

export interface WorkflowStep {
  number: number;
  id: string;
  title: string;
  shortDesc: string;
  href: string;
}

interface WorkflowStepperProps {
  currentStep: number;
  caseId: string;
  nextAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function WorkflowStepper({ currentStep, caseId, nextAction }: WorkflowStepperProps) {
  const steps: WorkflowStep[] = [
    {
      number: 1,
      id: "create-case",
      title: "Create Case",
      shortDesc: "Property & loan intake",
      href: `/cases/${caseId}`,
    },
    {
      number: 2,
      id: "upload-docs",
      title: "Upload Documents",
      shortDesc: "Deeds, ECs & revenue records",
      href: `/cases/${caseId}/documents`,
    },
    {
      number: 3,
      id: "review-docs",
      title: "Review Documents",
      shortDesc: "Verify page & text extraction",
      href: `/cases/${caseId}/documents`,
    },
    {
      number: 4,
      id: "ai-scrutiny",
      title: "AI Scrutiny",
      shortDesc: "Cross-check 30-year chain",
      href: `/cases/${caseId}/scrutiny`,
    },
    {
      number: 5,
      id: "review-findings",
      title: "Review Findings",
      shortDesc: "Accept flags & draft queries",
      href: `/cases/${caseId}/queries`,
    },
    {
      number: 6,
      id: "generate-report",
      title: "Generate Report",
      shortDesc: "Signed Legal Scrutiny Report",
      href: `/cases/${caseId}/report`,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4 no-print">
      {/* Top Bar: Progress Indicator & Next Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Guided Scrutiny Workflow:
          </span>
          <span className="text-xs font-bold text-[#10233F]">
            Step {currentStep} of 6 ? {steps[currentStep - 1]?.title}
          </span>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            ({steps[currentStep - 1]?.shortDesc})
          </span>
        </div>

        {nextAction && (
          <div>
            {nextAction.href ? (
              <Link
                href={nextAction.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D5BD8] hover:bg-[#1547B2] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
              >
                <span>{nextAction.label}</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={nextAction.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D5BD8] hover:bg-[#1547B2] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
              >
                <span>{nextAction.label}</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Responsive Horizontal Stepper Track */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center min-w-[680px] justify-between relative">
          {/* Background Connecting Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          {steps.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <Link
                key={s.id}
                href={s.href}
                className="flex flex-col items-center text-center group relative z-10 max-w-[110px]"
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                      : isCurrent
                      ? "bg-[#1D5BD8] text-white ring-4 ring-blue-100 shadow-md scale-105"
                      : "bg-white text-slate-400 border-2 border-slate-300 group-hover:border-slate-400"
                  }`}
                >
                  {isCompleted ? <IconCheck className="w-4 h-4 stroke-2" /> : s.number}
                </div>

                {/* Step Labels */}
                <div className="mt-2 space-y-0.5">
                  <span
                    className={`block text-[11px] font-bold leading-tight transition-colors ${
                      isCurrent
                        ? "text-[#10233F]"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="block text-[9px] text-slate-400 leading-tight truncate">
                    {s.shortDesc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
