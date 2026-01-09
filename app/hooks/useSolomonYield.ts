"use client";

import { useQuery } from "@tanstack/react-query";

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

async function fetchYieldData(wallet: string, demo = false): Promise<YieldData> {
  const params = new URLSearchParams({ wallet });
  if (demo) params.append("demo", "true");
  
  const response = await fetch(`/api/solomon/yield?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch yield data");
  }
  return response.json();
}

async function fetchAPY(): Promise<{ apy: number; source: string }> {
  const response = await fetch("/api/solomon/apy");
  if (!response.ok) {
    // Return default on error
    return { apy: 10.3, source: "default" };
  }
  return response.json();
}

/**
 * Hook to fetch user's yield data from Solomon Labs
 */
export function useSolomonYield(walletAddress?: string, demo = false) {
  return useQuery({
    queryKey: ["solomonYield", walletAddress, demo],
    queryFn: () => fetchYieldData(walletAddress!, demo),
    enabled: !!walletAddress,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });
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
  const { data, isLoading, error } = useSolomonYield(walletAddress);
  
  return {
    spendableYield: data?.spendableYield ?? 0,
    susdvBalance: data?.susdvBalance ?? 0,
    exchangeRate: data?.exchangeRate ?? 1,
    isLoading,
    error,
    isDemo: data?.isDemo ?? false,
  };
}
