"use client";

import { memo } from "react";

/**
 * Animated background elements for the Pool Dashboard.
 * Optimized with will-change: transform for better performance.
 */
export const BackgroundElements = memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" 
        style={{ willChange: "transform, opacity" }}
      />
      <div 
        className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" 
        style={{ animationDelay: "1s", willChange: "transform, opacity" }} 
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl" 
        style={{ willChange: "transform" }}
      />
    </div>
  );
});

BackgroundElements.displayName = "BackgroundElements";
