/**
 * X402 V2 Service Discovery
 * 
 * Implements automatic service discovery for the X402 V2 protocol:
 * - Service registry with metadata
 * - Filtering and search capabilities
 * - Pricing information
 */

import { db } from "../db";
import { aiServices } from "../db/schema";
import { eq } from "drizzle-orm";
import type {
  X402ServiceMetadata,
  ServiceDiscoveryFilters,
  ServiceDiscoveryResponse,
  PricingScheme,
} from "../types/x402-v2";

/**
 * Discover available services with optional filters
 */
export async function discoverServices(
  filters?: ServiceDiscoveryFilters
): Promise<ServiceDiscoveryResponse> {
  // Build query conditions
  const conditions = [];
  
  // Always filter for active services unless explicitly requested
  if (filters?.isActive !== false) {
    conditions.push(eq(aiServices.isActive, true));
  }

  // Get all services (Drizzle doesn't have great dynamic where clause support)
  const allServices = await db
    .select()
    .from(aiServices)
    .where(eq(aiServices.isActive, true));

  // Apply filters in-memory for flexibility
  let filteredServices = allServices;

  if (filters?.category) {
    filteredServices = filteredServices.filter(
      s => s.category === filters.category
    );
  }

  if (filters?.maxPrice !== undefined) {
    filteredServices = filteredServices.filter(
      s => parseFloat(s.price) <= filters.maxPrice!
    );
  }

  if (filters?.pricingScheme) {
    filteredServices = filteredServices.filter(
      s => (s.pricingScheme || 'pay-per-use') === filters.pricingScheme
    );
  }

  // Transform to X402ServiceMetadata format
  const services: X402ServiceMetadata[] = filteredServices.map(s => ({
    serviceId: s.id,
    name: s.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: s.description,
    endpoint: `/x402/execute/${s.id}`,
    pricing: {
      scheme: (s.pricingScheme || 'pay-per-use') as PricingScheme,
      basePrice: s.price,
      platformFee: s.platformFee,
      prepaidDiscount: s.prepaidDiscount || 0,
    },
    category: s.category ?? undefined,
    isActive: s.isActive,
    createdAt: s.updatedAt, // Using updatedAt as createdAt proxy
    updatedAt: s.updatedAt,
  }));

  return {
    services,
    total: services.length,
    filters: filters || {},
  };
}

/**
 * Get a specific service by ID
 */
export async function getServiceById(
  serviceId: string
): Promise<X402ServiceMetadata | null> {
  const [service] = await db
    .select()
    .from(aiServices)
    .where(eq(aiServices.id, serviceId))
    .limit(1);

  if (!service) {
    return null;
  }

  return {
    serviceId: service.id,
    name: service.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: service.description,
    endpoint: `/x402/execute/${service.id}`,
    pricing: {
      scheme: (service.pricingScheme || 'pay-per-use') as PricingScheme,
      basePrice: service.price,
      platformFee: service.platformFee,
      prepaidDiscount: service.prepaidDiscount || 0,
    },
    category: service.category ?? undefined,
    isActive: service.isActive,
    createdAt: service.updatedAt,
    updatedAt: service.updatedAt,
  };
}

/**
 * Get all service categories
 */
export async function getServiceCategories(): Promise<string[]> {
  const services = await db
    .select({ category: aiServices.category })
    .from(aiServices)
    .where(eq(aiServices.isActive, true));

  const categories = new Set<string>();
  services.forEach(s => {
    if (s.category) categories.add(s.category);
  });

  return Array.from(categories).sort();
}

/**
 * Get service pricing summary (for UI display)
 */
export async function getServicePricingSummary(): Promise<{
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  totalServices: number;
}> {
  const services = await db
    .select({ price: aiServices.price })
    .from(aiServices)
    .where(eq(aiServices.isActive, true));

  if (services.length === 0) {
    return { minPrice: 0, maxPrice: 0, avgPrice: 0, totalServices: 0 };
  }

  const prices = services.map(s => parseFloat(s.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  return {
    minPrice,
    maxPrice,
    avgPrice: Math.round(avgPrice * 1000000) / 1000000,
    totalServices: services.length,
  };
}
