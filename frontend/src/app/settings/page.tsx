"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Loading chamber settings...
    </div>
  );
}
