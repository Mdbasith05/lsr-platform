import {
  Case,
  CaseDocument,
  ScrutinyFinding,
  CaseQuery,
  LSRReportData,
  UserProfile,
  ScrutinyRuleTemplate,
} from "@/types";

/**
 * Clean Initial Product State - Zero Mock Data
 * For a brand new advocate starting with an empty dossier.
 * All lists start empty; cases and documents are created only via genuine advocate intake.
 */
export const initialCases: Case[] = [];

export const initialDocuments: CaseDocument[] = [];

export const initialFindings: ScrutinyFinding[] = [];

export const initialQueries: CaseQuery[] = [];

export const initialReports: Record<string, LSRReportData> = {};

export const initialUserProfile: UserProfile = {
  id: "",
  name: "",
  email: "",
  role: "Senior Empaneled Advocate",
  barEnrollmentNumber: "",
  chamberName: "",
  phone: "",
  address: "",
};

export const defaultUserProfile = initialUserProfile;

export const defaultScrutinyTemplates: ScrutinyRuleTemplate[] = [
  {
    id: "tmpl-sbi-standard",
    title: "State Bank of India — Standard 30-Year Property Scrutiny",
    category: "Nationalized Bank Policy",
    description: "Strict 30-year unbroken title chain devolution, Form 15 manual EC checks, and DC Conversion verification.",
    minChainYears: 30,
    minEcYears: 30,
    mandatoryDocuments: [
      "Absolute Sale Deed (Registered)",
      "Mother Deeds (30-year chain)",
      "Encumbrance Certificate (Form 15 for 30 years)",
      "Khata Certificate (Form A / e-Khata)",
      "Khata Extract (Latest)",
      "Property Tax Paid Receipts (3 years)",
      "Conversion Order (if agricultural origin)",
      "Approved Layout / Building Sanction Plan",
    ],
    stateJurisdiction: "Karnataka (BBMP / BDA / BMRDA)",
    isActive: true,
  },
  {
    id: "tmpl-pvt-housing",
    title: "Private Housing Finance — 13-Year Expedited Verification",
    category: "Housing Finance Company (HFC)",
    description: "13-year statutory limitation title chain, online Nil EC verification, and utility NOC checks.",
    minChainYears: 13,
    minEcYears: 13,
    mandatoryDocuments: [
      "Registered Title Deed",
      "Prior Link Deed (min 13 years)",
      "Nil Encumbrance Certificate (13 years)",
      "Municipal Khata / Assessment Extract",
      "Current Financial Year Tax Receipt",
      "Identity Proof of Borrowers",
    ],
    stateJurisdiction: "Pan-India Metropolitan",
    isActive: true,
  },
];
