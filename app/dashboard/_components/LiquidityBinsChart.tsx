"use client";

/**
 * Liquidity Bins Chart
 * 
 * Interactive SVG-based visualization of DLMM liquidity distribution
 * Shows price bins with liquidity depth and current price indicator
 */

import { motion } from "framer-motion";
import { useState, useMemo } from "react";

interface LiquidityBin {
  id: number;
  priceMin: number;
  priceMax: number;
  liquidity: number;
  isCurrentPrice: boolean;
  userLiquidity?: number;
}

interface LiquidityBinsChartProps {
  bins: LiquidityBin[];
  currentPrice: number;
  tokenA: string;
  tokenB: string;
  className?: string;
}

export const LiquidityBinsChart = ({
  bins,
  currentPrice,
  tokenA,
  tokenB,
  className = "",
}: LiquidityBinsChartProps) => {
  const [hoveredBin, setHoveredBin] = useState<LiquidityBin | null>(null);

  // Calculate max liquidity for scaling
  const maxLiquidity = useMemo(() => 
    Math.max(...bins.map(b => b.liquidity), 1),
    [bins]
  );

  // Chart dimensions
  const chartHeight = 280;
  const chartWidth = 100; // percentage
  const binGap = 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`relative p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Liquidity Distribution</h3>
          <p className="text-sm text-muted-foreground">
            {tokenA}/{tokenB} • Current: ${currentPrice.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-teal-500" />
            <span className="text-muted-foreground">Pool Liquidity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-indigo-500" />
            <span className="text-muted-foreground">Your Position</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] text-muted-foreground font-mono">
          <span>${(maxLiquidity / 1000).toFixed(0)}K</span>
          <span>${(maxLiquidity / 2000).toFixed(0)}K</span>
          <span>$0</span>
        </div>

        {/* Bins Container */}
        <div className="ml-14 h-full flex items-end gap-[2px]">
          {bins.map((bin, index) => {
            const height = (bin.liquidity / maxLiquidity) * 100;
            const userHeight = bin.userLiquidity 
              ? (bin.userLiquidity / maxLiquidity) * 100 
              : 0;
            
            return (
              <motion.div
                key={bin.id}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                className="relative flex-1 min-w-[8px] max-w-[40px] group cursor-pointer"
                onMouseEnter={() => setHoveredBin(bin)}
                onMouseLeave={() => setHoveredBin(null)}
              >
                {/* Pool Liquidity Bar */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-200 ${
                    bin.isCurrentPrice 
                      ? "bg-gradient-to-t from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/30" 
                      : "bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300"
                  }`}
                  style={{ height: '100%' }}
                />
                
                {/* User Liquidity Overlay */}
                {userHeight > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${userHeight}%` }}
                    transition={{ duration: 0.5, delay: index * 0.02 + 0.3 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t-sm opacity-80"
                  />
                )}

                {/* Current Price Indicator */}
                {bin.isCurrentPrice && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-2 py-1 rounded bg-amber-500 text-[10px] font-bold text-white whitespace-nowrap shadow-lg"
                    >
                      ${currentPrice.toLocaleString()}
                    </motion.div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-500" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="ml-14 mt-2 flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>${bins[0]?.priceMin.toLocaleString()}</span>
          <span>${bins[Math.floor(bins.length / 2)]?.priceMin.toLocaleString()}</span>
          <span>${bins[bins.length - 1]?.priceMax.toLocaleString()}</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredBin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 p-4 rounded-xl bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-lg border border-zinc-700/50 shadow-xl text-sm"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-8">
              <span className="text-zinc-400">Price Range</span>
              <span className="font-mono text-white">
                ${hoveredBin.priceMin.toLocaleString()} - ${hoveredBin.priceMax.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-zinc-400">Liquidity</span>
              <span className="font-mono text-emerald-400">
                ${hoveredBin.liquidity.toLocaleString()}
              </span>
            </div>
            {hoveredBin.userLiquidity && (
              <div className="flex items-center justify-between gap-8">
                <span className="text-zinc-400">Your Position</span>
                <span className="font-mono text-purple-400">
                  ${hoveredBin.userLiquidity.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
