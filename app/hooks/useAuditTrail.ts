"use client";

import { useState, useCallback, useEffect } from "react";

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

const STORAGE_KEY = "portion_audit_trail";
const MAX_EVENTS = 100;
const RETENTION_DAYS = 7;

/**
 * Hook to manage audit trail for compliance and activity tracking
 * Persists to localStorage with automatic cleanup of old events
 */
export function useAuditTrail() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: AuditEvent[] = JSON.parse(stored);
        // Filter out events older than retention period
        const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const recentEvents = data.filter((e) => e.timestamp > cutoff);
        setEvents(recentEvents);
      }
    } catch {
      // Use empty array on error
    }
    setIsLoading(false);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoading]);

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

      setEvents((prev) => [newEvent, ...prev].slice(0, MAX_EVENTS));
      return newEvent;
    },
    []
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

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getRecentEvents = useCallback(
    (limit = 6) => {
      // Update time strings before returning
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
    isLoading,
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
