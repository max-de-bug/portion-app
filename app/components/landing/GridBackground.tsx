"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const GRID_SIZE = 40; // Size of each square in pixels

export const GridBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(-100);
    mouseY.set(-100);
  };

  const cols = Math.ceil(dimensions.width / GRID_SIZE);
  const rows = Math.ceil(dimensions.height / GRID_SIZE);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full overflow-hidden bg-transparent pointer-events-auto"
    >
      <div 
        className="absolute inset-0 opacity-[0.05]" 
        style={{ 
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
        }} 
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {Array.from({ length: rows * cols }).map((_, i) => {
          const x = (i % cols) * GRID_SIZE;
          const y = Math.floor(i / cols) * GRID_SIZE;
          return (
            <GridSquare
              key={i}
              x={x}
              y={y}
              mouseX={mouseX}
              mouseY={mouseY}
            />
          );
        })}
      </svg>
    </div>
  );
};

const GridSquare = ({ x, y, mouseX, mouseY }: { x: number, y: number, mouseX: any, mouseY: any }) => {
  const [active, setActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkHover = () => {
      const mx = mouseX.get();
      const my = mouseY.get();
      const dx = mx - (x + GRID_SIZE / 2);
      const dy = my - (y + GRID_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < GRID_SIZE / 1.2) {
        setActive(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setActive(false), 800);
      }
    };

    const unsubscribeX = mouseX.on("change", checkHover);
    const unsubscribeY = mouseY.on("change", checkHover);
    return () => {
      unsubscribeX();
      unsubscribeY();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [x, y, mouseX, mouseY]);

  return (
    <motion.rect
      x={x + 1}
      y={y + 1}
      width={GRID_SIZE - 2}
      height={GRID_SIZE - 2}
      initial={{ fill: "transparent", opacity: 0 }}
      animate={{ 
        fill: active ? "#10b981" : "transparent",
        opacity: active ? [0.4, 0] : 0 
      }}
      transition={{ 
        duration: active ? 0.8 : 0.4,
        ease: "easeOut" 
      }}
    />
  );
};
