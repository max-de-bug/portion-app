"use client";

import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { MOCK_POOLS } from "../_mock/data";

interface PoolSelectorProps {
  selectedPool: typeof MOCK_POOLS[0];
  onSelect: (pool: typeof MOCK_POOLS[0]) => void;
}

/**
 * Memoized Pool Selection dropdown for the Header.
 * Prevents re-renders of the entire dashboard when the dropdown is toggled.
 */
export const PoolSelector = memo(({ selectedPool, onSelect }: PoolSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-white/20 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-background" />
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-background" />
        </div>
        <span className="font-bold text-sm tracking-tight">{selectedPool.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {MOCK_POOLS.map((pool) => (
                <button
                  key={pool.id}
                  onClick={() => {
                    onSelect(pool);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    selectedPool.id === pool.id 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border border-background" />
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border border-background" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider">{pool.name}</span>
                  </div>
                  {selectedPool.id === pool.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

PoolSelector.displayName = "PoolSelector";
