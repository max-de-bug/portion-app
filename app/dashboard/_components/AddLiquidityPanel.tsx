"use client";

/**
 * AddLiquidityPanel - Inline Dashboard Component
 * 
 * Meteora/Orca-style inline liquidity management panel with:
 * - Tabbed interface (Your Positions | Add Position | Closed)
 * - Integrated price range picker with histogram
 * - Strategy selection (Spot/Curve/Bid-Ask)
 * - Deposit amount inputs with balance display
 */

import { useState, useCallback, useMemo, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Target,
  BarChart3,
  TrendingUp,
  ArrowLeftRight,
  RotateCcw,
  Zap,
  Info,
  Wallet,
  RefreshCcw,
  ChevronRight,
  Layers,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Pool {
  id: string;
  name: string;
  token: string;
  base: string;
  price: number;
}

interface AddLiquidityPanelProps {
  pool: Pool;
  onRefresh?: () => void;
  onRemovePosition?: () => void;
}

interface Position {
  id: string;
  minPrice: number;
  maxPrice: number;
  liquidity: number;
  fees24h: number;
  inRange: boolean;
}

type Tab = "positions" | "add" | "closed";
type VolatilityStrategy = "spot" | "curve" | "bidAsk";

// ============================================================================
// Constants
// ============================================================================

const VOLATILITY_STRATEGIES = [
  { 
    id: "spot" as const, 
    name: "Spot", 
    icon: BarChart3, 
    description: "Uniform distribution. Versatile for any market."
  },
  { 
    id: "curve" as const, 
    name: "Curve", 
    icon: TrendingUp, 
    description: "Concentrated in middle. Ideal for stable pairs."
  },
  { 
    id: "bidAsk" as const, 
    name: "Bid-Ask", 
    icon: ArrowLeftRight, 
    description: "Heavier at edges. Good for volatile markets."
  },
];

const RANGE_PRESETS = [
  { label: "±1%", value: 0.01 },
  { label: "±5%", value: 0.05 },
  { label: "±10%", value: 0.10 },
  { label: "±25%", value: 0.25 },
  { label: "Full", value: 0.50 },
];

const DEFAULT_NUM_BINS = 40;

// Mock positions for demo
const MOCK_POSITIONS: Position[] = [
  { id: "1", minPrice: 1.12, maxPrice: 1.38, liquidity: 5000, fees24h: 12.50, inRange: true },
  { id: "2", minPrice: 1.00, maxPrice: 1.20, liquidity: 2500, fees24h: 4.20, inRange: false },
];

// ============================================================================
// Sub-Components
// ============================================================================

/** Tab Navigation */
const TabNav = memo(({ activeTab, onTabChange }: { 
  activeTab: Tab; 
  onTabChange: (tab: Tab) => void;
}) => {
  const tabs = [
    { id: "positions" as const, label: "Your Positions", count: 2 },
    { id: "add" as const, label: "Add Position", count: null },
    { id: "closed" as const, label: "Closed", count: 0 },
  ];

  return (
    <div className="flex border-b border-white/10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === tab.id
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.label}
            {tab.count !== null && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}>
                {tab.count}
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          )}
        </button>
      ))}
    </div>
  );
});
TabNav.displayName = "TabNav";

