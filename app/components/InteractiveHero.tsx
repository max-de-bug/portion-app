"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Zap, Shield, Wallet, CreditCard, Cpu, Globe, Database } from "lucide-react";

const MERCHANT_NODES = [
  { id: "openai", icon: Cpu, label: "OpenAI", x: 88, y: 60 },
  { id: "aws", icon: Globe, label: "AWS", x: 92, y: 75 },
  { id: "vercel", icon: Database, label: "Vercel", x: 88, y: 90 },
];

const PRINCIPAL_NODES = [
  { id: "p1", x: 8, y: 60 },
  { id: "p2", x: 12, y: 75 },
  { id: "p3", x: 8, y: 90 },
];

export const InteractiveHero = () => {
  const [isDetected, setIsDetected] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom Cursor Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Periodic Animation Logic for "Striking" Pulse (every 10s)
  const [pulseTrigger, setPulseTrigger] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTrigger(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#f0fdf4] flex items-center justify-center transition-colors duration-1000"
    >
      {/* Background Grid - Soft Emerald */}
      <div 
        className="absolute inset-0 opacity-[0.2]" 
        style={{ 
          backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`,
          backgroundSize: "50px 50px"
        }} 
      />

      {/* Radial Background Glow - Subtle Light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />

      {/* Custom Cursor Glow */}
      <motion.div
        className="absolute w-64 h-64 bg-[#10b981] opacity-[0.15] rounded-full blur-[80px] pointer-events-none z-0"
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
        </defs>

        {/* Vault Center Positioned lower (y=75) to avoid overlap with hero text */}
        <g transform="translate(0, 0)"> 
          {/* Connections from Principal to Vault */}
          {PRINCIPAL_NODES.map((node) => (
            <motion.path
              key={`p-v-${node.id}`}
              d={`M ${node.x} ${node.y} L 50 75`}
              stroke="#d1fae5"
              strokeWidth="0.2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          ))}

          {/* Principal Nodes (Left) */}
          {PRINCIPAL_NODES.map((node) => (
            <motion.g key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <circle cx={node.x} cy={node.y} r="1.2" fill="white" stroke="#10b981" strokeWidth="0.2" />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="0.5"
                fill="#10b981"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
                filter="url(#glow)"
              />
            </motion.g>
          ))}

          {/* Yield Flows (Vault to Merchants) */}
          {MERCHANT_NODES.map((merchant) => (
            <g key={`v-m-path-${merchant.id}`}>
              <motion.path
                d={`M 50 75 L ${merchant.x} ${merchant.y}`}
                stroke={isDetected ? "#10b98133" : "#d1fae5"}
                strokeWidth="0.3"
                fill="none"
              />
              {isDetected && (
                <motion.path
                  d={`M 50 75 L ${merchant.x} ${merchant.y}`}
                  stroke="#10b981"
                  strokeWidth="0.5"
                  fill="none"
                  strokeDasharray="1, 4"
                  animate={{ strokeDashoffset: [0, -20] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  filter="url(#glow)"
                />
              )}
            </g>
          ))}


          {/* Central Vault Hub - Lowered to 75% Y */}
          <motion.g
            onHoverStart={() => setIsDetected(true)}
            onHoverEnd={() => setIsDetected(false)}
            className="cursor-pointer"
            initial={{ scale: 0, y: 75 }}
            animate={{ scale: 1, x: 50, y: 75 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <motion.circle
              r="7"
              fill="none"
              stroke="#10b981"
              strokeWidth="0.2"
              strokeDasharray="2, 3"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            
            <motion.circle 
                r="5" 
                fill="white" 
                stroke="#10b981" 
                strokeWidth="0.5" 
                animate={{
                    scale: [1, 1.2, 1, 1.2, 1],
                    strokeWidth: [0.5, 2, 0.5, 2, 0.5],
                    filter: ["none", "drop-shadow(0 0 8px rgba(16,185,129,0.8))", "none", "drop-shadow(0 0 15px rgba(16,185,129,1))", "none"]
                }}
                transition={{ duration: 1.5, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 1] }} 
                key={pulseTrigger} // Trigger animation on key change
            />
            
            <motion.g animate={{ scale: isDetected ? 1.15 : 1 }}>
              <foreignObject x="-3.5" y="-3.5" width="7" height="7">
                <div className="w-full h-full flex items-center justify-center">
                  <Shield className={`w-4 h-4 transition-colors duration-500 ${isDetected ? 'text-emerald-500' : 'text-emerald-300'}`} />
                </div>
              </foreignObject>
            </motion.g>

            <motion.text
              y="10"
              textAnchor="middle"
              fill="#064e3b"
              fontSize="2"
              className="font-black tracking-[0.2em] uppercase pointer-events-none"
              animate={{ opacity: isDetected ? 1 : 0.4 }}
            >
              {isDetected ? "FLOWS ACTIVE" : "DETECT YIELD"}
            </motion.text>
          </motion.g>

          {/* Merchant Nodes (Right) */}
          {MERCHANT_NODES.map((merchant) => (
            <motion.g
              key={merchant.id}
              onHoverStart={() => setActiveMerchant(merchant.id)}
              onHoverEnd={() => setActiveMerchant(null)}
              className="cursor-pointer"
            >
              <motion.circle
                cx={merchant.x}
                cy={merchant.y}
                r="3.5"
                fill="white"
                stroke={activeMerchant === merchant.id ? "#10b981" : "#d1fae5"}
                strokeWidth="0.5"
                animate={{ 
                  scale: activeMerchant === merchant.id ? 1.2 : 1,
                  stroke: activeMerchant === merchant.id ? "#10b981" : "#d1fae5"
                }}
              />
              <foreignObject x={merchant.x - 1.75} y={merchant.y - 1.75} width="3.5" height="3.5">
                <div className="w-full h-full flex items-center justify-center text-emerald-600">
                  <merchant.icon className={`w-2.5 h-2.5 transition-colors ${activeMerchant === merchant.id ? 'text-emerald-500' : 'text-emerald-300'}`} />
                </div>
              </foreignObject>
              
              <motion.text
                x={merchant.x}
                y={merchant.y + 6}
                textAnchor="middle"
                fill={activeMerchant === merchant.id ? "#064e3b" : "#6ee7b7"}
                fontSize="1.8"
                className="font-black uppercase tracking-widest"
              >
                {merchant.label}
              </motion.text>
            </motion.g>
          ))}
        </g>
      </svg>

      {/* Side HUDs - Updated to Light Emerald Theme */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-10">
        {/* Removed Total Principal HUD as requested */}
      </div>

      <AnimatePresence>
        {isDetected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-10"
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

      {/* Screen Vignettes - Light Theme */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(16,185,129,0.05)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#f0fdf4] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#f0fdf4] to-transparent pointer-events-none" />
    </div>
  );
};
