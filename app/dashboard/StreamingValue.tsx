"use client";

import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Zap,
  Play,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useSpendableYield, useSolomonYieldSync } from "@/app/hooks/useSolomonYield";
import { usePrivy } from "@privy-io/react-auth";
import { AgentChat } from "./AgentChat";
import { ReceiveModal, WithdrawModal } from "./ActionModals";

interface StreamingValueProps {
  walletAddress?: string;
  onSpend: () => void;
  onReceive: () => void;
  onWithdraw: () => void;
}

export const StreamingValue = ({ 
  walletAddress,
  onSpend,
  onReceive,
  onWithdraw,
}: StreamingValueProps) => {
  const [showValue, setShowValue] = useState(true);

  const {
    spendableYield,
    isLoading,
    isDemo,
  } = useSpendableYield(walletAddress);
  
  // Need raw data for other metrics
  const { data: yieldData, refetch } = useSolomonYieldSync(walletAddress);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formattedSpendableYield = formatCurrency(spendableYield);

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Available Spendable Yield
            </h2>
            <button
              onClick={() => setShowValue(!showValue)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              {showValue ? (
                <Eye className="w-4 h-4 text-muted-foreground" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent border border-primary/20 text-xs font-medium text-primary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Private
            </span>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`w-4 h-4 text-muted-foreground ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {isLoading ? "..." : `${(yieldData?.apy ?? 0).toFixed(1)}% APY`}
            </span>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {showValue ? formattedSpendableYield : "••••••••"}
            </span>
            {(yieldData?.susdvBalance ?? 0) > 0 && (
              <span className="text-muted-foreground text-sm">
                from {(yieldData?.susdvBalance ?? 0).toFixed(2)} sUSDV
              </span>
            )}
          </div>
          {yieldData?.timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(yieldData.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                Yield Sources
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {(yieldData?.susdvBalance ?? 0) > 0 ? "1" : "0"}
            </p>
            <p className="text-xs text-muted-foreground">
              {(yieldData?.susdvBalance ?? 0) > 0 ? "sUSDV Active" : "Detected now"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">
                Yield Earned
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {showValue ? formatCurrency(yieldData?.monthlyYield ?? 0) : "••••••"}
            </p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Est. Daily</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {showValue
                ? formatCurrency(yieldData?.dailyYield ?? 0)
                : "••••••"}
            </p>
            <p className="text-xs text-muted-foreground">To earn</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {/* SPEND - Opens AI agent to spend yield on services */}
          <Button
            variant="success"
            className="gap-2"
            disabled={spendableYield <= 0}
            onClick={onSpend}
            title="Spend yield on x402 services via AI agent"
          >
            <Play className="w-4 h-4" />
            Spend
          </Button>

          {/* RECEIVE - Show deposit address for sUSDV */}
          <Button
            variant="glass"
            className="gap-2"
            onClick={onReceive}
            title="Get address to receive sUSDV deposits"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Receive
          </Button>

          {/* WITHDRAW - Convert yield to USDV */}
          <Button
            variant="glass"
            className="gap-2"
            disabled={spendableYield <= 0}
            onClick={onWithdraw}
            title="Withdraw earned yield as USDV"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
};
