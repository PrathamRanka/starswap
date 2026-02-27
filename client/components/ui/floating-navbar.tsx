"use client";
import React from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
//import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/api/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 0,
          y: -50,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.3,
        }}
        className={cn(
          "flex max-w-fit fixed top-6 inset-x-0 mx-auto border border-white/10 rounded-full bg-black/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-5000 pr-2 pl-6 py-2 items-center justify-center space-x-6",
          className
        )}
      >
        {navItems.map((navItem: { name: string; link: string; icon?: React.ReactNode }, idx: number) => (
          <Link
            key={`link=${idx}`}
            href={navItem.link}
            className="relative text-neutral-400 items-center flex space-x-2 hover:text-white transition-colors"
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm font-medium">{navItem.name}</span>
          </Link>
        ))}
        <button 
          onClick={handleLogout}
          className="relative flex items-center gap-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 px-4 py-2 rounded-full text-sm font-bold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Log Out</span>
          <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-linear-to-r from-transparent via-red-500 to-transparent h-px" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
