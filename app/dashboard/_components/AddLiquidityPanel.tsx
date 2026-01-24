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

const TOKEN_A_SYMBOL = <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500" />;
const TOKEN_B_SYMBOL = <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" />;

const formatPrice = (price: number) => {
  if (price < 0.0001) return price.toFixed(8);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

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
    <div className="flex border-b border-emerald-100/50 bg-white/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 px-4 text-sm font-bold transition-colors relative ${
            activeTab === tab.id
              ? "text-emerald-900"
              : "text-zinc-500 hover:text-emerald-600"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.label}
            {tab.count !== null && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500"
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
    className="p-4 rounded-xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-shadow space-y-3"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-white" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-white" />
        </div>
        <span className="text-sm font-extrabold text-zinc-900">{tokenA}/{tokenB}</span>
      </div>
      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
        position.inRange
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}>
        {position.inRange ? "In Range" : "Out of Range"}
      </span>
    </div>
    
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <span className="text-zinc-500 font-medium">Price Range</span>
        <p className="font-mono font-bold text-zinc-900">
          ${position.minPrice.toFixed(2)} - ${position.maxPrice.toFixed(2)}
        </p>
      </div>
      <div>
        <span className="text-zinc-500 font-medium">Liquidity</span>
        <p className="font-mono font-bold text-zinc-900">
          ${position.liquidity.toLocaleString()}
        </p>
      </div>
      <div>
        <span className="text-zinc-500 font-medium">24h Fees</span>
        <p className="font-mono font-bold text-emerald-600">
          +${position.fees24h.toFixed(2)}
        </p>
      </div>
      <div className="flex items-end">
        <button 
          onClick={onManage}
          className="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors"
        >
          Manage
        </button>
      </div>
    </div>
  </motion.div>
));
PositionCard.displayName = "PositionCard";

/** Strategy Selector Component */
const StrategySelector = memo(({ 
  current, 
  onSelect 
}: { 
  current: VolatilityStrategy; 
  onSelect: (s: VolatilityStrategy) => void;
}) => (
  <div className="space-y-3">
    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
      Select Strategy
    </label>
    <div className="grid grid-cols-3 gap-2">
      {VOLATILITY_STRATEGIES.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`p-2.5 rounded-xl border transition-all text-center ${
            current === s.id 
              ? "bg-emerald-50 border-emerald-500 shadow-sm" 
              : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100 hover:border-zinc-200"
          }`}
        >
          <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${
            current === s.id ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md" : "bg-zinc-200 text-zinc-500"
          }`}>
            <s.icon className="w-4 h-4" />
          </div>
          <p className={`text-xs font-bold ${current === s.id ? "text-emerald-900" : "text-zinc-500"}`}>
            {s.name}
          </p>
        </button>
      ))}
    </div>
    <p className="text-[10px] text-zinc-500 leading-relaxed h-8">
      {VOLATILITY_STRATEGIES.find(s => s.id === current)?.description}
    </p>
  </div>
));
StrategySelector.displayName = "StrategySelector";

/** Deposit Input Component */
const DepositInput = memo(({ 
  label, 
  value, 
  onChange, 
  token, 
  symbol, 
  balance 
}: { 
  label: string;
  value: string;
  onChange: (v: string) => void;
  token: string;
  symbol: React.ReactNode;
  balance: string;
}) => (
  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 space-y-2">
    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
      <span>{label}</span>
      <span>Bal: {balance}</span>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="flex-1 bg-transparent text-lg font-black text-zinc-900 focus:outline-none w-full min-w-0 placeholder:text-zinc-300"
      />
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-emerald-100 shadow-sm shrink-0">
        {symbol}
        <span className="text-xs font-black text-emerald-900">{token}</span>
      </div>
    </div>
  </div>
));
DepositInput.displayName = "DepositInput";

/** Price Input Component */
const PriceInput = memo(({ 
  label, 
  value, 
  percentage, 
  onAdjust, 
  onChange,
  isMax = false
}: { 
  label: string;
  value: string;
  percentage: number;
  onAdjust: (dir: "up" | "down") => void;
  onChange: (v: string) => void;
  isMax?: boolean;
}) => (
  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
        (isMax ? percentage > 0 : percentage < 0)
          ? "text-emerald-700 bg-emerald-100" 
          : "text-red-700 bg-red-100"
      }`}>
        {percentage > 0 ? "+" : ""}{percentage.toFixed(1)}%
      </span>
    </div>
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onAdjust("down")}
        className="p-1.5 rounded-lg bg-white border border-zinc-200 hover:border-emerald-300 text-zinc-400 hover:text-emerald-500 transition-colors shadow-sm"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-center text-sm font-mono font-black text-zinc-900 focus:outline-none min-w-0"
      />
      <button
        onClick={() => onAdjust("up")}
        className="p-1.5 rounded-lg bg-white border border-zinc-200 hover:border-emerald-300 text-zinc-400 hover:text-emerald-500 transition-colors shadow-sm"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
));
PriceInput.displayName = "PriceInput";

