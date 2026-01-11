"use client";

import { Activity } from "lucide-react";
import { useTransactionActivity } from "@/app/hooks/useTransactionActivity";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "./_components/TransactionItem";

export function TransactionActivity() {
  const {
    transactions,
    isLoading,
    clearTransactions,
    getTransactionStats,
  } = useTransactionActivity();

  const stats = getTransactionStats();
  const recentTransactions = transactions.slice(0, 5);
  const hasTransactions = recentTransactions.length > 0;

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded-xl" />
          <div className="h-16 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground truncate">Transaction Activity</h3>
            {stats.processing > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 uppercase animate-pulse whitespace-nowrap flex-shrink-0">
                {stats.processing}
              </span>
            )}
          </div>
          {hasTransactions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTransactions}
              className="text-xs h-7 flex-shrink-0"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {!hasTransactions ? (
            <div className="py-12 text-center border border-dashed border-border rounded-xl opacity-60">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No recent transactions</p>
              <p className="text-xs text-muted-foreground mt-1">
                Transactions will appear when you use x402 services
              </p>
            </div>
          ) : (
            recentTransactions.map((tx, idx) => (
              <TransactionItem key={tx.id} tx={tx} isFirst={idx === 0} />
            ))
          )}
        </div>

        {/* Stats Footer */}
        {hasTransactions && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                <span className="font-bold text-success">{stats.settled}</span> settled
              </span>
              {stats.failed > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-bold text-destructive">{stats.failed}</span> failed
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Last 24 hours • {stats.total} total
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
