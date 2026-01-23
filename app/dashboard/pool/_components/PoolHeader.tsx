"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Layers, RefreshCcw } from "lucide-react";
import { PoolSelector } from "./PoolSelector";
import { MOCK_POOLS } from "../_mock/data";

interface PoolHeaderProps {
  selectedPool: typeof MOCK_POOLS[0];
  onPoolSelect: (pool: typeof MOCK_POOLS[0]) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

/**
 * Header section of the Pool Dashboard.
 * Strictly memoized to avoid re-rendering of the entire page layout.
 */
export const PoolHeader = memo(({ 
  selectedPool, 
  onPoolSelect, 
  isRefreshing, 
  onRefresh 
}: PoolHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-background"
          />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Pool Dashboard
            <Sparkles className="w-6 h-6 text-emerald-500" />
          </h1>
          <p className="text-muted-foreground text-sm">
            Concentrated Liquidity Pools on Solana
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PoolSelector 
          selectedPool={selectedPool} 
          onSelect={onPoolSelect} 
        />

        <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          Devnet
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-white/20 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </motion.div>
  );
});

PoolHeader.displayName = "PoolHeader";
