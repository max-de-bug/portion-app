"use client";

/**
 * Pool Dashboard
 * 
 * Concentrated Liquidity Pool Dashboard with premium UI
 * Features interactive liquidity bin visualization, stats, and position management
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PoolStatCard } from "@/app/dashboard/_components/PoolStatCard";
import { LiquidityBinsChart } from "@/app/dashboard/_components/LiquidityBinsChart";
import { AddLiquidityModal } from "@/app/dashboard/_components/AddLiquidityModal";
import { RemoveLiquidityModal } from "@/app/dashboard/_components/RemoveLiquidityModal";
import {
  TrendingUp,
  Wallet,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Info,
  Sparkles,
  Zap,
  Shield,
  Target,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

// Mock data for demonstration
const MOCK_POOLS = [
  { id: "solo-usdv", name: "SOLO / USDV", token: "SOLO", base: "USDV", price: 1.25 },
  { id: "solo-sol", name: "SOLO / SOL", token: "SOLO", base: "SOL", price: 0.0068 },
  { id: "usdv-usdc", name: "USDV / USDC", token: "USDV", base: "USDC", price: 1.00 },
  { id: "sol-usdc", name: "SOL / USDC", token: "SOL", base: "USDC", price: 185.42 },
  { id: "bonk-sol", name: "BONK / SOL", token: "BONK", base: "SOL", price: 0.000024 },
];

const generateMockBins = (basePrice: number) => {
  const bins = [];
  const binWidth = 0.5; // 0.5% price range per bin
  const numBins = 40;
  const centerBin = Math.floor(numBins / 2);
  
  for (let i = 0; i < numBins; i++) {
    const distFromCenter = Math.abs(i - centerBin);
    const priceMin = basePrice * (1 + (i - centerBin - 0.5) * binWidth / 100);
    const priceMax = basePrice * (1 + (i - centerBin + 0.5) * binWidth / 100);
    
    // Liquidity follows a normal-ish distribution centered on current price
    const baseLiquidity = Math.max(0, 50000 - distFromCenter * distFromCenter * 200);
    const randomVariance = Math.random() * 10000;
    const liquidity = Math.floor(baseLiquidity + randomVariance);
    
    bins.push({
      id: i,
      priceMin: basePrice > 1 ? Math.round(priceMin * 100) / 100 : Number(priceMin.toFixed(6)),
      priceMax: basePrice > 1 ? Math.round(priceMax * 100) / 100 : Number(priceMax.toFixed(6)),
      liquidity,
      isCurrentPrice: i === centerBin,
      userLiquidity: i >= centerBin - 3 && i <= centerBin + 3 ? Math.floor(liquidity * 0.15) : undefined,
    });
  }
  
  return bins;
};

export default function PoolDashboardPage() {
  const [selectedPool, setSelectedPool] = useState(MOCK_POOLS[0]);
  const [showPoolSelector, setShowPoolSelector] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const currentPrice = selectedPool.price;
  const bins = useMemo(() => generateMockBins(currentPrice), [currentPrice]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Mock stats
  const stats = {
    tvl: 2450000,
    volume24h: 1250000,
    apr: 42.5,
    activePositions: 3,
    userTVL: 12500,
    fees24h: 45.32,
  };

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
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
            {/* Pool Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPoolSelector(!showPoolSelector)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-white/20 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-background" />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-background" />
                </div>
                <span className="font-bold text-sm">{selectedPool.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showPoolSelector ? "rotate-180" : ""}`} />
              </button>

              {showPoolSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {MOCK_POOLS.map((pool) => (
                    <button
                      key={pool.id}
                      onClick={() => {
                        setSelectedPool(pool);
                        setShowPoolSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedPool.id === pool.id ? "bg-emerald-500/10" : ""
                      }`}
                    >
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border border-background" />
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border border-background" />
                      </div>
                      <span className="font-medium text-sm">{pool.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Network Badge */}
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Devnet
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-white/20 dark:border-zinc-800/50 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PoolStatCard
            title="Total Value Locked"
            value={stats.tvl}
            prefix="$"
            icon={Wallet}
            trend={{ value: 12.5, isPositive: true }}
            gradient="from-emerald-500 to-teal-500"
            delay={0}
          />
          <PoolStatCard
            title="24h Volume"
            value={stats.volume24h}
            prefix="$"
            icon={Activity}
            trend={{ value: 8.2, isPositive: true }}
            gradient="from-blue-500 to-cyan-500"
            delay={0.1}
          />
          <PoolStatCard
            title="Pool APR"
            value={stats.apr}
            suffix="%"
            icon={TrendingUp}
            trend={{ value: 2.3, isPositive: true }}
            gradient="from-purple-500 to-indigo-500"
            delay={0.2}
          />
          <PoolStatCard
            title="Active Positions"
            value={stats.activePositions}
            icon={Layers}
            gradient="from-amber-500 to-orange-500"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Liquidity Bins Chart - Takes 2 columns */}
          <div className="xl:col-span-2">
            <LiquidityBinsChart
              bins={bins}
              currentPrice={currentPrice}
              tokenA={selectedPool.token}
              tokenB={selectedPool.base}
            />
          </div>

          {/* Position Management Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4"
          >
            {/* Your Position Card */}
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Your Position</h3>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Active
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-mono font-bold">${stats.userTVL.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">24h Fees Earned</span>
                    <span className="font-mono font-bold text-emerald-500">+${stats.fees24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price Range</span>
                    <span className="font-mono text-sm">$182.50 - $188.30</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Add Liquidity
                  </button>
                  <button 
                    onClick={() => setShowRemoveModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-bold text-sm hover:bg-muted/80 transition-all active:scale-[0.98]"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl">
              <h3 className="font-bold text-lg mb-4">Pool Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Bin Step</span>
                  <span className="font-mono font-bold">10 bps</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Base Fee</span>
                  <span className="font-mono font-bold">0.25%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Protocol</span>
                  <span className="font-mono font-bold flex items-center gap-1">
                    Meteora
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>


        {/* About Concentrated Liquidity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-white/80 to-white/40 dark:from-zinc-900/80 dark:to-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-2">About Concentrated Liquidity</h2>
              <p className="text-muted-foreground max-w-2xl">
                Concentrated Liquidity Pools allow you to provide liquidity within specific price ranges, enabling 
                <strong className="text-foreground"> zero-slippage trades</strong> within price bins.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Concentrated Liquidity</h4>
                <p className="text-sm text-muted-foreground">
                  Provide liquidity in specific price ranges for higher capital efficiency
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Zero Slippage</h4>
                <p className="text-sm text-muted-foreground">
                  Trades within the same bin experience no slippage at all
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-bold mb-1">Dynamic Fees</h4>
                <p className="text-sm text-muted-foreground">
                  Fees adjust based on market volatility to protect LPs
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AddLiquidityModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        pool={selectedPool} 
      />
      <RemoveLiquidityModal 
        isOpen={showRemoveModal} 
        onClose={() => setShowRemoveModal(false)} 
        pool={selectedPool} 
      />
    </main>
  );
}
