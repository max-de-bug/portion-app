"use client";

/**
 * Pool Dashboard
 * 
 * Concentrated Liquidity Pool Dashboard with premium UI
 * Features interactive liquidity bin visualization, stats, and position management
 */

import { useState, useMemo, useCallback } from "react";
import { LiquidityBinsChart } from "@/app/dashboard/_components/LiquidityBinsChart";
import { AddLiquidityPanel } from "@/app/dashboard/_components/AddLiquidityPanel";
import { RemoveLiquidityModal } from "@/app/dashboard/_components/RemoveLiquidityModal";

// Local sub-components
import { BackgroundElements } from "./_components/BackgroundElements";
import { PoolHeader } from "./_components/PoolHeader";
import { StatsGrid } from "./_components/StatsGrid";
import { AboutSection } from "./_components/AboutSection";

// Data
import { MOCK_POOLS, MOCK_STATS, generateMockBins } from "./_mock/data";

export default function PoolDashboardPage() {
  // --- State ---
  const [selectedPool, setSelectedPool] = useState(MOCK_POOLS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // --- Callbacks ---
  const handlePoolSelect = useCallback((pool: typeof MOCK_POOLS[0]) => {
    setSelectedPool(pool);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // --- Derived State ---
  const currentPrice = selectedPool.price;
  const bins = useMemo(() => generateMockBins(currentPrice), [currentPrice]);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-muted/30">
      <BackgroundElements />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <PoolHeader 
          selectedPool={selectedPool}
          onPoolSelect={handlePoolSelect}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />

        <StatsGrid stats={MOCK_STATS} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Liquidity Bins Chart - Takes 2 columns */}
          <div className="lg:col-span-2 xl:col-span-2">
            <LiquidityBinsChart
              bins={bins}
              currentPrice={currentPrice}
              tokenA={selectedPool.token}
              tokenB={selectedPool.base}
            />
          </div>

          {/* Inline Add Liquidity & Position Management Panel */}
          <div className="lg:col-span-2 xl:col-span-1">
            <AddLiquidityPanel 
              pool={selectedPool} 
              onRefresh={handleRefresh}
              onRemovePosition={() => setShowRemoveModal(true)}
            />
          </div>
        </div>

        <AboutSection />
      </div>

      <RemoveLiquidityModal 
        isOpen={showRemoveModal} 
        onClose={() => setShowRemoveModal(false)} 
        pool={selectedPool} 
      />
    </main>
  );
}
