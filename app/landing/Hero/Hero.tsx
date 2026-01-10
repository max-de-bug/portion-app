"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const InteractiveHero = dynamic(
  () => import("../InteractiveHero").then((mod) => mod.InteractiveHero),
  { ssr: false }
);

export const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-[#f0fdf4]">
    {/* Text Layer - Positioned Higher */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-3xl mx-auto text-center relative z-20 pt-32 px-4 pointer-events-none"
    >
      <h1 className="text-3xl md:text-5xl font-black text-[#022c22] leading-tight mb-4 tracking-tighter">
        Spend Yield.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#10b981] drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          Keep Principal.
        </span>
      </h1>
      <p className="text-base text-[#065f46] max-w-lg mx-auto mb-8 leading-relaxed font-medium">
        Portion automatically detects yield from your USDV holdings. 
        Authorise your agents to spend earnings on autopilot.
      </p>
      <div className="flex items-center justify-center">
        <Button size="lg" className="h-10 px-8 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 pointer-events-auto">
          Get Started
        </Button>
      </div>
    </motion.div>

    {/* Interactive SVG Layer - Positioned Below Action */}
    <div className="relative w-full h-[60vh] z-10">
      <InteractiveHero />
    </div>

  </section>

);
