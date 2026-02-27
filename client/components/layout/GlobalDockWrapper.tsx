"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { GlobalDock } from "@/components/layout/GlobalDock";

export function GlobalDockWrapper() {
  const { user } = useAuthContext();

  if (!user) return null;

  return <GlobalDock />;
}
