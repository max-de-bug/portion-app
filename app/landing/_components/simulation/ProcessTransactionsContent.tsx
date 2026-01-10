"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  service: string;
  status: "Processing" | "Validated" | "Settled";
  time: string;
  amount: string;
  type: "API" | "SaaS" | "Cloud" | "Content";
  source: string;
}

interface ProcessTransactionsContentProps {
  transactions: Transaction[];
  isSimulating: boolean;
  onReset: () => void;
}

/**
 * ProcessTransactionsContent - Extracted and memoized for performance.
 * Displays live transaction processing simulation.
 */
export const ProcessTransactionsContent = memo(function ProcessTransactionsContent({
  transactions,
  isSimulating,
  onReset,
}: ProcessTransactionsContentProps) {
  return (
    <div className="space-y-6 animate-tabContent">
      <div className="flex items-center justify-between mb-4 animate-stagger1">
        <div className="flex items-center gap-2">
          <Activity className={cn("w-5 h-5 text-primary", isSimulating && "animate-spin")} />
          <h3 className="text-lg font-bold text-foreground">Process Transactions</h3>
          {isSimulating && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 uppercase animate-pulse">
              Live
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="font-bold hover:scale-105 transition-transform"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 && (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl opacity-50 animate-stagger2">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Transactions will appear automatically...
            </p>
          </div>
        )}
        {transactions.map((tx, idx) => (
          <TransactionRow key={tx.id} transaction={tx} isLatest={idx === 0} />
        ))}
      </div>
    </div>
  );
});

// Memoized transaction row component
const TransactionRow = memo(function TransactionRow({
  transaction: tx,
  isLatest,
}: {
  transaction: Transaction;
  isLatest: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl transition-all duration-500 border",
        isLatest
          ? "bg-emerald-50 border-emerald-200 scale-[1.02] shadow-xl shadow-emerald-500/5"
          : "bg-white border-border opacity-80"
      )}
      style={{ animation: isLatest ? "slideDown 0.5s ease-out" : "none" }}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            tx.status === "Processing"
              ? "bg-amber-500/20 text-amber-500"
              : tx.status === "Validated"
              ? "bg-blue-500/20 text-blue-500"
              : "bg-success/20 text-success"
          )}
        >
          {tx.status === "Processing" ? (
            <Clock className="w-5 h-5 animate-spin" />
          ) : tx.status === "Validated" ? (
            <Shield className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5 animate-scaleIn" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-foreground">{tx.service}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase">
              {tx.type}
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                tx.status === "Processing"
                  ? "bg-amber-500 animate-pulse"
                  : tx.status === "Validated"
                  ? "bg-blue-500 animate-pulse"
                  : "bg-success shadow-[0_0_5px_rgba(34,197,94,0.8)]"
              )}
            />
            {tx.status} • {tx.time}
          </p>
        </div>
      </div>
      <span className="text-base font-mono font-black text-primary">{tx.amount}</span>
    </div>
  );
});

export type { Transaction };
