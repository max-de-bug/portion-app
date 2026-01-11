import { create } from "zustand";

interface YieldState {
  spendableYield: number;
  isInitialLoad: boolean;
  
  // Actions
  setYield: (amount: number) => void;
  deductYield: (amount: number) => void;
  reset: () => void;
}

/**
 * Global store for Solomon Labs yield
 * Ensures a single source of truth across all components (Dashboard, Modal, Stats)
 */
export const useYieldStore = create<YieldState>((set) => ({
  spendableYield: 0,
  isInitialLoad: true,

  setYield: (amount: number) => 
    set(() => ({ 
      spendableYield: amount,
      isInitialLoad: false 
    })),

  deductYield: (amount: number) => 
    set((state) => ({ 
      spendableYield: Math.max(0, state.spendableYield - amount) 
    })),

  reset: () => 
    set(() => ({ 
      spendableYield: 0, 
      isInitialLoad: true 
    })),
}));
