"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * Throttle function calls using requestAnimationFrame.
 * Useful for expensive operations like mouse move handlers.
 * 
 * @param callback - Function to throttle
 * @returns Throttled function
 */
export function useRAFThrottle<T extends (...args: unknown[]) => void>(
  callback: T
): T {
  const rafId = useRef<number | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);

  const throttledFn = useCallback((...args: Parameters<T>) => {
    lastArgs.current = args;

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        if (lastArgs.current) {
          callback(...lastArgs.current);
        }
        rafId.current = null;
      });
    }
  }, [callback]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return throttledFn;
}

/**
 * Debounce hook for delaying function execution.
 * 
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return debouncedFn;
}
