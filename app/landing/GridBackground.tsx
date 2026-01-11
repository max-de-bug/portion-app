"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 40; // Size of each square in pixels

export const GridBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update CSS variables directly for absolute zero latency
      // This bypasses React state and Framer Motion spring physics completely
      containerRef.current.style.setProperty("--mouse-x", `${x}px`);
      containerRef.current.style.setProperty("--mouse-y", `${y}px`);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Move the spotlight off-screen smoothly
    if (containerRef.current) {
       containerRef.current.style.setProperty("--mouse-x", "-1000px");
       containerRef.current.style.setProperty("--mouse-y", "-1000px");
    }
  }, []);

  // Generate background style for the base grid
  const bgStyle = { 
    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full overflow-hidden bg-transparent pointer-events-auto group"
      style={{
        "--mouse-x": "-1000px",
        "--mouse-y": "-1000px",
      } as React.CSSProperties}
    >
      {/* Base Faint Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]" 
        style={bgStyle} 
      />

      {/* Spotlight Glow Effect (blur behind the grid) */}
      <div
        className="absolute w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-75 ease-out will-change-transform"
        style={{
          left: "var(--mouse-x)",
          top: "var(--mouse-y)",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* The Active Grid Layer - All Green, masked using CSS variables */}
      {/* Using inline styles for mask-image ensures the browser compositor handles it */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
            ...bgStyle,
            backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
            maskImage: `radial-gradient(300px circle at var(--mouse-x) var(--mouse-y), black, transparent)`,
            WebkitMaskImage: `radial-gradient(300px circle at var(--mouse-x) var(--mouse-y), black, transparent)`,
        }}
      >
        <div 
            className="absolute inset-0"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h38v38H1z' fill='%2310b981' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
            }}
        />
      </div>

    </div>
  );
};
