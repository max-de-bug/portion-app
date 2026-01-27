/**
 * X402 V2 Protocol Types for Solomon App
 * 
 * Implements Coinbase X402 V2 specification:
 * - Session-based authentication
 * - Prepaid balance model
 * - Service discovery
 * 
 * @see https://www.x402.org/writing/x402-v2-launch
 */

// ============================================
// X402 V2 Protocol Constants
// ============================================

export const X402VERSION = 2;

export const X402_HEADERS = {
  PAYMENT_SIGNATURE: 'payment-signature',
  PAYMENT_RESPONSE: 'payment-response',
  AUTHORIZATION: 'authorization',
  X_SESSION_TOKEN: 'x-session-token', // Legacy
  X_PAYMENT: 'x-payment',           // Legacy
} as const;

// ============================================
// Session Types
// ============================================

export interface X402Session {
  sessionId: string;
  walletAddress: string;
  nonce: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface SessionCreateRequest {
  walletAddress: string;
  signature: string; // Base64 encoded signature
  message: string;   // Original message that was signed
}

export interface SessionCreateResponse {
  sessionToken: string;
  expiresAt: Date;
  walletAddress: string;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: X402Session;
  error?: string;
}

// ============================================
// Service Discovery Types
// ============================================

export type PricingScheme = 'pay-per-use' | 'subscription' | 'prepaid';

export interface ServicePricing {
  scheme: PricingScheme;
  basePrice: string;        // Price in USD (as decimal string for precision)
  platformFee: string;      // Platform fee in USD
  prepaidDiscount?: number; // Percentage discount for prepaid users (0-100)
}

export interface X402ServiceMetadata {
  serviceId: string;
  name: string;
  description: string;
  endpoint: string;
  pricing: ServicePricing;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceDiscoveryFilters {
  category?: string;
  maxPrice?: number;
  pricingScheme?: PricingScheme;
  isActive?: boolean;
}

export interface ServiceDiscoveryResponse {
  version: number;
  network: string;
  services: X402ServiceMetadata[];
  total: number;
  filters: ServiceDiscoveryFilters;
}

// Bazaar Discovery V2 Format
export interface DiscoveryResourceV2 {
  resource: string;
  type: 'http' | 'mcp';
  x402Version: 2;
  metadata: Record<string, unknown>;
  lastUpdated: string;
  accepts: PaymentDetailsV2[];
}

// ============================================
// Prepaid Balance Types
// ============================================

export interface PrepaidBalance {
  walletAddress: string;
  balance: string;           // USD balance as decimal string
  lastTopup?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrepaidTopupRequest {
  walletAddress: string;
  amount: number;            // USD amount to add
  paymentTx: string;         // Solana transaction signature
}

export interface PrepaidTopupResponse {
  success: boolean;
  newBalance: string;
  transaction: {
    id: string;
    amount: string;
    timestamp: Date;
  };
}

export interface PrepaidDeductionResult {
  success: boolean;
  previousBalance: string;
  deducted: string;
  newBalance: string;
  error?: string;
}

export interface PrepaidTransaction {
  id: string;
  walletAddress: string;
  type: 'topup' | 'deduction' | 'refund';
  amount: string;
  serviceId?: string;
  paymentTx?: string;
  timestamp: Date;
}

// ============================================
// X402 V2 Payment Types (Official Spec)
// ============================================

export interface PaymentDetailsV2 {
  scheme: 'exact' | 'prepaid' | 'subscription';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset?: string;
  mimeType?: string;
  outputSchema?: {
    input: { type: string; method?: string };
    output: unknown;
  };
  extra?: Record<string, unknown>;
}

export interface PaymentRequiredResponseV2 {
  x402Version: 2;
  accepts: PaymentDetailsV2[];
  resource: string;
  error?: string;
}

export interface PaymentPayloadV2 {
  x402Version: 2;
  scheme: string;
  network: string;
  payload: {
    paymentId?: string;
    signature?: string;
    txSignature?: string; // Solana specific
    authorization?: {
      from: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface X402V2ExecuteResponse {
  success: boolean;
  paymentId: string;
  service: string;
  cost: number;
  paymentMethod: 'prepaid' | 'yield' | 'subscription';
  receipt: {
    id: string;
    amount: number;
    base: number;
    fee: number;
    currency: string;
    timestamp: string;
    network: string;
  };
  result: unknown;
  session?: {
    walletAddress?: string;
    expiresAt?: string | Date;
  };
}

// ============================================
// Usage Tracking Types
// ============================================

export interface UsageRecord {
  id: string;
  walletAddress: string;
  serviceId: string;
  paymentScheme: PricingScheme;
  amount: string;
  subscriptionId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// Nonce Types (for replay protection)
// ============================================

export interface NonceRecord {
  nonce: string;
  walletAddress: string;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}
