"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Custom hook to detect user's reduced motion preference.
 * Respects the `prefers-reduced-motion` media query for accessibility.
 * 
 * @returns boolean - true if user prefers reduced motion
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * const variants = {
 *   hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
 *   visible: { opacity: 1, y: 0 }
 * };
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Handle changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation configuration that respects reduced motion preference.
 * Use this for consistent animation handling across the app.
 */
export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();

  return useMemo(() => ({
    // Duration multiplier (0 for instant, 1 for full)
    durationMultiplier: prefersReducedMotion ? 0 : 1,
    
    // Whether to skip animations entirely
    skipAnimations: prefersReducedMotion,
    
    // Default transition for reduced motion
    transition: prefersReducedMotion 
      ? { duration: 0 } 
      : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    
    // Stagger configuration
    stagger: prefersReducedMotion ? 0 : 0.1,
  }), [prefersReducedMotion]);
}

/**
 * Creates motion variants that respect reduced motion preference.
 * 
 * @param config - Animation configuration
 * @returns Framer Motion variants object
 */
export function createMotionVariants(config: {
  hidden?: Record<string, unknown>;
  visible?: Record<string, unknown>;
  prefersReducedMotion: boolean;
}) {
  const { hidden = {}, visible = {}, prefersReducedMotion } = config;

  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.1 } },
    };
  }

  return {
    hidden: { opacity: 0, ...hidden },
    visible: { opacity: 1, ...visible },
  };
}