/** Position Card for "Your Positions" tab */
const PositionCard = memo(({ position, tokenA, tokenB, onManage }: { 
  position: Position; 
  tokenA: string;
  tokenB: string;
  onManage?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-xl bg-zinc-800/50 border border-white/5 space-y-3"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border border-zinc-900" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border border-zinc-900" />
        </div>
        <span className="text-sm font-bold text-white">{tokenA}/{tokenB}</span>
      </div>
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
        position.inRange
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-amber-500/20 text-amber-400"
      }`}>
        {position.inRange ? "In Range" : "Out of Range"}
      </span>
    </div>
    
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <span className="text-zinc-500">Price Range</span>
        <p className="font-mono font-bold text-white">
          ${position.minPrice.toFixed(2)} - ${position.maxPrice.toFixed(2)}
        </p>
      </div>
      <div>
        <span className="text-zinc-500">Liquidity</span>
        <p className="font-mono font-bold text-white">
          ${position.liquidity.toLocaleString()}
        </p>
      </div>
      <div>
        <span className="text-zinc-500">24h Fees</span>
        <p className="font-mono font-bold text-emerald-400">
          +${position.fees24h.toFixed(2)}
        </p>
      </div>
      <div className="flex items-end">
        <button 
          onClick={onManage}
          className="w-full py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[11px] font-medium transition-colors"
        >
          Manage
        </button>
      </div>
    </div>
  </motion.div>
));
PositionCard.displayName = "PositionCard";

/** Histogram Bin Visualization */
const BinHistogram = memo(({ 
  bins, 
  currentPrice, 
  minPrice, 
  maxPrice, 
  priceBounds,
  onDragMin,
  onDragMax,
}: { 
  bins: Array<{ id: number; liquidity: number; isInRange: boolean; isCurrentPrice: boolean }>;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  priceBounds: { min: number; max: number };
  onDragMin?: (price: number) => void;
  onDragMax?: (price: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maxLiquidity = Math.max(...bins.map(b => b.liquidity), 1);
  
  const currentPricePosition = ((currentPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;
  const minPricePosition = ((minPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;
  const maxPricePosition = ((maxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;
  
  return (
    <div 
      ref={containerRef}
      className="relative h-28 rounded-xl bg-zinc-800/50 border border-white/5 overflow-hidden"
    >
      {/* Current Price Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20"
        style={{ left: `${currentPricePosition}%` }}
      >
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full" />
      </div>

      {/* Bins */}
      <div className="absolute inset-0 flex items-end px-1 pb-1 pt-3">
        {bins.map((bin) => (
          <motion.div
            key={bin.id}
            initial={{ height: 0 }}
            animate={{ height: `${(bin.liquidity / maxLiquidity) * 100}%` }}
            transition={{ duration: 0.3, delay: bin.id * 0.003 }}
            className={`flex-1 mx-[0.5px] rounded-t-sm ${
              bin.isInRange
                ? bin.isCurrentPrice
                  ? "bg-gradient-to-t from-amber-500 to-yellow-400"
                  : "bg-gradient-to-t from-emerald-500/80 to-teal-400/80"
                : "bg-zinc-700/30"
            }`}
          />
        ))}
      </div>

      {/* Range Overlay */}
      <div 
        className="absolute top-0 bottom-0 bg-emerald-500/10 border-l-2 border-r-2 border-emerald-500/50 pointer-events-none"
        style={{
          left: `${minPricePosition}%`,
          width: `${maxPricePosition - minPricePosition}%`,
        }}
      />
      
      {/* Min Handle */}
      <div 
        className="absolute top-0 bottom-0 w-4 cursor-ew-resize z-30 group"
        style={{ left: `calc(${minPricePosition}% - 8px)` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />
      </div>
      
      {/* Max Handle */}
      <div 
        className="absolute top-0 bottom-0 w-4 cursor-ew-resize z-30 group"
        style={{ left: `calc(${maxPricePosition}% - 8px)` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors" />
      </div>
    </div>
  );
});
BinHistogram.displayName = "BinHistogram";

// ============================================================================
// Main Component
// ============================================================================

export const AddLiquidityPanel = memo(({ pool, onRefresh, onRemovePosition }: AddLiquidityPanelProps) => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [strategy, setStrategy] = useState<VolatilityStrategy>("spot");
  const [tokenAAmount, setTokenAAmount] = useState("");
  const [tokenBAmount, setTokenBAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Price range state
  const [minPrice, setMinPrice] = useState(pool.price * 0.9);
  const [maxPrice, setMaxPrice] = useState(pool.price * 1.1);
  const [numBins, setNumBins] = useState(DEFAULT_NUM_BINS);
  
  // Update range when pool changes
  useEffect(() => {
    setMinPrice(pool.price * 0.9);
    setMaxPrice(pool.price * 1.1);
  }, [pool.price]);

  // Price bounds for histogram (±50%)
  const priceBounds = useMemo(() => ({
    min: Math.max(0.000001, pool.price * 0.5),
    max: pool.price * 1.5,
  }), [pool.price]);

  // Generate bin visualization
  const visualBins = useMemo(() => {
    const bins = [];
    const binWidth = (priceBounds.max - priceBounds.min) / numBins;
    
    for (let i = 0; i < numBins; i++) {
      const binMin = priceBounds.min + i * binWidth;
      const binMax = priceBounds.min + (i + 1) * binWidth;
      const binCenter = (binMin + binMax) / 2;
      const isInRange = binCenter >= minPrice && binCenter <= maxPrice;
      
      let liquidity = 0;
      if (isInRange) {
        const distFromCenter = Math.abs(binCenter - ((minPrice + maxPrice) / 2));
        const rangeWidth = (maxPrice - minPrice) / 2;
        const normalizedDist = rangeWidth > 0 ? distFromCenter / rangeWidth : 0;
        
        switch (strategy) {
          case "spot":
            liquidity = 80;
            break;
          case "curve":
            liquidity = 100 * Math.exp(-normalizedDist * normalizedDist * 2);
            break;
          case "bidAsk":
            liquidity = 40 + 60 * normalizedDist * normalizedDist;
            break;
        }
      }
      
      bins.push({
        id: i,
        liquidity,
        isInRange,
        isCurrentPrice: binCenter <= pool.price && pool.price < binMax,
      });
    }
    
    return bins;
  }, [priceBounds, numBins, minPrice, maxPrice, strategy, pool.price]);

  // Callbacks
  const handleRangePreset = useCallback((percentage: number) => {
    setMinPrice(pool.price * (1 - percentage));
    setMaxPrice(pool.price * (1 + percentage));
  }, [pool.price]);

  const handleResetPrice = useCallback(() => {
    setMinPrice(pool.price * 0.9);
    setMaxPrice(pool.price * 1.1);
  }, [pool.price]);

  const adjustPrice = useCallback((type: "min" | "max", direction: "up" | "down") => {
    const adjustment = pool.price * 0.01;
    if (type === "min") {
      const newMin = direction === "up" 
        ? Math.min(minPrice + adjustment, maxPrice - adjustment)
        : Math.max(0.000001, minPrice - adjustment);
      setMinPrice(newMin);
    } else {
      const newMax = direction === "up"
        ? maxPrice + adjustment
        : Math.max(minPrice + adjustment, maxPrice - adjustment);
      setMaxPrice(newMax);
    }
  }, [pool.price, minPrice, maxPrice]);

  const getPercentageFromCurrent = useCallback((price: number) => {
    return ((price - pool.price) / pool.price) * 100;
  }, [pool.price]);

  const formatPrice = useCallback((price: number) => {
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, []);

  const handleAddLiquidity = useCallback(async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    // Reset form
    setTokenAAmount("");
    setTokenBAmount("");
  }, []);

  const estimatedBins = useMemo(() => {
    const priceRange = maxPrice - minPrice;
    const binStep = pool.price * 0.005;
    return Math.max(1, Math.ceil(priceRange / binStep));
  }, [minPrice, maxPrice, pool.price]);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "positions":
        return (
          <div className="space-y-3 p-4">
            {MOCK_POSITIONS.length > 0 ? (
              MOCK_POSITIONS.map((position) => (
                <PositionCard 
                  key={position.id} 
                  position={position} 
                  tokenA={pool.token}
                  tokenB={pool.base}
                  onManage={onRemovePosition}
                />
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active positions</p>
              </div>
            )}
          </div>
        );
      
      case "closed":
        return (
          <div className="text-center py-12 text-zinc-500">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No closed positions</p>
          </div>
        );
      
      case "add":
        return (
          <div className="p-4 space-y-5">
            {/* Deposit Amount Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Wallet className="w-3 h-3" />
                Enter Deposit Amount
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Token A */}
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Amount</span>
                    <span>Bal: 1,240.25</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tokenAAmount}
                      onChange={(e) => setTokenAAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none w-full min-w-0"
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-700/50 shrink-0">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500" />
                      <span className="text-xs font-bold text-white">{pool.token}</span>
                    </div>
                  </div>
                </div>
                
                {/* Token B */}
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Amount</span>
                    <span>Bal: 45,210.00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tokenBAmount}
                      onChange={(e) => setTokenBAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none w-full min-w-0"
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-700/50 shrink-0">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" />
                      <span className="text-xs font-bold text-white">{pool.base}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Select Strategy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VOLATILITY_STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    className={`p-2.5 rounded-xl border transition-all text-center ${
                      strategy === s.id 
                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10" 
                        : "bg-zinc-800/50 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${
                      strategy === s.id ? "bg-emerald-500/20" : "bg-zinc-700/50"
                    }`}>
                      <s.icon className={`w-4 h-4 ${strategy === s.id ? "text-emerald-400" : "text-zinc-400"}`} />
                    </div>
                    <p className={`text-xs font-bold ${strategy === s.id ? "text-white" : "text-zinc-400"}`}>
                      {s.name}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {VOLATILITY_STRATEGIES.find(s => s.id === strategy)?.description}
              </p>
            </div>

            {/* Price Range Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  Set Price Range
                </label>
                <button
                  onClick={handleResetPrice}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-medium transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              </div>

              {/* Range Presets */}
              <div className="flex gap-1.5">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleRangePreset(preset.value)}
                    className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-medium transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Histogram */}
              <BinHistogram
                bins={visualBins}
                currentPrice={pool.price}
                minPrice={minPrice}
                maxPrice={maxPrice}
                priceBounds={priceBounds}
              />

              {/* Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {/* Min Price */}
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Min Price</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      getPercentageFromCurrent(minPrice) < 0 
                        ? "text-red-400 bg-red-500/10" 
                        : "text-emerald-400 bg-emerald-500/10"
                    }`}>
                      {getPercentageFromCurrent(minPrice).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustPrice("min", "down")}
                      className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={formatPrice(minPrice)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > 0 && val < maxPrice) setMinPrice(val);
                      }}
                      className="flex-1 bg-transparent text-center text-sm font-mono font-bold text-white focus:outline-none min-w-0"
                    />
                    <button
                      onClick={() => adjustPrice("min", "up")}
                      className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Max Price */}
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Max Price</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      getPercentageFromCurrent(maxPrice) > 0 
                        ? "text-emerald-400 bg-emerald-500/10" 
                        : "text-red-400 bg-red-500/10"
                    }`}>
                      +{getPercentageFromCurrent(maxPrice).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustPrice("max", "down")}
                      className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={formatPrice(maxPrice)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val > minPrice) setMaxPrice(val);
                      }}
                      className="flex-1 bg-transparent text-center text-sm font-mono font-bold text-white focus:outline-none min-w-0"
                    />
                    <button
                      onClick={() => adjustPrice("max", "up")}
                      className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Summary */}
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-100 mb-2">Position Summary</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-emerald-400/80">Current Price:</span>
                      <span className="font-mono text-emerald-300">{formatPrice(pool.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400/80">Est. Bins:</span>
                      <span className="font-mono text-emerald-300">{estimatedBins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400/80">Range:</span>
                      <span className="font-mono text-emerald-300">
                        {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400/80">Strategy:</span>
                      <span className="font-mono text-emerald-300 capitalize">{strategy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddLiquidity}
              disabled={!tokenAAmount || !tokenBAmount || isProcessing}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${
                isProcessing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : !tokenAAmount || !tokenBAmount
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Add Liquidity
                </>
              )}
            </button>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{pool.name}</h3>
            <p className="text-[10px] text-zinc-400">Current: ${formatPrice(pool.price)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
            42.5% APR
          </span>
        </div>
      </div>

      {/* Tabs */}
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
});

AddLiquidityPanel.displayName = "AddLiquidityPanel";
