"use client";

import { memo } from "react";
import { Wallet, Activity, TrendingUp, Layers } from "lucide-react";
import { PoolStatCard } from "@/app/dashboard/_components/PoolStatCard";

interface StatsGridProps {
  stats: {
    tvl: number;
    volume24h: number;
    apr: number;
    activePositions: number;
  };
}

/**
 * Grid of pool statistics.
 * Memoized to prevent re-renders when other parts of the dashboard change.
 */
export const StatsGrid = memo(({ stats }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <PoolStatCard
        title="Total Value Locked"
        value={stats.tvl}
        prefix="$"
        icon={Wallet}
        trend={{ value: 12.5, isPositive: true }}
        gradient="from-emerald-500 to-teal-500"
        delay={0}
      />
      <PoolStatCard
        title="24h Volume"
        value={stats.volume24h}
        prefix="$"
        icon={Activity}
        trend={{ value: 8.2, isPositive: true }}
        gradient="from-blue-500 to-cyan-500"
        delay={0.1}
      />
      <PoolStatCard
        title="Pool APR"
        value={stats.apr}
        suffix="%"
        icon={TrendingUp}
        trend={{ value: 2.3, isPositive: true }}
        gradient="from-purple-500 to-indigo-500"
        delay={0.2}
      />
      <PoolStatCard
        title="Active Positions"
        value={stats.activePositions}
        icon={Layers}
        gradient="from-amber-500 to-orange-500"
        delay={0.3}
      />
    </div>
  );
});

StatsGrid.displayName = "StatsGrid";
