"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/services/apiClient";
import { PartnerShell } from "@/components/layout/PartnerShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  return <PartnerShell>{children}</PartnerShell>;
}
