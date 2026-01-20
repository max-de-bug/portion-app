import { boolean, decimal, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiServices = pgTable("ai_services", {
    id: text("id").primaryKey(), 
    price: decimal("price", {precision: 12, scale: 6}).notNull(),
    platformFee: decimal("platform_fee", {precision: 12, scale: 6}).notNull(),
    description: text("description").notNull(),
    category: text("category"),
    pricingScheme: text("pricing_scheme").default("pay-per-use"),
    prepaidDiscount: integer("prepaid_discount").default(0), // % discount for prepaid
    isActive: boolean("is_active").notNull().default(true).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// X402 V2 Tables
// ============================================

/**
 * Sessions table - stores authenticated wallet sessions
 */
export const sessions = pgTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  nonce: text("nonce").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

/**
 * Nonces table - for replay protection
 */
export const nonces = pgTable("nonces", {
  nonce: text("nonce").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Prepaid balances table - stores user prepaid USD balances
 */
export const prepaidBalances = pgTable("prepaid_balances", {
  walletAddress: text("wallet_address").primaryKey(),
  balance: decimal("balance", { precision: 18, scale: 6 }).notNull().default("0"),
  lastTopup: timestamp("last_topup"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Prepaid transactions table - audit trail for all prepaid operations
 */
export const prepaidTransactions = pgTable("prepaid_transactions", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  type: text("type").notNull(), // 'topup' | 'deduction' | 'refund'
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  serviceId: text("service_id"),
  paymentTx: text("payment_tx"), // Solana tx signature for topups
  balanceAfter: decimal("balance_after", { precision: 18, scale: 6 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

/**
 * Usage metrics table - tracks all service usage for analytics and billing
 */
export const usageMetrics = pgTable("usage_metrics", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  serviceId: text("service_id").notNull(),
  paymentScheme: text("payment_scheme").notNull(), // 'pay-per-use' | 'prepaid' | 'subscription'
  amount: decimal("amount", { precision: 18, scale: 6 }),
  sessionId: text("session_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: text("metadata"), // JSON string for additional data
});

export type WaitlistEntry = typeof waitlist.$inferSelect;
export type NewWaitlistEntry = typeof waitlist.$inferInsert;

// X402 V2 Type Exports
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Nonce = typeof nonces.$inferSelect;
export type NewNonce = typeof nonces.$inferInsert;
export type PrepaidBalanceRecord = typeof prepaidBalances.$inferSelect;
export type PrepaidTransaction = typeof prepaidTransactions.$inferSelect;
export type UsageMetric = typeof usageMetrics.$inferSelect;

