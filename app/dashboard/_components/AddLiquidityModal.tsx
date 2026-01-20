"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Plus, 
  Info, 
  Target, 
  Zap, 
  TrendingUp, 
  Settings2,
  AlertTriangle,
  RefreshCcw
} from "lucide-react";

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: {
    id: string;
    name: string;
    token: string;
    base: string;
    price: number;
  };
}

export const AddLiquidityModal = ({ isOpen, onClose, pool }: AddLiquidityModalProps) => {
  const [tokenAAmount, setTokenAAmount] = useState("");
  const [tokenBAmount, setTokenBAmount] = useState("");
  const [strategy, setStrategy] = useState<"spot" | "concentrated" | "curve">("concentrated");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAddLiquidity = async () => {
    setIsProcessing(true);
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onClose();
  };

  const strategies = [
    { 
      id: "spot", 
      name: "Spot", 
      icon: Zap, 
      desc: "Uniform distribution across range",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      id: "concentrated", 
      name: "Concentrated", 
      icon: Target, 
      desc: "Maximize depth at current price",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      id: "curve", 
      name: "Curve", 
      icon: TrendingUp, 
      desc: "Ideal for stable or correlated pairs",
      color: "from-purple-500 to-indigo-500"
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Liquidity</h2>
                <p className="text-xs text-zinc-400">{pool.name} Pool</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Strategy Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Select Strategy
              </label>
              <div className="grid grid-cols-3 gap-3">
                {strategies.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id as any)}
                    className={`p-3 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                      strategy === s.id 
                        ? "bg-zinc-800 border-emerald-500/50 shadow-lg shadow-emerald-500/10" 
                        : "bg-zinc-800/50 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-lg`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className={`text-sm font-bold ${strategy === s.id ? "text-white" : "text-zinc-400"}`}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-1 line-clamp-2">
                      {s.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Token Inputs */}
            <div className="space-y-4">
              {/* Token A */}
              <div className="p-4 rounded-2xl bg-zinc-800/80 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                  <span>Input Amount</span>
                  <span>Balance: 1,240.25 {pool.token}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={tokenAAmount}
                    onChange={(e) => setTokenAAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-700/50 border border-white/5">
                    <div className="w-5 h-5 rounded-full bg-purple-500" />
                    <span className="font-bold text-sm text-white">{pool.token}</span>
                  </div>
                </div>
              </div>

              {/* Token B */}
              <div className="p-4 rounded-2xl bg-zinc-800/80 border border-white/5 space-y-2 text-zinc-400">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                  <span>Input Amount</span>
                  <span>Balance: 45,210.00 {pool.base}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={tokenBAmount}
                    onChange={(e) => setTokenBAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-700/50 border border-white/5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm text-white">{pool.base}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Range Summary */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-100">Range Info</p>
                  <p className="text-xs text-emerald-400/80 leading-relaxed">
                    Providing liquidity in this range will earn you fees proportional to the trade volume within these bins. Current price: {pool.price} {pool.base}/{pool.token}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddLiquidity}
              disabled={!tokenAAmount || !tokenBAmount || isProcessing}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${
                isProcessing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : !tokenAAmount || !tokenBAmount
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Add Liquidity
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-zinc-500">
              High Capital Efficiency • Zero Slippage • Concentrated Yield
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
