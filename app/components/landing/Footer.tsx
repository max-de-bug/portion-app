"use client";

import { Zap } from "lucide-react";

export const Footer = () => (
  <footer className="py-12 px-6 border-t border-border bg-white">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
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
