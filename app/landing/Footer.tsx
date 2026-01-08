"use client";

// Removed unused Zap import
// import { Zap } from "lucide-react"; 

export const Footer = () => (
  <footer className="py-12 px-6 border-t border-border bg-white">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md">
          <span className="font-serif text-xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">P</span>
        </div>
        <span className="font-semibold text-foreground">Portion</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="mailto:hello@portion.app" className="hover:text-foreground transition-colors">Contact</a>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 Portion. Built on Solomon.
      </p>
    </div>
  </footer>
);
