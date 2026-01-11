import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp" | "time">) => Transaction;
  updateTransactionStatus: (id: string, status: Transaction["status"]) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (tx) => {
        const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTx: Transaction = {
          ...tx,
          id,
          timestamp: Date.now(),
          time: "Just now",
        };

        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 50),
        }));

        // Auto-progress status for demo
        if (tx.status === "Processing") {
          setTimeout(() => {
            get().updateTransactionStatus(id, "Validated");
          }, 2000);

          setTimeout(() => {
            get().updateTransactionStatus(id, "Settled");
          }, 4500);
        }

        return newTx;
      },

      updateTransactionStatus: (id, status) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, status } : tx
          ),
        }));
      },

      clearTransactions: () => {
        set({ transactions: [] });
      },
    }),
    {
      name: "portion_transactions_v3", // Versioned key to avoid legacy bugs
    }
  )
);
