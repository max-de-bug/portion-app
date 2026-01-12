import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Audit event types for tracking policy and transaction activity
 */
export interface AuditEvent {
  id: string;
  action: string;
  detail: string;
  timestamp: number;
  time: string;
  status: "success" | "error" | "info";
  category: "policy" | "transaction" | "wallet" | "merchant" | "system";
}

interface AuditState {
  events: AuditEvent[];
  addEvent: (event: AuditEvent) => void;
  clearEvents: () => void;
  pruneEvents: (maxEvents: number, retentionMs: number) => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (event) =>
        set((state) => ({ events: [event, ...state.events] })),
      clearEvents: () => set({ events: [] }),
      pruneEvents: (maxEvents, retentionMs) =>
        set((state) => {
          const cutoff = Date.now() - retentionMs;
          return {
            events: state.events
              .filter((e) => e.timestamp > cutoff)
              .slice(0, maxEvents),
          };
        }),
    }),
    {
      name: "portion_audit_trail_v1",
      partialize: (state) => ({ events: state.events }), // Only persist events
    }
  )
);
