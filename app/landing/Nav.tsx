"use client";

import { Button } from "@/components/ui/button";

export const Nav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md">
          <span className="font-serif text-xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">P</span>
        </div>
        <span className="font-bold text-lg text-[#022c22] tracking-tight">Portion</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          How it works
        </a>
        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Features
        </a>
        <a href="/dashboard">
          <Button variant="default" size="sm">
            Launch App
          </Button>
        </a>
      </div>
    </div>
  </nav>
);
