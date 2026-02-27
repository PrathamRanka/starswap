"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { GlobalDock } from "@/components/layout/GlobalDock";
import { usePathname } from "next/navigation";

export function GlobalDockWrapper() {
  const { user } = useAuthContext();
  const pathname = usePathname();

  const allowedPaths = ["/user", "/leaderboard", "/swipe"];

  if (!user) return null;
  if (!allowedPaths.includes(pathname)) return null;

  return <GlobalDock />;
}
