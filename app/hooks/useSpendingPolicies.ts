"use client";

import { useState, useCallback, useEffect } from "react";
import { useYieldStore } from "@/app/store/useYieldStore";

/**
 * Spending policy types for x402 payments
 */
export interface SpendingPolicy {
  id: string;
  name: string;
  type: "daily_limit" | "merchant_whitelist" | "max_transaction";
  enabled: boolean;
  value: number | string[];
  maxValue?: number;
  status: "active" | "pending" | "disabled";
}

interface PolicyState {
  policies: SpendingPolicy[];
  dailySpent: number;
  lastReset: string;
}

const DEFAULT_POLICIES: SpendingPolicy[] = [
  {
    id: "daily_limit",
    name: "Daily Spending Limit",
    type: "daily_limit",
    enabled: true,
    value: 500,
    maxValue: 1000,
    status: "active",
  },
  {
    id: "merchant_whitelist",
    name: "Merchant Whitelist",
    type: "merchant_whitelist",
    enabled: true,
    value: ["OpenAI", "Anthropic", "AWS", "Portion"],
    status: "active",
  },
  {
    id: "max_transaction",
    name: "Max Transaction Size",
    type: "max_transaction",
    enabled: false,
    value: 100,
    maxValue: 500,
    status: "pending",
  },
];

const STORAGE_KEY = "portion_spending_policies";

/**
 * Hook to manage spending policies for x402 payments
 * Persists to localStorage with real-time updates
 */
export function useSpendingPolicies() {
  const { dailySpent, recordSpending: storeRecordSpending } = useYieldStore();
  const [policies, setPolicies] = useState<SpendingPolicy[]>(DEFAULT_POLICIES);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: PolicyState = JSON.parse(stored);
        setPolicies(data.policies);
        // Sync global store with persisted value if available
        const { setYield } = useYieldStore.getState();
        if (data.dailySpent) {
          useYieldStore.getState().recordSpending(data.dailySpent - useYieldStore.getState().dailySpent);
        }
      }
    } catch {
      // Use defaults on error
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isLoading) {
      const data: PolicyState = {
        policies,
        dailySpent,
        lastReset: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [policies, dailySpent, isLoading]);

  const updatePolicy = useCallback((id: string, updates: Partial<SpendingPolicy>) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const togglePolicy = useCallback((id: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, enabled: !p.enabled, status: !p.enabled ? "active" : "disabled" }
          : p
      )
    );
  }, []);

  const addMerchant = useCallback((merchant: string) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === "merchant_whitelist" && Array.isArray(p.value)) {
          return { ...p, value: [...p.value, merchant] };
        }
        return p;
      })
    );
  }, []);

  const removeMerchant = useCallback((merchant: string) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id === "merchant_whitelist" && Array.isArray(p.value)) {
          return { ...p, value: p.value.filter((m) => m !== merchant) };
        }
        return p;
      })
    );
  }, []);

  const getDailyLimit = useCallback(() => {
    const policy = policies.find((p) => p.id === "daily_limit");
    return typeof policy?.value === "number" ? policy.value : 500;
  }, [policies]);

  const getDailyRemaining = useCallback(() => {
    return Math.max(0, getDailyLimit() - dailySpent);
  }, [getDailyLimit, dailySpent]);

  const getDailyUsagePercent = useCallback(() => {
    const limit = getDailyLimit();
    return limit > 0 ? Math.min(100, (dailySpent / limit) * 100) : 0;
  }, [getDailyLimit, dailySpent]);

  const recordSpending = useCallback((amount: number) => {
    storeRecordSpending(amount);
  }, [storeRecordSpending]);

  const resetDailySpending = useCallback(() => {
    const { reset } = useYieldStore.getState();
    reset(); // Resetting yield store also resets dailySpent
  }, []);

  return {
    policies,
    dailySpent,
    dailyLimit: getDailyLimit(),
    dailyRemaining: getDailyRemaining(),
    dailyUsagePercent: getDailyUsagePercent(),
    isLoading,
    updatePolicy,
    togglePolicy,
    addMerchant,
    removeMerchant,
    recordSpending,
    resetDailySpending,
  };
}
