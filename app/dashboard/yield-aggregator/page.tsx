"use client";

import { useState, useEffect } from "react";
import { YieldProtocols } from "@/components/dashboard/YieldProtocols";
import { useChatStore } from "@/app/store/useChatStore";
import { AI_SERVICES } from "@/app/config/agent-services";
import { motion } from "framer-motion";
import { TrendingUp, RefreshCcw, ShieldCheck } from "lucide-react";

interface YieldOpportunity {
  id: string;
  protocol: string;
  name: string;
  apr: number;
  apy: number;
  tvl: number;
  riskScore: "Low" | "Medium" | "High";
  type: "Lending" | "Liquidity" | "Staking";
  token: string;
  link: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

import { useQuery } from "@tanstack/react-query";

export default function YieldAggregatorPage() {
  const [token, setToken] = useState<"USDV" | "SOLO">("USDV");
  const { setSelectedService, setInput } = useChatStore();

  const { 
    data: yieldData, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['yield-aggregator', token],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/aggregator/yields?token=${token}`);
      if (!res.ok) throw new Error("Failed to fetch yields");
      return res.json();
    }
  });

  const yields = yieldData?.yields || [];



  const handleOptimize = (opp: YieldOpportunity) => {
    const solanaAgent = AI_SERVICES.find(s => s.id === "solana-agent");
    if (solanaAgent) {
      setSelectedService(solanaAgent);
      setInput(`I want to optimize my USDV yield. Can you help me move my funds to ${opp.protocol} where the APY is ${opp.apy}%?`);
      
      // Trigger the agent button click visually or simply open it
      // For this demo, we assume the user will see the input pre-filled in the agent chat
      const agentButton = document.querySelector('button[class*="emerald-500"]') as HTMLButtonElement;
      if (agentButton) agentButton.click();
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-1"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Yield Aggregator</h1>
          </motion.div>
          <p className="text-muted-foreground">
            Automatically identifying the best risk-adjusted yield for your USDV on Solana.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Token Selector */}
          <div className="flex bg-accent/50 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setToken("USDV")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                token === "USDV" 
                ? "bg-primary text-white shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              USDV
            </button>
            <button
              onClick={() => setToken("SOLO")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                token === "SOLO" 
                ? "bg-primary text-white shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              SOLO
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Monitoring
          </div>
          <button 
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-accent hover:bg-accent/80 transition-colors"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

      </div>

      {/* Yield Ranker Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Top Opportunities</h2>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        <YieldProtocols 
          opportunities={yields} 
          isLoading={isLoading} 
          onOptimize={handleOptimize} 
        />
      </div>

      {/* Footer / Context */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border border-border/50"
      >
        <h3 className="font-bold mb-2">How it works</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          The Yield Aggregator tracks liquid staking yields, lending rates, and LP incentives across the Solana ecosystem. 
          When you click **Optimize**, the Portion AI Agent analyzes your current wallet balance and prepares 
          a non-custodial transaction to move your principal to the target protocol. 
          All transactions are signed by you, ensuring 100% security.
        </p>
      </motion.div>
    </main>
  );
}


