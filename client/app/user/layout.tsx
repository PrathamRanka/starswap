"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, requireAuth } = useAuth();

  useEffect(() => {
    requireAuth();
  }, [isLoading, user, requireAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-t-2 border-white rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    // Return null while redirecting to avoid flashing content
    return null; 
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30">
      {/* Cool creative background for the authenticated layout */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {children}
      </main>
    </div>
  );
}
