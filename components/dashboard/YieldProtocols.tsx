"use client";

import { motion } from "framer-motion";
import { TrendingUp, Shield, Zap, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface YieldProtocolsProps {
  opportunities: YieldOpportunity[];
  isLoading: boolean;
  onOptimize: (opp: YieldOpportunity) => void;
}

export const YieldProtocols = ({ opportunities, isLoading, onOptimize }: YieldProtocolsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {opportunities.map((opp, index) => (
        <motion.div
          key={opp.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl"
        >
          {/* Hero Gradient Background */}
          <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity bg-gradient-to-br ${
            opp.riskScore === "Low" ? "from-emerald-500 to-teal-500" :
            opp.riskScore === "Medium" ? "from-blue-500 to-indigo-500" :
            "from-orange-500 to-red-500"
          }`} />

          <div className="p-6 relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {opp.protocol}
                </h3>
                <p className="text-xs text-muted-foreground">{opp.name}</p>
              </div>
              <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                opp.riskScore === "Low" ? "bg-emerald-500/10 text-emerald-500" :
                opp.riskScore === "Medium" ? "bg-blue-500/10 text-blue-500" :
                "bg-orange-500/10 text-orange-500"
              }`}>
                {opp.riskScore} Risk
              </div>
            </div>

            {/* Yield Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 rounded-xl bg-accent/50 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">APY</p>
                <p className="text-2xl font-bold text-primary">{opp.apy.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/50 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">TVL</p>
                <p className="text-sm font-bold text-foreground">
                  ${(opp.tvl / 1e6).toFixed(1)}M
                </p>
              </div>
            </div>

            {/* Tags & Actions */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary" /> {opp.type}
                </span>
              </div>
              
              <Button 
                onClick={() => onOptimize(opp)}
                size="sm" 
                variant="ghost" 
                className="h-8 gap-2 hover:bg-primary hover:text-white transition-all transform group-active:scale-95"
              >
                <span>Optimize</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* External Link Overlay */}
          <a 
            href={opp.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      ))}
    </div>
  );
};
