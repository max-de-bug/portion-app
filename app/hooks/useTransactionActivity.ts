"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Transaction types for x402 payments
 */
export interface Transaction {
  id: string;
  service: string;
  type: "API" | "SaaS" | "Cloud" | "Content" | "Other";
  amount: string;
  status: "Processing" | "Validated" | "Settled" | "Failed";
  source: string;
  time: string;
  timestamp: number;
}

const STORAGE_KEY = "portion_transactions";

/**
 * Hook to manage transaction activity for x402 payments
 * Persists to localStorage with real-time updates
 */
export function useTransactionActivity() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: Transaction[] = JSON.parse(stored);
        // Filter out transactions older than 24 hours
        const recentTransactions = data.filter(
          (tx) => Date.now() - tx.timestamp < 24 * 60 * 60 * 1000
        );
        setTransactions(recentTransactions);
      }
    } catch {
      // Use empty array on error
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "timestamp" | "time">) => {
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      time: "Just now",
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 50)); // Keep max 50

    // Auto-progress status for demo
    if (tx.status === "Processing") {
      setTimeout(() => {
        updateTransactionStatus(newTx.id, "Validated");
      }, 2000);

      setTimeout(() => {
        updateTransactionStatus(newTx.id, "Settled");
      }, 4500);
    }

    return newTx;
  }, []);

  const updateTransactionStatus = useCallback(
    (id: string, status: Transaction["status"]) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
      );
    },
    []
  );

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  const getRecentTransactions = useCallback(
    (limit = 5) => {
      return transactions.slice(0, limit);
    },
    [transactions]
  );

  const getTransactionStats = useCallback(() => {
    const processing = transactions.filter((tx) => tx.status === "Processing").length;
    const settled = transactions.filter((tx) => tx.status === "Settled").length;
    const failed = transactions.filter((tx) => tx.status === "Failed").length;
    const total = transactions.length;

    return { processing, settled, failed, total };
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransactionStatus,
    clearTransactions,
    getRecentTransactions,
    getTransactionStats,
  };
}
