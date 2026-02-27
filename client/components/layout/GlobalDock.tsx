"use client";

import { FloatingNav } from "@/components/ui/floating-navbar";
import { User, Trophy, Play } from "lucide-react";

export function GlobalDock() {
  const navItems = [
    {
      name: "Profile",
      link: "/user",
      icon: <User className="w-5 h-5" />,
    },
    {
      name: "Swipe",
      link: "/swipe",
      icon: <Play className="w-5 h-5" />,
    },
    {
      name: "Leaderboard",
      link: "/leaderboard",
      icon: <Trophy className="w-5 h-5" />,
    }
  ];

  return <FloatingNav navItems={navItems} />;
}
