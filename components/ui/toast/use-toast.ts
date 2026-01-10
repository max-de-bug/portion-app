"use client";

import { useState, useEffect, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

// Global toast state management
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of toast (success, error, info, warning)
 * @param duration - Duration in ms (default: 3000)
 */
export const showToast = (
  message: string,
  type: Toast["type"] = "info",
  duration: number = 3000
) => {
  const id = Math.random().toString(36).substr(2, 9);
  const toast: Toast = { id, message, type, duration };
  
  toasts = [...toasts, toast];
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
};

/**
 * Dismiss a specific toast by ID
 */
export const dismissToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toasts = [];
  notifyListeners();
};

/**
 * Hook to subscribe to toast state
 */
export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    // Sync initial state
    setCurrentToasts([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const toast = useCallback((message: string, type: Toast["type"] = "info", duration?: number) => {
    return showToast(message, type, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  const dismissAll = useCallback(() => {
    dismissAllToasts();
  }, []);

  return {
    toasts: currentToasts,
    toast,
    dismiss,
    dismissAll,
    // Convenience methods
    success: useCallback((message: string, duration?: number) => showToast(message, "success", duration), []),
    error: useCallback((message: string, duration?: number) => showToast(message, "error", duration), []),
    info: useCallback((message: string, duration?: number) => showToast(message, "info", duration), []),
    warning: useCallback((message: string, duration?: number) => showToast(message, "warning", duration), []),
  };
}
