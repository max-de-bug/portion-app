"use client";

/**
 * Prepaid Balance Component
 * 
 * Displays the user's prepaid balance and allows top-up
 */

import { useState } from "react";
import { useX402Session } from "@/app/hooks/useX402Session";
import { Wallet, Plus, RefreshCw, Loader2, CheckCircle2, DollarSign } from "lucide-react";

interface PrepaidBalanceProps {
  walletAddress: string;
  compact?: boolean;
}

export function PrepaidBalance({ walletAddress, compact = false }: PrepaidBalanceProps) {
  const { 
    isAuthenticated, 
    prepaidBalance, 
    refreshPrepaidBalance, 
    authenticate,
    isLoading 
  } = useX402Session(walletAddress);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("10");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrepaidBalance();
    setIsRefreshing(false);
  };

  const balanceNum = prepaidBalance ? parseFloat(prepaidBalance.balance) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-300">
          ${balanceNum.toFixed(2)}
        </span>
        <span className="text-xs text-white/50">prepaid</span>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h3 className="font-medium text-white">Prepaid Balance</h3>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !isAuthenticated}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw className={`w-4 h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-4">
          <p className="text-sm text-white/60 mb-3">
            Authenticate to enable prepaid balance
          </p>
          <button
            onClick={authenticate}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Sign to Authenticate
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg p-4 mb-4">
            <div className="text-3xl font-bold text-white mb-1">
              ${balanceNum.toFixed(2)}
            </div>
            <div className="text-sm text-white/60">
              Available for AI services
            </div>
            {prepaidBalance?.lastTopup && (
              <div className="text-xs text-white/40 mt-2">
                Last top-up: {new Date(prepaidBalance.lastTopup).toLocaleDateString()}
              </div>
            )}
          </div>

          {balanceNum > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 mb-4">
              <CheckCircle2 className="w-4 h-4" />
              <span>10% discount on prepaid transactions</span>
            </div>
          )}

          {showTopup ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Amount (USD)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    min="1"
                    step="1"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                    placeholder="10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTopup(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Pay ${topupAmount}
                </button>
              </div>
              
              <p className="text-xs text-white/40 text-center">
                Payment via SOL or USDC. Transaction will appear for signing.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowTopup(true)}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Top Up Balance
            </button>
          )}
        </>
      )}
    </div>
  );
}
