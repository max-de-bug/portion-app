"use client";

import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Zap,
  Play,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useSolomonYield } from "@/app/hooks/useSolomonYield";
import { AgentChat } from "./AgentChat";
import { ReceiveModal, WithdrawModal, PayCardModal } from "./ActionModals";

interface StreamingValueProps {
  walletAddress?: string;
}

export const StreamingValue = ({ walletAddress }: StreamingValueProps) => {
  const [showValue, setShowValue] = useState(true);
  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPayCardOpen, setIsPayCardOpen] = useState(false);

  const {
    data: yieldData,
    isLoading,
    refresh,
  } = useSolomonYield({
    walletAddress,
    enabled: !!walletAddress,
  });

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate spendable yield (yield that can be spent without touching principal)
  const spendableYield = yieldData.claimableYield + yieldData.pendingYield;
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
              onClick={refresh}
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
              {isLoading ? "..." : `${yieldData.apy.toFixed(1)}% APY`}
            </span>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {showValue ? formattedSpendableYield : "••••••••"}
            </span>
            {yieldData.userStaked > 0 && (
              <span className="text-muted-foreground text-sm">
                from {yieldData.userStaked.toFixed(2)} sUSDV
              </span>
            )}
          </div>
          {yieldData.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {yieldData.lastUpdated.toLocaleTimeString()}
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
              {yieldData.userStaked > 0 ? "1" : "0"}
            </p>
            <p className="text-xs text-muted-foreground">
              {yieldData.userStaked > 0 ? "sUSDV Active" : "Detected now"}
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
              {showValue ? formatCurrency(yieldData.pendingYield) : "••••••"}
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
                ? formatCurrency(yieldData.pendingYield / 30)
                : "••••••"}
            </p>
            <p className="text-xs text-muted-foreground">To earn</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* SPEND - Opens AI agent to spend yield on services */}
          <Button
            variant="success"
            className="gap-2"
            disabled={spendableYield <= 0}
            onClick={() => setIsSpendOpen(true)}
            title="Spend yield on x402 services via AI agent"
          >
            <Play className="w-4 h-4" />
            Spend
          </Button>

          {/* RECEIVE - Show deposit address for sUSDV */}
          <Button
            variant="glass"
            className="gap-2"
            onClick={() => setIsReceiveOpen(true)}
            title="Get address to receive sUSDV deposits"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Receive
          </Button>

          {/* WITHDRAW - Convert yield to USDV */}
          <Button
            variant="glass"
            className="gap-2"
            disabled={yieldData.claimableYield <= 0}
            onClick={() => setIsWithdrawOpen(true)}
            title="Withdraw earned yield as USDV"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </Button>

          {/* PAY CARD - x402 virtual debit card */}
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary hover:bg-accent"
            onClick={() => setIsPayCardOpen(true)}
            title="Create x402 virtual card for yield-backed spending"
          >
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-primary">Pay Card</span>
          </Button>
        </div>

        {/* Modals */}
        <AgentChat
          isOpen={isSpendOpen}
          onClose={() => setIsSpendOpen(false)}
          walletAddress={walletAddress}
          availableYield={spendableYield}
        />
        <ReceiveModal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          walletAddress={walletAddress || ""}
        />
        <WithdrawModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          availableYield={spendableYield}
          walletAddress={walletAddress || ""}
        />
        <PayCardModal
          isOpen={isPayCardOpen}
          onClose={() => setIsPayCardOpen(false)}
          availableYield={spendableYield}
        />
      </div>
    </div>
  );
};
