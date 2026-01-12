"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useYieldStore } from "@/app/store/useYieldStore";

/**
 * Yield data from Solomon Labs YASS (Yield as a Stablecoin Strategy)
 * 
 * Flow: USDV → stake → sUSDV → earn yield via exchange rate appreciation
 */
interface YieldData {
  wallet: string;
  network: string;
  
  // Token balances
  usdvBalance: number;   // Unstaked USDV
  susdvBalance: number;  // Staked sUSDV
  
  // Yield calculation
  exchangeRate: number;     // sUSDV → USDV rate (increases over time)
  principalValue: number;   // Original deposit value
  currentValue: number;     // Current value if converted
  spendableYield: number;   // Available to spend via x402
  
  // Projections
  apy: number;
  dailyYield: number;
  monthlyYield: number;
  yearlyYield: number;
  
  // Status
  isDemo: boolean;
  timestamp: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function fetchYieldData(wallet: string, demo = false): Promise<YieldData> {
  // Fastify route: /api/yield/:wallet
  const url = `${BACKEND_URL}/api/yield/${wallet}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch yield data: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Map Fastify response to YieldData interface
    // Fastify returns { ...yieldInfo, spendable }
    return {
      wallet,
      network: "devnet",
      usdvBalance: data.usdvBalance || 0,
      susdvBalance: data.susdvBalance || 0,
      exchangeRate: data.exchangeRate || 1,
      principalValue: data.principalValue || 0,
      currentValue: data.currentValue || 0,
      spendableYield: data.spendable || 0, // Mapped from 'spendable'
      apy: data.apy || 10.3,
      dailyYield: data.dailyYield || 0,
      monthlyYield: data.monthlyYield || 0,
      yearlyYield: data.yearlyYield || 0,
      isDemo: false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Failed to fetch yield from backend, falling back to empty state", error);
    // Return empty/zero state on failure so UI doesn't crash
    return {
      wallet,
      network: "error",
      usdvBalance: 0,
      susdvBalance: 0,
      exchangeRate: 1,
      principalValue: 0,
      currentValue: 0,
      spendableYield: 0,
      apy: 10.3,
      dailyYield: 0,
      monthlyYield: 0,
      yearlyYield: 0,
      isDemo: true,
      timestamp: new Date().toISOString(),
    };
  }
}

async function fetchAPY(): Promise<{ apy: number; source: string }> {
  // Fastify route: /api/apy
  try {
    const response = await fetch(`${BACKEND_URL}/api/apy`);
    if (!response.ok) {
      return { apy: 10.3, source: "default" };
    }
    return response.json();
  } catch {
    return { apy: 10.3, source: "default" };
  }
}

/**
 * Hook to fetch user's yield data from Solomon Labs
 */
export function useSolomonYield(walletAddress?: string, demo = false) {
  return useQuery({
    queryKey: ["solomonYield", walletAddress, demo],
    queryFn: () => fetchYieldData(walletAddress!, demo),
    enabled: !!walletAddress,
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 120 * 1000, // Refetch every 2 minutes
  });
}

/**
 * Hook to fetch user's yield data AND sync with global store
 */
export function useSolomonYieldSync(walletAddress?: string, demo = false) {
  const query = useSolomonYield(walletAddress, demo);
  const setYield = useYieldStore((state) => state.setYield);

  useEffect(() => {
    if (query.data?.spendableYield !== undefined) {
      setYield(query.data.spendableYield);
    }
  }, [query.data?.spendableYield, setYield]);

  return query;
}

/**
 * Hook to fetch current APY
 */
export function useSolomonAPY() {
  return useQuery({
    queryKey: ["solomonAPY"],
    queryFn: fetchAPY,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get spendable yield (for x402 payments)
 */
export function useSpendableYield(walletAddress?: string) {
  const { data, isLoading, error } = useSolomonYieldSync(walletAddress);
  const storeYield = useYieldStore((state) => state.spendableYield);
  
  return {
    spendableYield: storeYield || (data?.spendableYield ?? 0),
    susdvBalance: data?.susdvBalance ?? 0,
    exchangeRate: data?.exchangeRate ?? 1,
    isLoading,
    error,
    isDemo: data?.isDemo ?? false,
  };
}

/**
 * Hook for dashboard stats that need to stay in sync with x402 spending
 */
export function useRealtimeYield(walletAddress?: string) {
  const { data, isLoading } = useSolomonYieldSync(walletAddress);
  const spendableYield = useYieldStore((state) => state.spendableYield);
  
  const principalValue = data?.principalValue ?? 0;
  // If we have store yield, we use it to calculate the real-time current value
  const currentValue = data ? principalValue + spendableYield : 0;
  const totalYield = spendableYield;
  
  return {
    totalYield,
    currentValue,
    principalValue,
    isLoading,
    yieldDetected: (data?.susdvBalance ?? 0) > 0 ? 1 : 0
  };
}