/** Position Summary Component */
const PositionSummary = memo(({ 
  currentPrice, 
  estBins, 
  minPrice, 
  maxPrice, 
  strategy,
  format
}: { 
  currentPrice: number;
  estBins: number;
  minPrice: number;
  maxPrice: number;
  strategy: string;
  format: (n: number) => string;
}) => (
  <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-sm space-y-2">
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Info className="w-3 h-3 text-emerald-600" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider mb-2">Position Summary</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div className="flex justify-between border-b border-emerald-50 pb-1">
            <span className="text-zinc-500 font-medium">Current Price:</span>
            <span className="font-mono font-bold text-emerald-700">{format(currentPrice)}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-50 pb-1">
            <span className="text-zinc-500 font-medium">Est. Bins:</span>
            <span className="font-mono font-bold text-emerald-700">{estBins}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-zinc-500 font-medium">Range:</span>
            <span className="font-mono font-bold text-emerald-700">
              {format(minPrice)} - {format(maxPrice)}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-zinc-500 font-medium">Strategy:</span>
            <span className="font-bold text-emerald-700 capitalize">{strategy}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
));
PositionSummary.displayName = "PositionSummary";

/** Histogram Bin Visualization */
const Bin = memo(({ 
  liquidity, 
  maxLiquidity, 
  isInRange, 
  isCurrentPrice, 
  index,
  isDragging
}: { 
  liquidity: number; 
  maxLiquidity: number; 
  isInRange: boolean; 
  isCurrentPrice: boolean;
  index: number;
  isDragging: boolean;
}) => (
  <motion.div
    initial={{ height: 0 }}
    animate={{ height: `${(liquidity / maxLiquidity) * 100}%` }}
    transition={isDragging ? { duration: 0 } : { duration: 0.3, delay: index * 0.003 }}
    className={`flex-1 mx-[0.5px] rounded-t-sm transition-colors duration-200 ${
      isInRange
        ? isCurrentPrice
          ? "bg-gradient-to-t from-amber-400 to-yellow-300"
          : "bg-gradient-to-t from-emerald-400/80 to-teal-100/80"
        : "bg-zinc-100"
    }`}
  />
));
Bin.displayName = "Bin";
const BinHistogram = memo(({ 
  bins, 
  currentPrice, 
  minPrice, 
  maxPrice, 
  priceBounds,
  onDragMin,
  onDragMax,
  onDragRange,
}: { 
  bins: Array<{ id: number; liquidity: number; isInRange: boolean; isCurrentPrice: boolean }>;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  priceBounds: { min: number; max: number };
  onDragMin?: (price: number) => void;
  onDragMax?: (price: number) => void;
  onDragRange?: (newMin: number, newMax: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragType, setDragType] = useState<"min" | "max" | "range" | null>(null);
  const dragStartPos = useRef<number>(0);
  const dragStartMin = useRef<number>(0);
  const dragStartMax = useRef<number>(0);

  const maxLiquidity = Math.max(...bins.map(b => b.liquidity), 1);
  const isDragging = dragType !== null;
  
  const currentPricePosition = ((currentPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;
  const minPricePosition = ((minPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;
  const maxPricePosition = ((maxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;

  const handleMouseDown = useCallback((e: React.MouseEvent, type: "min" | "max" | "range") => {
    e.preventDefault();
    setDragType(type);
    dragStartPos.current = e.clientX;
    dragStartMin.current = minPrice;
    dragStartMax.current = maxPrice;
    
    document.body.style.cursor = type === "range" ? "grabbing" : "ew-resize";
  }, [minPrice, maxPrice]);

  useEffect(() => {
    if (!dragType) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.current;
      const pricePerPixel = (priceBounds.max - priceBounds.min) / rect.width;
      const deltaPrice = deltaX * pricePerPixel;

      if (dragType === "min" && onDragMin) {
        onDragMin(Math.max(priceBounds.min, Math.min(dragStartMin.current + deltaPrice, maxPrice - 0.000001)));
      } else if (dragType === "max" && onDragMax) {
        onDragMax(Math.max(minPrice + 0.000001, Math.min(dragStartMax.current + deltaPrice, priceBounds.max)));
      } else if (dragType === "range" && onDragRange) {
        let actualDelta = deltaPrice;
        if (dragStartMin.current + actualDelta < priceBounds.min) actualDelta = priceBounds.min - dragStartMin.current;
        if (dragStartMax.current + actualDelta > priceBounds.max) actualDelta = priceBounds.max - dragStartMax.current;
        onDragRange(dragStartMin.current + actualDelta, dragStartMax.current + actualDelta);
      }
    };

    const handleMouseUp = () => {
      setDragType(null);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragType, priceBounds, minPrice, maxPrice, onDragMin, onDragMax, onDragRange]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-28 rounded-xl border overflow-hidden transition-all duration-300 ${isDragging ? "border-emerald-500 bg-emerald-50 shadow-[inset_0_2px_10px_rgba(16,185,129,0.05)]" : "bg-zinc-50 border-zinc-100 lg:bg-white"}`}
    >
      {/* Current Price Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20"
        style={{ left: `${currentPricePosition}%` }}
      >
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white shadow-md shadow-amber-500/30" />
      </div>

      {/* Bins */}
      <div className="absolute inset-0 flex items-end px-1 pb-1 pt-3">
        {bins.map((bin, i) => (
          <Bin 
            key={bin.id} 
            {...bin} 
            index={i} 
            maxLiquidity={maxLiquidity} 
            isDragging={isDragging} 
          />
        ))}
      </div>

      {/* Range Overlay */}
      <div 
        className="absolute top-0 bottom-0 bg-emerald-500/10 border-l-2 border-r-2 border-emerald-500/50 cursor-grab active:cursor-grabbing z-20"
        style={{
          left: `${minPricePosition}%`,
          width: `${maxPricePosition - minPricePosition}%`,
        }}
        onMouseDown={(e) => handleMouseDown(e, "range")}
      />
      
      {/* Min Handle */}
      <div 
        className="absolute top-0 bottom-0 w-8 cursor-ew-resize z-30 group"
        style={{ left: `calc(${minPricePosition}% - 16px)` }}
        onMouseDown={(e) => handleMouseDown(e, "min")}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-emerald-500 group-hover:bg-emerald-400 group-active:scale-y-110 transition-all shadow-lg shadow-emerald-500/20" />
      </div>
      
      {/* Max Handle */}
      <div 
        className="absolute top-0 bottom-0 w-8 cursor-ew-resize z-30 group"
        style={{ left: `calc(${maxPricePosition}% - 16px)` }}
        onMouseDown={(e) => handleMouseDown(e, "max")}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-emerald-500 group-hover:bg-emerald-400 group-active:scale-y-110 transition-all shadow-lg shadow-emerald-500/20" />
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

  const handleRangePreset = useCallback((percentage: number) => {
    setMinPrice(pool.price * (1 - percentage));
    setMaxPrice(pool.price * (1 + percentage));
  }, [pool.price]);

  const handleResetPrice = useCallback(() => {
    setMinPrice(pool.price * 0.9);
    setMaxPrice(pool.price * 1.1);
  }, [pool.price]);

  const handleDragRange = useCallback((newMin: number, newMax: number) => {
    setMinPrice(newMin);
    setMaxPrice(newMax);
  }, []);

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
              <div className="text-center py-12 text-zinc-400">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-50 flex items-center justify-center">
                  <Layers className="w-6 h-6 opacity-20" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">No active positions</p>
              </div>
            )}
          </div>
        );
      
      case "closed":
        return (
          <div className="text-center py-16 text-zinc-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-50 flex items-center justify-center">
              <Layers className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">No closed positions</p>
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
                <DepositInput
                  label="Amount"
                  value={tokenAAmount}
                  onChange={setTokenAAmount}
                  token={pool.token}
                  balance="1,240.25"
                  symbol={TOKEN_A_SYMBOL}
                />
                <DepositInput
                  label="Amount"
                  value={tokenBAmount}
                  onChange={setTokenBAmount}
                  token={pool.base}
                  balance="45,210.00"
                  symbol={TOKEN_B_SYMBOL}
                />
              </div>
            </div>

            {/* Strategy Selection */}
            <StrategySelector 
              current={strategy} 
              onSelect={setStrategy} 
            />

            {/* Price Range Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  Set Price Range
                </label>
                <button
                  onClick={handleResetPrice}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-all border border-emerald-100/50"
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
                    className="flex-1 py-1.5 rounded-lg bg-zinc-50 hover:bg-emerald-50 text-zinc-500 hover:text-emerald-700 text-[10px] font-black transition-all border border-zinc-100 hover:border-emerald-200"
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
                onDragMin={setMinPrice}
                onDragMax={setMaxPrice}
                onDragRange={handleDragRange}
              />

              {/* Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <PriceInput
                  label="Min Price"
                  value={formatPrice(minPrice)}
                  percentage={getPercentageFromCurrent(minPrice)}
                  onAdjust={(dir) => adjustPrice("min", dir)}
                  onChange={(v) => {
                    const val = parseFloat(v);
                    if (val > 0 && val < maxPrice) setMinPrice(val);
                  }}
                />
                <PriceInput
                  label="Max Price"
                  value={formatPrice(maxPrice)}
                  percentage={getPercentageFromCurrent(maxPrice)}
                  onAdjust={(dir) => adjustPrice("max", dir)}
                  onChange={(v) => {
                    const val = parseFloat(v);
                    if (val > minPrice) setMaxPrice(val);
                  }}
                  isMax
                />
              </div>
            </div>

            {/* Position Summary */}
            <PositionSummary
              currentPrice={pool.price}
              estBins={estimatedBins}
              minPrice={minPrice}
              maxPrice={maxPrice}
              strategy={strategy}
              format={formatPrice}
            />

            {/* Action Button */}
            <button
              onClick={handleAddLiquidity}
              disabled={!tokenAAmount || !tokenBAmount || isProcessing}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 border-2 ${
                isProcessing
                  ? "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
                  : !tokenAAmount || !tokenBAmount
                  ? "bg-zinc-50 border-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/40"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
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
      className="rounded-2xl bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] overflow-hidden"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-emerald-50 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">{pool.name}</h3>
            <p className="text-[10px] text-zinc-500 font-bold">Current: <span className="text-emerald-700 font-mono">${formatPrice(pool.price)}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black tracking-tight border border-emerald-200">
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
