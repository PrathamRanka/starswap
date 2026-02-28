"use client";
import Link from "next/link";
import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";

function Footer() {
  return (
    <footer className="relative bg-black text-white/80 py-24 px-6 overflow-hidden border-t border-white/5">
      
      {/* Subtle radial gradient background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 100%, rgba(30, 30, 35, 0.4) 0%, transparent 60%)"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start pb-[80px] md:pb-[120px]">
        
        {/* LEFT COLUMN: Brand */}
        <div className="flex flex-col space-y-6 w-full">
          <Link href="/" className="flex items-center gap-3 w-fit group">
            <h2 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white via-white to-white/60 bg-clip-text text-transparent group-hover:to-white/80 transition-all">
              StarSwap
            </h2>
          </Link>
          <p className="text-sm text-muted-foreground font-medium">
            Built by <Link href="https://github.com/PrathamRanka/starswap" target="_blank" className="text-white/60 hover:text-white transition-colors">@Pratham</Link>
          </p>
        </div>

        {/* RIGHT COLUMN: Info, Actions & Copyright */}
        <div className="flex flex-col space-y-8 w-full md:items-end md:text-right">
          
          {/* Tagline */}
          <div className="max-w-sm">
            <p className="text-lg md:text-xl font-light text-white/90 leading-relaxed md:leading-normal">
              Swap smarter. Trade faster. Built for the future of open-source discovery.
            </p>
          </div>

          {/* Actions & Socials inline */}
          <div className="flex flex-wrap items-center gap-4 justify-start md:justify-end">
            <Link href="https://github.com/PrathamRanka/starswap" target="_blank" className="w-fit">
              <Button variant="outline" className="text-white bg-transparent hover:bg-white/10 border-white/20 gap-2 rounded-full px-6 py-5 font-semibold transition-all">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </Link>
          </div>

          {/* Copyright section */}
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StarSwap. All rights reserved.
            </p>
          </div>

        </div>
      
      </div>

      {/* Massive Background Watermark Text */}
      <div className="absolute bottom-[-10%] left-0 w-full flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <h1 className="text-[18vw] font-extrabold tracking-tight leading-none blur-[2px] opacity-10 bg-linear-to-b from-white to-transparent bg-clip-text text-transparent">
          STARSWAP
        </h1>
      </div>

    </footer>
  );
}

export { Footer };
