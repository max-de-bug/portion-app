"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuditStore, AuditEvent } from "@/app/store/useAuditStore";

const MAX_EVENTS = 100;
const RETENTION_DAYS = 7;

export type { AuditEvent };

/**
 * Hook to manage audit trail for compliance and activity tracking
 * Wraps the persistent useAuditStore
 */
export function useAuditTrail() {
  const { events, addEvent: storeAddEvent, clearEvents, pruneEvents } = useAuditStore();
  const [isLoading, setIsLoading] = useState(true);

  // Initial prune on mount (client-side only to match hydration)
  useEffect(() => {
    pruneEvents(MAX_EVENTS, RETENTION_DAYS * 24 * 60 * 60 * 1000);
    setIsLoading(false);
  }, [pruneEvents]);

  const formatTimeAgo = useCallback((timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  const addEvent = useCallback(
    (event: Omit<AuditEvent, "id" | "timestamp" | "time">) => {
      const newEvent: AuditEvent = {
        ...event,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        time: "Just now",
      };
      // Optimistically update local view if needed, but store handles it
      storeAddEvent(newEvent);
      return newEvent;
    },
    [storeAddEvent]
  );

  // Convenience methods for common audit events
  const logPolicyUpdate = useCallback(
    (policyName: string, change: string) => {
      addEvent({
        action: "Policy Updated",
        detail: `${policyName}: ${change}`,
        status: "success",
        category: "policy",
      });
    },
    [addEvent]
  );

  const logTransactionApproved = useCallback(
    (service: string, amount: string) => {
      addEvent({
        action: "Transaction Approved",
        detail: `${service} - ${amount}`,
        status: "success",
        category: "transaction",
      });
    },
    [addEvent]
  );

  const logTransactionDenied = useCallback(
    (reason: string) => {
      addEvent({
        action: "Transaction Denied",
        detail: reason,
        status: "error",
        category: "transaction",
      });
    },
    [addEvent]
  );

  const logWalletConnected = useCallback(
    (address: string) => {
      const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
      addEvent({
        action: "Wallet Connected",
        detail: shortAddress,
        status: "success",
        category: "wallet",
      });
    },
    [addEvent]
  );

  const logMerchantAdded = useCallback(
    (merchant: string) => {
      addEvent({
        action: "Merchant Added",
        detail: merchant,
        status: "success",
        category: "merchant",
      });
    },
    [addEvent]
  );

  const getRecentEvents = useCallback(
    (limit = 6) => {
      // Return events with processed time string
      // Note: We create new objects to avoid mutating store state with volatile "time" strings
      return events.slice(0, limit).map((e) => ({
        ...e,
        time: formatTimeAgo(e.timestamp),
      }));
    },
    [events, formatTimeAgo]
  );

  const getEventStats = useCallback(() => {
    const success = events.filter((e) => e.status === "success").length;
    const error = events.filter((e) => e.status === "error").length;
    const today = events.filter(
      (e) => Date.now() - e.timestamp < 24 * 60 * 60 * 1000
    ).length;

    return { success, error, today, total: events.length };
  }, [events]);

  return {
    events,
    isLoading, // Kept for API compatibility, though store is instant
    addEvent,
    logPolicyUpdate,
    logTransactionApproved,
    logTransactionDenied,
    logWalletConnected,
    logMerchantAdded,
    clearEvents,
    getRecentEvents,
    getEventStats,
  };
}
