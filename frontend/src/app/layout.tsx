import type { Metadata } from "next";
import "./globals.css";
import { CaseProvider } from "@/context/case-context";

export const metadata: Metadata = {
  title: "Legal Scrutiny Report (LSR) Platform | Property Document Verification",
  description: "AI-assisted legal scrutiny, chain-of-title verification, and query management for bank loan processing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F4F7FB] text-[#10233F]">
        <CaseProvider>{children}</CaseProvider>
      </body>
    </html>
  );
}
