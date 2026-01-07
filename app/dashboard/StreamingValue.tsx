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
} from "lucide-react";
import { useState } from "react";

export const StreamingValue = () => {
  const [showValue, setShowValue] = useState(true);

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
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">10.3% APY</span>
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {showValue ? "$124,567.89" : "••••••••"}
            </span>
            <span className="text-muted-foreground">◎</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Yield Sources</span>
            </div>
            <p className="text-2xl font-bold text-foreground">14</p>
            <p className="text-xs text-muted-foreground">Detected now</p>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Yield Earned</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {showValue ? "$8,432.50" : "••••••"}
            </p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>

          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {showValue ? "$1,245.30" : "••••••"}
            </p>
            <p className="text-xs text-muted-foreground">To claim</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <Button variant="success" className="gap-2">
            <Play className="w-4 h-4" />
            Spend Yield
          </Button>
          <Button variant="glass" className="gap-2">
            <ArrowDownToLine className="w-4 h-4" />
            Receive
          </Button>
          <Button variant="glass" className="gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary hover:bg-accent"
          >
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-primary">x402 Pay</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
