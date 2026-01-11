"use client";

import { Zap, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSolomonYieldSync, useSolomonAPY } from "@/app/hooks/useSolomonYield";
import { useSpendingPolicies } from "@/app/hooks/useSpendingPolicies";

interface YieldCapacityProps {
  walletAddress?: string;
}

export function YieldCapacity({ walletAddress }: YieldCapacityProps) {
  const { data: yieldData, isLoading: yieldLoading } = useSolomonYieldSync(walletAddress);
  const { data: apyData, isLoading: apyLoading } = useSolomonAPY();
  const { dailyLimit, dailySpent } = useSpendingPolicies();

  const isLoading = yieldLoading || apyLoading;
  const apy = apyData?.apy ?? 0;
  const efficiency = 99.9; // Protocol efficiency
  const hasYieldSource = (yieldData?.susdvBalance ?? 0) > 0;

  // Calculate yield allocation percentage (how much of potential yield is being used for payments)
  const allocationPercent = dailyLimit > 0 ? Math.min(100, (dailySpent / dailyLimit) * 100) : 0;
  const isFullyUtilized = allocationPercent >= 90;

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-4">
          <div className="h-3 bg-muted rounded-full w-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground truncate">YaaS Yield Capacity</h3>
          </div>
          <span
            className={cn(
              "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight whitespace-nowrap flex-shrink-0",
              isFullyUtilized
                ? "bg-success/20 text-success animate-pulse"
                : "bg-accent text-primary"
            )}
          >
            {isFullyUtilized ? "100%" : `${allocationPercent.toFixed(0)}%`}
          </span>
        </div>

        {/* Allocation Progress */}
        <div>
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="text-muted-foreground">Allocated for Payments</span>
            <span className="text-primary font-bold">{allocationPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 w-full bg-background/50 rounded-full overflow-hidden border border-border/20">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isFullyUtilized
                  ? "bg-gradient-to-r from-primary to-success shadow-[0_0_10px_rgba(0,163,255,0.4)]"
                  : "bg-gradient-to-r from-primary/70 to-primary"
              )}
              style={{ width: `${allocationPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-background/40 border border-border/20 hover:scale-[1.02] transition-transform overflow-hidden">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1 truncate">
              Yield Source
            </span>
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  hasYieldSource ? "bg-primary animate-pulse" : "bg-muted-foreground"
                )}
              />
              <span className="truncate">{hasYieldSource ? "Solomon YaaS" : "Not Connected"}</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-background/40 border border-border/20 hover:scale-[1.02] transition-transform overflow-hidden">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1 truncate">
              Efficiency
            </span>
            <span className="text-xs font-mono font-bold text-primary flex items-center gap-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              {efficiency}%
            </span>
          </div>
        </div>

        {/* Authorization Status */}
        <div className="p-3 rounded-xl border border-dashed border-border/60 bg-primary/5 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <Shield
              className={cn(
                "w-6 h-6 text-primary mx-auto mb-1.5 transition-all duration-500",
                hasYieldSource && "animate-pulse"
              )}
            />
            <p className="text-xs font-bold text-foreground truncate">Autonomous Authorization</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {hasYieldSource ? "Signed via Vault" : "Connect wallet"}
            </p>
          </div>
        </div>

        {/* APY Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Current APY</span>
          <span className="text-sm font-mono font-bold text-primary">{apy.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
