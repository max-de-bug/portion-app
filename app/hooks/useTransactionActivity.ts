import { useTransactionStore, Transaction } from "@/app/store/useTransactionStore";

export type { Transaction };

/**
 * Hook to manage transaction activity for x402 payments
 * Uses global Zustand store for cross-component synchronization
 */
export function useTransactionActivity() {
  const store = useTransactionStore();

  return {
    transactions: store.transactions,
    isLoading: false, // Zustand doesn't have an async 'initial load' in this setup
    addTransaction: store.addTransaction,
    updateTransactionStatus: store.updateTransactionStatus,
    clearTransactions: store.clearTransactions,
    getRecentTransactions: (limit = 5) => store.transactions.slice(0, limit),
    getTransactionStats: () => {
      const processing = store.transactions.filter((tx) => tx.status === "Processing").length;
      const settled = store.transactions.filter((tx) => tx.status === "Settled").length;
      const failed = store.transactions.filter((tx) => tx.status === "Failed").length;
      const total = store.transactions.length;

      return { processing, settled, failed, total };
    },
  };
}
