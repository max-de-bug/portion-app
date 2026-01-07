"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Shield, CheckCircle, Zap, Activity } from "lucide-react";
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

const SERVICES = [
  { name: "OpenAI Payments", type: "API", source: "sUSDv Staking" },
  { name: "Vercel Analytics", type: "SaaS", source: "YaaS (Liquid)" },
  { name: "Anthropic API", type: "API", source: "sUSDv Staking" },
  { name: "AWS Cloudfront", type: "Cloud", source: "SOLO Rewards" },
  { name: "Supabase DB", type: "Cloud", source: "YaaS (Liquid)" },
  { name: "Midjourney Sub", type: "Content", source: "SOLO Rewards" },
];

export function TransactionSimulation() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", service: "OpenAI Payments", status: "Settled", time: "2m ago", amount: "$15.00", type: "API", source: "sUSDv Staking" },
    { id: "2", service: "Vercel Analytics", status: "Settled", time: "5m ago", amount: "$12.00", type: "SaaS", source: "YaaS Yield" },
  ]);
  const [pulse, setPulse] = useState(false);
  const [limitUsage, setLimitUsage] = useState(42);
  const [isSimulating, setIsSimulating] = useState(false);

  const addTransaction = useCallback(() => {
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const isSolo = service.source === "SOLO Rewards";
    const amount = isSolo 
      ? `${(Math.random() * 50 + 10).toFixed(0)} SOLO` 
      : `$${(Math.random() * 20 + 5).toFixed(2)}`;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      service: service.name,
      status: "Processing",
      time: "Just now",
      amount,
      type: service.type as any,
      source: service.source,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 5));
    setPulse(true);
    setTimeout(() => setPulse(false), 1000);

    // After 2 seconds, move to Validated
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === newTx.id ? { ...tx, status: "Validated" } : tx))
      );
      // Simulate limit usage increase
      setLimitUsage((prev) => Math.min(prev + 2, 100));
    }, 2000);

    // After 4 seconds, move to Settled
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === newTx.id ? { ...tx, status: "Settled" } : tx))
      );
    }, 4500);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        addTransaction();
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, addTransaction]);

  const handleSimulate = () => {
    setIsSimulating(true);
    addTransaction();
  };

  const handleReset = () => {
    setIsSimulating(false);
    setTransactions([]);
    setLimitUsage(0);
  };

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-3xl border border-border p-6 md:p-10 shadow-2xl relative overflow-hidden group">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className={cn("w-5 h-5 text-primary", isSimulating && "animate-pulse")} />
            <h4 className="text-2xl font-bold text-foreground">Spending Simulation</h4>
          </div>
          <p className="text-muted-foreground">Automated x402 payments powered by detected USDV yield</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSimulate} 
            disabled={isSimulating}
            className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-6 h-11 shadow-lg shadow-emerald-500/20"
          >
            {isSimulating ? "Simulating..." : "Detect & Spend"}
          </Button>
          <Button variant="outline" onClick={handleReset} className="h-11 font-bold">Reset</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 relative z-10">
        <div className="space-y-8">
          {/* Yield Capacity Card */}
          <div className="p-6 rounded-2xl bg-muted/40 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">YaaS Yield Capacity</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-success/20 text-success text-[10px] font-black tracking-tighter">100% UTILIZED</span>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-3 font-bold">
                  <span className="text-muted-foreground">Allocated for Payments</span>
                  <span className="text-primary">{limitUsage}%</span>
                </div>
                <div className="h-2.5 w-full bg-background/50 rounded-full overflow-hidden border border-border/20">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,163,255,0.4)]" 
                    style={{ width: `${limitUsage}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/40 border border-border/20">
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Yield Source</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Solomon YaaS
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-background/40 border border-border/20">
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Efficiency</span>
                  <span className="text-sm font-mono font-bold text-primary">99.9%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-dashed border-border/60 bg-primary/5 flex items-center justify-center min-h-[140px]">
            <div className="text-center">
                <Shield className={cn("w-10 h-10 text-primary mx-auto mb-3 transition-all duration-500", pulse && "scale-125 shadow-primary/50")} />
                <p className="text-sm font-bold text-foreground">Autonomous Authorization</p>
                <p className="text-xs text-muted-foreground">Signed via Portion Vault</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-bold text-foreground text-sm uppercase tracking-widest flex items-center gap-2 mb-6 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Live Audit Flow
          </h4>
          
          <div className="space-y-3">
            {transactions.length === 0 && (
              <div className="py-20 text-center border border-dashed border-border rounded-2xl opacity-50">
                <p className="text-sm text-muted-foreground">No active transaction flow</p>
              </div>
            )}
            {transactions.map((tx, idx) => (
              <div 
                 key={tx.id} 
                 className={cn(
                    "flex items-center justify-between p-4 rounded-2xl transition-all duration-500 border",
                    idx === 0 ? "bg-emerald-50 border-emerald-200 scale-[1.02] shadow-xl shadow-emerald-500/5" : "bg-white border-border opacity-80"
                 )}
                 style={{ animation: idx === 0 ? 'slideDown 0.5s ease-out' : 'none' }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    tx.status === "Processing" ? "bg-amber-500/20 text-amber-500 animate-spin" : 
                    tx.status === "Validated" ? "bg-blue-500/20 text-blue-500" : "bg-success/20 text-success"
                  )}>
                    {tx.status === "Processing" ? <Clock className="w-5 h-5" /> : 
                     tx.status === "Validated" ? <Shield className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-foreground">{tx.service}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase">{tx.type}</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        tx.status === "Processing" ? "bg-amber-500 animate-pulse" : 
                        tx.status === "Validated" ? "bg-blue-500" : "bg-success shadow-[0_0_5px_rgba(34,197,94,0.8)]"
                      )} />
                      {tx.status} • {tx.time} • Source: {tx.source}
                    </p>
                  </div>
                </div>
                <span className="text-base font-mono font-black text-primary">{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
