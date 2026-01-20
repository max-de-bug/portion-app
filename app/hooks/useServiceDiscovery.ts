"use client";

/**
 * Service Discovery Hook
 * 
 * Fetches available services from the X402 V2 discovery endpoint
 */

import { useState, useEffect, useCallback } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";

interface ServicePricing {
  scheme: 'pay-per-use' | 'subscription' | 'prepaid';
  basePrice: string;
  platformFee: string;
  prepaidDiscount?: number;
}

interface X402Service {
  serviceId: string;
  name: string;
  description: string;
  endpoint: string;
  pricing: ServicePricing;
  category?: string;
  isActive: boolean;
}

interface DiscoveryFilters {
  category?: string;
  maxPrice?: number;
  pricingScheme?: string;
}

interface DiscoveryState {
  services: X402Service[];
  categories: string[];
  pricingSummary: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    totalServices: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export function useServiceDiscovery() {
  const [state, setState] = useState<DiscoveryState>({
    services: [],
    categories: [],
    pricingSummary: null,
    isLoading: true,
    error: null,
  });

  const [filters, setFilters] = useState<DiscoveryFilters>({});

  /**
   * Fetch services with optional filters
   */
  const fetchServices = useCallback(async (appliedFilters?: DiscoveryFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();
      const f = appliedFilters || filters;
      
      if (f.category) queryParams.append("category", f.category);
      if (f.maxPrice !== undefined) queryParams.append("maxPrice", f.maxPrice.toString());
      if (f.pricingScheme) queryParams.append("pricingScheme", f.pricingScheme);

      const url = `${BACKEND_URL}/x402/discover?${queryParams.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch services");

      const data = await res.json();

      setState(prev => ({
        ...prev,
        services: data.services || [],
        isLoading: false,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : "Failed to fetch services",
      }));
    }
  }, [filters]);

  /**
   * Fetch categories
   */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/x402/discover/categories`);
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, categories: data.categories || [] }));
      }
    } catch (e) {
      console.error("[useServiceDiscovery] Failed to fetch categories:", e);
    }
  }, []);

  /**
   * Fetch pricing summary
   */
  const fetchPricingSummary = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/x402/discover/pricing`);
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, pricingSummary: data }));
      }
    } catch (e) {
      console.error("[useServiceDiscovery] Failed to fetch pricing summary:", e);
    }
  }, []);

  /**
   * Get a specific service by ID
   */
  const getService = useCallback(async (serviceId: string): Promise<X402Service | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/x402/service/${serviceId}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      console.error("[useServiceDiscovery] Failed to get service:", e);
      return null;
    }
  }, []);

  /**
   * Apply filters and refetch
   */
  const applyFilters = useCallback((newFilters: DiscoveryFilters) => {
    setFilters(newFilters);
    fetchServices(newFilters);
  }, [fetchServices]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    fetchServices({});
  }, [fetchServices]);

  // Initial fetch
  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchPricingSummary();
  }, []);

  return {
    // State
    services: state.services,
    categories: state.categories,
    pricingSummary: state.pricingSummary,
    isLoading: state.isLoading,
    error: state.error,
    filters,

    // Actions
    fetchServices,
    getService,
    applyFilters,
    clearFilters,
    refetch: fetchServices,
  };
}
