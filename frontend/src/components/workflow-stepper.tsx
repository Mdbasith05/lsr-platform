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
      title: "Case Intake",
      shortDesc: "Property & borrower",
      href: `/cases/${caseId}`,
    },
    {
      number: 2,
      id: "upload-docs",
      title: "Deed Ingestion",
      shortDesc: "Upload deed files",
      href: `/cases/${caseId}/documents`,
    },
    {
      number: 3,
      id: "review-docs",
      title: "Doc Processing",
      shortDesc: "OCR text extraction",
      href: `/cases/${caseId}/documents`,
    },
    {
      number: 4,
      id: "ai-scrutiny",
      title: "AI Scrutiny",
      shortDesc: "30-year title audit",
      href: `/cases/${caseId}/scrutiny`,
    },
    {
      number: 5,
      id: "review-findings",
      title: "Bank Queries",
      shortDesc: "Requisitions & flags",
      href: `/cases/${caseId}/queries`,
    },
    {
      number: 6,
      id: "generate-report",
      title: "Certified LSR",
      shortDesc: "Signed formal opinion",
      href: `/cases/${caseId}/report`,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E3E9F2] shadow-xs p-4 sm:p-5 space-y-4 no-print">
      {/* Top Bar: Progress Indicator & Next Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E9F2] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#66758A]">
            Guided Workflow:
          </span>
          <span className="text-xs font-bold text-[#172B4D]">
            Step {currentStep} of 6 &bull; {steps[currentStep - 1]?.title}
          </span>
          <span className="text-[11px] text-[#66758A] hidden md:inline">
            ({steps[currentStep - 1]?.shortDesc})
          </span>
        </div>

        {nextAction && (
          <div>
            {nextAction.href ? (
              <Link
                href={nextAction.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all"
              >
                <span>{nextAction.label}</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={nextAction.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2457C5] hover:bg-[#1B449E] text-white text-xs font-bold shadow-xs transition-all"
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
        <div className="flex items-center min-w-[640px] justify-between relative px-2">
          {/* Background Connecting Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E3E9F2] -z-0" />

          {steps.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <Link
                key={s.id}
                href={s.href}
                className="flex flex-col items-center text-center group relative z-10 max-w-[100px]"
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-[#16805D] text-white ring-4 ring-emerald-50"
                      : isCurrent
                      ? "bg-[#2457C5] text-white ring-4 ring-[#EEF4FF] shadow-xs scale-105"
                      : "bg-white text-[#66758A] border-2 border-[#E3E9F2] group-hover:border-[#CBD5E1]"
                  }`}
                >
                  {isCompleted ? <IconCheck className="w-4 h-4 stroke-2" /> : s.number}
                </div>

                {/* Step Labels */}
                <div className="mt-2 space-y-0.5">
                  <span
                    className={`block text-[11px] font-bold leading-tight transition-colors ${
                      isCurrent
                        ? "text-[#172B4D]"
                        : isCompleted
                        ? "text-[#172B4D]"
                        : "text-[#66758A] group-hover:text-[#172B4D]"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="block text-[9px] text-[#66758A] leading-tight truncate">
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
