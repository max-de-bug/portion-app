"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Bot, Cloud, Server } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Service nodes with generic icons instead of brand names
const MERCHANT_NODES = [
  { id: "ai", icon: Bot, hint: "AI Services", x: 88, y: 20 },
  { id: "cloud", icon: Cloud, hint: "Cloud Infra", x: 92, y: 35 },
  { id: "data", icon: Server, hint: "Data Services", x: 88, y: 50 },
] as const;

const PRINCIPAL_NODES = [
  { id: "p1", x: 8, y: 20 },
  { id: "p2", x: 12, y: 35 },
  { id: "p3", x: 8, y: 50 },
] as const;

// Lightning bolt path generator - memoized outside component
const generateLightningPath = (startX: number, startY: number, endX: number, endY: number) => {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const offset1 = (Math.random() - 0.5) * 8;
  const offset2 = (Math.random() - 0.5) * 8;
  return `M ${startX} ${startY} L ${midX + offset1} ${midY + offset2} L ${endX} ${endY}`;
};

export const InteractiveHero = memo(function InteractiveHero() {
  const [isDetected, setIsDetected] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState<string | null>(null);
  const [lightningPhase, setLightningPhase] = useState(0); // 0: none, 1: incoming, 2: outgoing
  const [lightningPaths, setLightningPaths] = useState<{incoming: string[], outgoing: string[]}>({ incoming: [], outgoing: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  
  // Performance: Check reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Custom Cursor Logic with springs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  // Lightning animation sequence with cleanup
  useEffect(() => {
    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) return;

    const triggerLightning = () => {
      // Generate new lightning paths
      const incoming = PRINCIPAL_NODES.map(node => 
        generateLightningPath(node.x, node.y, 50, 35)
      );
      const outgoing = MERCHANT_NODES.map(merchant => 
        generateLightningPath(50, 35, merchant.x, merchant.y)
      );
      setLightningPaths({ incoming, outgoing });
      
      // Phase 1: Lightning from dots to center
      setLightningPhase(1);
      
      // Phase 2: Lightning from center to service circles
      const phase2Timeout = setTimeout(() => {
        setLightningPhase(2);
      }, 600);
      
      // Reset
      const resetTimeout = setTimeout(() => {
        setLightningPhase(0);
      }, 1400);

      return () => {
        clearTimeout(phase2Timeout);
        clearTimeout(resetTimeout);
      };
    };

    // Initial trigger
    const initialTimeout = setTimeout(triggerLightning, 2000);
    
    // Repeat every 8 seconds
    const interval = setInterval(triggerLightning, 8000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [prefersReducedMotion]);

  // Optimized mouse tracking with RAF throttling and passive listener
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Cancel previous RAF if pending
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
      rafId.current = null;
    });
  }, [mouseX, mouseY]);

  useEffect(() => {
    // Use passive listener for better scroll performance
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      // Cleanup any pending RAF
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleMouseMove]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#f0fdf4] flex items-center justify-center transition-colors duration-1000"
    >
      {/* Background Grid - Soft Emerald */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
          backgroundSize: "50px 50px"
        }} 
      />

      {/* Radial Background Glow - Enhanced */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.15),transparent_60%)]" />

      {/* Custom Cursor Glow - More dynamic */}
      <motion.div
        className="absolute w-80 h-80 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-[0.12] rounded-full blur-[100px] pointer-events-none z-0"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full max-w-[1400px] preserve-3d"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="lightning-glow">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="intense-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform="translate(0, 0)"> 
          {/* Subtle base connections */}
          {PRINCIPAL_NODES.map((node) => (
            <motion.path
              key={`p-v-${node.id}`}
              d={`M ${node.x} ${node.y} L 50 35`}
              stroke="#d1fae5"
              strokeWidth="0.2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          ))}

          {/* Principal Nodes (Left) - Energy Sources */}
          {PRINCIPAL_NODES.map((node, idx) => (
            <motion.g key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Outer ring */}
              <motion.circle 
                cx={node.x} 
                cy={node.y} 
                r="2" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="0.15"
                animate={{ 
                  scale: lightningPhase === 1 ? [1, 1.5, 1] : 1,
                  opacity: lightningPhase === 1 ? [0.3, 1, 0.3] : 0.3
                }}
                transition={{ duration: 0.4 }}
              />
              {/* Core dot */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="1"
                fill={lightningPhase === 1 ? "#10b981" : "white"}
                stroke="#10b981"
                strokeWidth="0.3"
                filter={lightningPhase === 1 ? "url(#intense-glow)" : "none"}
                animate={{ 
                  scale: lightningPhase === 1 ? [1, 1.8, 1] : [1, 1.2, 1],
                  fill: lightningPhase === 1 ? "#10b981" : "#ffffff"
                }}
                transition={{ duration: lightningPhase === 1 ? 0.3 : 2, repeat: lightningPhase === 1 ? 0 : Infinity }}
              />
            </motion.g>
          ))}

          {/* Lightning bolts - Incoming to center */}
          <AnimatePresence>
            {lightningPhase >= 1 && lightningPaths.incoming.map((path, idx) => (
              <motion.path
                key={`lightning-in-${idx}`}
                d={path}
                stroke="#34d399"
                strokeWidth="0.8"
                fill="none"
                filter="url(#lightning-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />
            ))}
          </AnimatePresence>

          {/* Lightning bolts - Outgoing to merchants */}
          <AnimatePresence>
            {lightningPhase === 2 && lightningPaths.outgoing.map((path, idx) => (
              <motion.path
                key={`lightning-out-${idx}`}
                d={path}
                stroke="#34d399"
                strokeWidth="0.8"
                fill="none"
                filter="url(#lightning-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              />
            ))}
          </AnimatePresence>

          {/* Yield Flows (Vault to Merchants) - Subtle lines */}
          {MERCHANT_NODES.map((merchant) => (
            <g key={`v-m-path-${merchant.id}`}>
              <motion.path
                d={`M 50 35 L ${merchant.x} ${merchant.y}`}
                stroke={isDetected ? "#10b98133" : "#d1fae5"}
                strokeWidth="0.3"
                fill="none"
              />
              {isDetected && (
                <motion.path
                  d={`M 50 35 L ${merchant.x} ${merchant.y}`}
                  stroke="#10b981"
                  strokeWidth="0.5"
                  fill="none"
                  strokeDasharray="1, 4"
                  animate={{ strokeDashoffset: [0, -20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  filter="url(#glow)"
                />
              )}
            </g>
          ))}

          {/* Central Vault Hub */}
          <motion.g
            onHoverStart={() => setIsDetected(true)}
            onHoverEnd={() => setIsDetected(false)}
            className="cursor-pointer"
            initial={{ scale: 0, y: 35 }}
            animate={{ scale: 1, x: 50, y: 35 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Outer rotating ring */}
            <motion.circle
              r="9"
              fill="none"
              stroke="#10b981"
              strokeWidth="0.15"
              strokeDasharray="2, 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Energy burst on lightning hit */}
            <motion.circle 
              r="8"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              animate={{
                scale: lightningPhase === 1 ? [0.8, 1.5] : 1,
                opacity: lightningPhase === 1 ? [0.8, 0] : 0
              }}
              transition={{ duration: 0.5 }}
              filter="url(#intense-glow)"
            />
            
            {/* Pulsing Core Background */}
            <motion.circle 
              r="6" 
              fill="white" 
              stroke="#10b981" 
              strokeWidth="0.5" 
              animate={{
                scale: lightningPhase >= 1 ? [1, 1.15, 1] : [1, 1.05, 1],
                strokeWidth: lightningPhase >= 1 ? [0.5, 2, 0.5] : [0.5, 0.8, 0.5],
              }}
              transition={{ duration: lightningPhase >= 1 ? 0.4 : 2, ease: "easeInOut", repeat: lightningPhase >= 1 ? 0 : Infinity }} 
            />
            
            {/* Central Content - P Logo */}
            <motion.g 
              animate={{ scale: isDetected || lightningPhase >= 1 ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <foreignObject x="-3" y="-3" width="6" height="6">
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shadow-md transition-all duration-300 ${
                      isDetected || lightningPhase >= 1 
                        ? 'bg-gradient-to-br from-[#022c22] to-[#065f46] shadow-emerald-500/50' 
                        : 'bg-emerald-100'
                    }`}
                    animate={{ 
                      filter: isDetected || lightningPhase >= 1 ? "drop-shadow(0 0 8px rgba(16,185,129,0.6))" : "none"
                    }}
                  >
                    <span className={`font-serif text-xs font-bold italic leading-none pt-0.5 pr-px transition-colors duration-300 ${
                      isDetected || lightningPhase >= 1 ? 'text-emerald-50' : 'text-emerald-400'
                    }`}>P</span>
                  </motion.div>
                </div>
              </foreignObject>
            </motion.g>

            <motion.text
              y="12"
              textAnchor="middle"
              fill="#064e3b"
              fontSize="2"
              className="font-black tracking-[0.2em] uppercase pointer-events-none"
              animate={{ opacity: isDetected ? 1 : 0.6, y: isDetected ? 13 : 12 }}
            >
              {isDetected ? "FLOWS ACTIVE" : "DETECT YIELD"}
            </motion.text>
          </motion.g>

          {/* Merchant Nodes (Right) - Services with hints only */}
          {MERCHANT_NODES.map((merchant, idx) => (
            <motion.g
              key={merchant.id}
              onHoverStart={() => setActiveMerchant(merchant.id)}
              onHoverEnd={() => setActiveMerchant(null)}
              className="cursor-pointer"
            >
              {/* Hit flash effect */}
              <motion.circle
                cx={merchant.x}
                cy={merchant.y}
                r="5"
                fill="#34d399"
                animate={{
                  scale: lightningPhase === 2 ? [0.5, 1.5] : 0,
                  opacity: lightningPhase === 2 ? [0.6, 0] : 0
                }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                filter="url(#intense-glow)"
              />
              
              <motion.circle
                cx={merchant.x}
                cy={merchant.y}
                r="3.5"
                fill="white"
                stroke={activeMerchant === merchant.id || lightningPhase === 2 ? "#10b981" : "#d1fae5"}
                strokeWidth="0.5"
                animate={{ 
                  scale: activeMerchant === merchant.id ? 1.2 : lightningPhase === 2 ? [1, 1.15, 1] : 1,
                  filter: activeMerchant === merchant.id || lightningPhase === 2 ? "url(#glow)" : "none"
                }}
                transition={{ duration: lightningPhase === 2 ? 0.3 : 0.2 }}
              />
              <foreignObject x={merchant.x - 1.75} y={merchant.y - 1.75} width="3.5" height="3.5">
                <div className="w-full h-full flex items-center justify-center text-emerald-600">
                  <merchant.icon className={`w-2.5 h-2.5 transition-colors ${
                    activeMerchant === merchant.id || lightningPhase === 2 ? 'text-emerald-500' : 'text-emerald-300'
                  }`} />
                </div>
              </foreignObject>
              
              {/* Hint text instead of brand name - only on hover */}
              <AnimatePresence>
                {activeMerchant === merchant.id && (
                  <motion.text
                    x={merchant.x}
                    y={merchant.y + 6}
                    textAnchor="middle"
                    fill="#064e3b"
                    fontSize="1.5"
                    className="font-medium tracking-wide"
                    initial={{ opacity: 0, y: merchant.y + 4 }}
                    animate={{ opacity: 1, y: merchant.y + 6 }}
                    exit={{ opacity: 0 }}
                  >
                    {merchant.hint}
                  </motion.text>
                )}
              </AnimatePresence>
            </motion.g>
          ))}
        </g>
      </svg>

      {/* Side HUDs */}
      <AnimatePresence>
        {isDetected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-[35%] right-8 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-10"
          >
            <div className="p-4 bg-white/90 border border-emerald-200 rounded-2xl backdrop-blur-xl shadow-lg">
              <p className="text-[10px] text-emerald-600 font-black tracking-widest uppercase mb-1">Detected Yield</p>
              <p className="text-xl font-mono text-emerald-950 tracking-tighter font-black">$8,432.50<span className="text-xs text-emerald-500 ml-2 font-black">+10.3%</span></p>
            </div>
            
            <motion.div 
               animate={{ y: [0, -4, 0] }}
               transition={{ duration: 2.5, repeat: Infinity }}
               className="p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl backdrop-blur-xl shadow-sm"
            >
              <p className="text-[10px] text-emerald-600 font-black tracking-widest uppercase mb-1">Autonomous Flow</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-bold text-emerald-800 italic">Payments executing...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Vignettes */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(16,185,129,0.05)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f0fdf4] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#f0fdf4] to-transparent pointer-events-none" />
    </div>
  );
});

