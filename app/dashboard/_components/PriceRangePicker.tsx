"use client";

/**
 * Meteora-Style Price Range Picker Component
 * 
 * Interactive range picker with bin histogram visualization,
 * volatility strategies (Spot/Curve/Bid-Ask), and min/max price inputs
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Target, 
  RotateCcw, 
  Minus, 
  Plus,
  BarChart3,
  TrendingUp,
  ArrowLeftRight
} from "lucide-react";

interface PriceRangePickerProps {
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  onRangeChange: (min: number, max: number) => void;
  tokenA: string;
  tokenB: string;
  bins?: { id: number; liquidity: number }[];
}

type VolatilityStrategy = "spot" | "curve" | "bidAsk";

const VOLATILITY_STRATEGIES: { id: VolatilityStrategy; name: string; icon: any; description: string }[] = [
  { 
    id: "spot", 
    name: "Spot", 
    icon: BarChart3, 
    description: "Uniform distribution across the range. Versatile for any market conditions."
  },
  { 
    id: "curve", 
    name: "Curve", 
    icon: TrendingUp, 
    description: "Concentrated in the middle. Ideal for stable pairs or low volatility."
  },
  { 
    id: "bidAsk", 
    name: "Bid-Ask", 
    icon: ArrowLeftRight, 
    description: "Heavier at edges. Good for capturing spreads in volatile markets."
  },
];

// Default number of bins for visualization
const DEFAULT_NUM_BINS = 40;

export const PriceRangePicker = ({
  currentPrice,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  onRangeChange,
  tokenA,
  tokenB,
  bins: externalBins,
}: PriceRangePickerProps) => {
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [numBins, setNumBins] = useState(DEFAULT_NUM_BINS);
  const [strategy, setStrategy] = useState<VolatilityStrategy>("spot");
  const [priceToggle, setPriceToggle] = useState<"A" | "B">("B"); // B = base token per quote

  // Calculate price bounds for the slider (±50% from current)
  const priceBounds = useMemo(() => {
    const buffer = currentPrice * 0.5;
    return {
      min: Math.max(0.000001, currentPrice - buffer),
      max: currentPrice + buffer,
    };
  }, [currentPrice]);

  // Calculate percentage from current price
  const getPercentageFromCurrent = useCallback((price: number) => {
    return ((price - currentPrice) / currentPrice) * 100;
  }, [currentPrice]);

  // Generate bin visualization data based on strategy
  const visualBins = useMemo(() => {
    const bins = [];
    const binWidth = (priceBounds.max - priceBounds.min) / numBins;
    
    for (let i = 0; i < numBins; i++) {
      const binMin = priceBounds.min + i * binWidth;
      const binMax = priceBounds.min + (i + 1) * binWidth;
      const binCenter = (binMin + binMax) / 2;
      
      // Determine if this bin is within the selected range
      const isInRange = binCenter >= minPrice && binCenter <= maxPrice;
      
      // Calculate liquidity based on strategy
      let liquidity = 0;
      if (isInRange) {
        const distFromCenter = Math.abs(binCenter - ((minPrice + maxPrice) / 2));
        const rangeWidth = (maxPrice - minPrice) / 2;
        const normalizedDist = rangeWidth > 0 ? distFromCenter / rangeWidth : 0;
        
        switch (strategy) {
          case "spot":
            liquidity = 80; // Uniform
            break;
          case "curve":
            // Bell curve - higher in center
            liquidity = 100 * Math.exp(-normalizedDist * normalizedDist * 2);
            break;
          case "bidAsk":
            // U-shape - higher at edges
            liquidity = 40 + 60 * normalizedDist * normalizedDist;
            break;
        }
      }
      
      bins.push({
        id: i,
        priceMin: binMin,
        priceMax: binMax,
        center: binCenter,
        liquidity,
        isInRange,
        isCurrentPrice: binCenter <= currentPrice && currentPrice < binMax,
      });
    }
    
    return bins;
  }, [priceBounds, numBins, minPrice, maxPrice, strategy, currentPrice]);

  // Reset price to default (±10%)
  const handleResetPrice = useCallback(() => {
    const newMin = currentPrice * 0.9;
    const newMax = currentPrice * 1.1;
    setMinPrice(newMin);
    setMaxPrice(newMax);
    onRangeChange(newMin, newMax);
  }, [currentPrice, onRangeChange]);

  // Handle manual min price input
  const handleMinPriceChange = useCallback((value: string) => {
    const newMin = parseFloat(value) || 0;
    if (newMin < maxPrice && newMin >= 0) {
      setMinPrice(newMin);
      onRangeChange(newMin, maxPrice);
    }
  }, [maxPrice, onRangeChange]);

  // Handle manual max price input  
  const handleMaxPriceChange = useCallback((value: string) => {
    const newMax = parseFloat(value) || 0;
    if (newMax > minPrice) {
      setMaxPrice(newMax);
      onRangeChange(minPrice, newMax);
    }
  }, [minPrice, onRangeChange]);

  // Adjust prices with +/- buttons
  const adjustPrice = useCallback((type: "min" | "max", direction: "up" | "down") => {
    const adjustment = currentPrice * 0.01;
    
    if (type === "min") {
      const newMin = direction === "up" 
        ? Math.min(minPrice + adjustment, maxPrice - adjustment)
        : Math.max(0.000001, minPrice - adjustment);
      setMinPrice(newMin);
      onRangeChange(newMin, maxPrice);
    } else {
      const newMax = direction === "up"
        ? maxPrice + adjustment
        : Math.max(minPrice + adjustment, maxPrice - adjustment);
      setMaxPrice(newMax);
      onRangeChange(minPrice, newMax);
    }
  }, [currentPrice, minPrice, maxPrice, onRangeChange]);

  // Handle number of bins change
  const handleNumBinsChange = useCallback((value: string) => {
    const num = parseInt(value) || DEFAULT_NUM_BINS;
    setNumBins(Math.max(10, Math.min(100, num)));
  }, []);

  // Format price for display
  const formatPrice = useCallback((price: number) => {
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, []);

  // Get display token pair based on toggle
  const displayPair = priceToggle === "B" 
    ? `${tokenB}/${tokenA}` 
    : `${tokenA}/${tokenB}`;

  const maxLiquidity = Math.max(...visualBins.map(b => b.liquidity), 1);

  return (
    <div className="space-y-5">
      {/* Volatility Strategy Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Select Volatility Strategy
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {VOLATILITY_STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={`p-3 rounded-xl border transition-all text-center ${
                strategy === s.id 
                  ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10" 
                  : "bg-zinc-800/50 border-white/5 hover:border-white/10"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                strategy === s.id 
                  ? "bg-indigo-500/20" 
                  : "bg-zinc-700/50"
              }`}>
                <s.icon className={`w-5 h-5 ${strategy === s.id ? "text-indigo-400" : "text-zinc-400"}`} />
              </div>
              <p className={`text-sm font-bold ${strategy === s.id ? "text-white" : "text-zinc-400"}`}>
                {s.name}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {VOLATILITY_STRATEGIES.find(s => s.id === strategy)?.description}
        </p>
      </div>

      {/* Set Price Range Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Set Price Range
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetPrice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Price
          </button>
          {/* Price Toggle */}
          <button
            onClick={() => setPriceToggle(priceToggle === "A" ? "B" : "A")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors"
          >
            <ArrowLeftRight className="w-3 h-3" />
            {displayPair}
          </button>
        </div>
      </div>

      {/* Bin Histogram Visualization */}
      <div className="relative h-32 rounded-xl bg-zinc-800/50 border border-white/5 overflow-hidden">
        {/* Current Price Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20"
          style={{ 
            left: `${((currentPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100}%` 
          }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rounded-full" />
        </div>

        {/* Bins */}
        <div className="absolute inset-0 flex items-end px-1 pb-1 pt-4">
          {visualBins.map((bin) => (
            <motion.div
              key={bin.id}
              initial={{ height: 0 }}
              animate={{ height: `${(bin.liquidity / maxLiquidity) * 100}%` }}
              transition={{ duration: 0.3, delay: bin.id * 0.005 }}
              className={`flex-1 mx-[0.5px] rounded-t-sm transition-colors ${
                bin.isInRange
                  ? bin.isCurrentPrice
                    ? "bg-gradient-to-t from-amber-500 to-yellow-400"
                    : "bg-gradient-to-t from-indigo-500/80 to-purple-400/80"
                  : "bg-zinc-700/30"
              }`}
              title={`${formatPrice(bin.priceMin)} - ${formatPrice(bin.priceMax)}`}
            />
          ))}
        </div>

        {/* Range Overlay */}
        <div 
          className="absolute top-0 bottom-0 bg-indigo-500/10 border-l-2 border-r-2 border-indigo-500/50 pointer-events-none"
          style={{
            left: `${((minPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100}%`,
            width: `${((maxPrice - minPrice) / (priceBounds.max - priceBounds.min)) * 100}%`,
          }}
        />
      </div>

      {/* Price Inputs */}
      <div className="grid grid-cols-2 gap-4">
        {/* Min Price */}
        <div className="p-4 rounded-xl bg-zinc-800/80 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase">Min Price</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              getPercentageFromCurrent(minPrice) < 0 
                ? "text-red-400 bg-red-500/10" 
                : "text-emerald-400 bg-emerald-500/10"
            }`}>
              {getPercentageFromCurrent(minPrice).toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustPrice("min", "down")}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={formatPrice(minPrice)}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              className="flex-1 bg-transparent text-center text-lg font-mono font-bold text-white focus:outline-none"
              step={currentPrice * 0.01}
            />
            <button
              onClick={() => adjustPrice("min", "up")}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">{displayPair}</p>
        </div>

        {/* Max Price */}
        <div className="p-4 rounded-xl bg-zinc-800/80 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase">Max Price</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              getPercentageFromCurrent(maxPrice) > 0 
                ? "text-emerald-400 bg-emerald-500/10" 
                : "text-red-400 bg-red-500/10"
            }`}>
              +{getPercentageFromCurrent(maxPrice).toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustPrice("max", "down")}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={formatPrice(maxPrice)}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              className="flex-1 bg-transparent text-center text-lg font-mono font-bold text-white focus:outline-none"
              step={currentPrice * 0.01}
            />
            <button
              onClick={() => adjustPrice("max", "up")}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">{displayPair}</p>
        </div>
      </div>

      {/* Num Bins Input */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5">
        <span className="text-xs font-medium text-zinc-500">Number of Bins</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNumBins(Math.max(10, numBins - 5))}
            className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            value={numBins}
            onChange={(e) => handleNumBinsChange(e.target.value)}
            className="w-16 bg-transparent text-center text-sm font-mono font-bold text-white focus:outline-none"
            min={10}
            max={100}
          />
          <button
            onClick={() => setNumBins(Math.min(100, numBins + 5))}
            className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
        <p className="text-xs text-indigo-300">
          Providing liquidity from{" "}
          <span className="font-mono font-bold text-indigo-200">{formatPrice(minPrice)}</span> to{" "}
          <span className="font-mono font-bold text-indigo-200">{formatPrice(maxPrice)}</span>{" "}
          {displayPair} across <span className="font-bold text-indigo-200">{numBins} bins</span>
        </p>
      </div>
    </div>
  );
};
