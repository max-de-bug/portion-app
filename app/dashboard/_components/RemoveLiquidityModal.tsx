"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Minus, 
  Info, 
  ArrowDownLeft, 
  Layers, 
  Coins, 
  ChevronRight,
  RefreshCcw,
  Wallet
} from "lucide-react";

interface RemoveLiquidityModalProps {
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

export const RemoveLiquidityModal = ({ isOpen, onClose, pool }: RemoveLiquidityModalProps) => {
  const [percentage, setPercentage] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleRemoveLiquidity = async () => {
    setIsProcessing(true);
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onClose();
  };

  // Mock position data
  const position = {
    id: "pos-1",
    totalValue: 12500,
    tokenAAmount: 15.42,
    tokenBAmount: 2854.20,
    accruedFees: 45.32,
    range: "$182.50 - $188.30"
  };

  const estimatedTokenA = (position.tokenAAmount * percentage / 100).toFixed(4);
  const estimatedTokenB = (position.tokenBAmount * percentage / 100).toFixed(2);
  const estimatedFees = (position.accruedFees * percentage / 100).toFixed(2);

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
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Minus className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Remove Liquidity</h2>
                <p className="text-xs text-zinc-400">{pool.name} Position</p>
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
            {/* Position Summary Card */}
            <div className="p-4 rounded-2xl bg-zinc-800/80 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-white">Active Position</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider bg-zinc-700/50 px-2 py-0.5 rounded uppercase">
                  ID: {position.id}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Total Value</p>
                  <p className="text-lg font-black text-white">${position.totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Price Range</p>
                  <p className="text-sm font-bold text-zinc-300">{position.range}</p>
                </div>
              </div>
            </div>

            {/* Removal Gauge */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Select Amount (%)
                </label>
                <span className="text-2xl font-black text-emerald-500">{percentage}%</span>
              </div>
              
              <div className="relative pt-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-3">
                  {[25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPercentage(val)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        percentage === val 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimated Recipient */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Wallet className="w-3 h-3" />
                You will receive
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500" />
                    <span className="font-bold text-sm text-white">{pool.token}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{estimatedTokenA}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm text-white">{pool.base}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{estimatedTokenB}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-bold text-sm text-emerald-400">Accrued Fees</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">+${estimatedFees}</span>
                </div>
              </div>
            </div>

            {/* Warning Section */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
              <ArrowDownLeft className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-500/80 leading-relaxed">
                Tokens will be sent directly to your wallet. If the pool price has moved outside your range, 
                your token composition may have changed. Transaction includes all earned fees.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleRemoveLiquidity}
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${
                isProcessing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5" />
                  Remove Liquidity
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
