import { create } from "zustand";

interface YieldState {
  spendableYield: number;
  isInitialLoad: boolean;
  hasSubscription: boolean;
  dailySpent: number;
  
  // Actions
  setYield: (amount: number) => void;
  deductYield: (amount: number) => void;
  recordSpending: (amount: number) => void;
  toggleSubscription: (enabled: boolean) => void;
  reset: () => void;
}

/**
 * Global store for Solomon Labs yield
 * Ensures a single source of truth across all components (Dashboard, Modal, Stats)
 */
export const useYieldStore = create<YieldState>((set) => ({
  spendableYield: 0,
  isInitialLoad: true,
  hasSubscription: false,

  dailySpent: 0,

  setYield: (amount: number) => 
    set(() => ({ 
      spendableYield: amount,
      isInitialLoad: false 
    })),

  deductYield: (amount: number) => 
    set((state) => ({ 
      spendableYield: Math.max(0, state.spendableYield - amount) 
    })),

  recordSpending: (amount: number) =>
    set((state) => ({
      dailySpent: state.dailySpent + amount,
    })),

  toggleSubscription: (enabled: boolean) =>
    set(() => ({
      hasSubscription: enabled,
    })),

  reset: () => 
    set(() => ({ 
      spendableYield: 0, 
      dailySpent: 0,
      isInitialLoad: true,
      hasSubscription: false,
    })),
}));
