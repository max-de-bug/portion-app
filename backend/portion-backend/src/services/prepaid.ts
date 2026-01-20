/**
 * X402 V2 Prepaid Balance Service
 * 
 * Implements prepaid balance management for the X402 V2 protocol:
 * - Balance tracking per wallet
 * - Top-up with Solana payment verification
 * - Deduction for service usage
 * - Transaction history
 */

import { db } from "../db";
import { prepaidBalances, prepaidTransactions, aiServices } from "../db/schema";
import { eq } from "drizzle-orm";
import type {
  PrepaidBalance,
  PrepaidTopupRequest,
  PrepaidTopupResponse,
  PrepaidDeductionResult,
  PrepaidTransaction,
} from "../types/x402-v2";

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `ptx-${timestamp}-${random}`;
}

/**
 * Get prepaid balance for a wallet
 */
export async function getPrepaidBalance(walletAddress: string): Promise<PrepaidBalance> {
  const [record] = await db
    .select()
    .from(prepaidBalances)
    .where(eq(prepaidBalances.walletAddress, walletAddress))
    .limit(1);

  if (!record) {
    // Return zero balance if no record exists
    return {
      walletAddress,
      balance: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    walletAddress: record.walletAddress,
    balance: record.balance,
    lastTopup: record.lastTopup ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Top up prepaid balance
 */
export async function topupPrepaidBalance(
  request: PrepaidTopupRequest
): Promise<PrepaidTopupResponse> {
  const { walletAddress, amount, paymentTx } = request;

  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Get current balance
  const currentBalance = await getPrepaidBalance(walletAddress);
  const currentBalanceNum = parseFloat(currentBalance.balance);
  const newBalanceNum = currentBalanceNum + amount;
  const newBalance = newBalanceNum.toFixed(6);
  const now = new Date();

  // Upsert balance
  const [existingRecord] = await db
    .select()
    .from(prepaidBalances)
    .where(eq(prepaidBalances.walletAddress, walletAddress))
    .limit(1);

  if (existingRecord) {
    await db
      .update(prepaidBalances)
      .set({
        balance: newBalance,
        lastTopup: now,
        updatedAt: now,
      })
      .where(eq(prepaidBalances.walletAddress, walletAddress));
  } else {
    await db.insert(prepaidBalances).values({
      walletAddress,
      balance: newBalance,
      lastTopup: now,
    });
  }

  // Record transaction
  const transactionId = generateTransactionId();
  await db.insert(prepaidTransactions).values({
    id: transactionId,
    walletAddress,
    type: "topup",
    amount: amount.toFixed(6),
    paymentTx,
    balanceAfter: newBalance,
  });

  console.log(`[Prepaid] Topup: ${walletAddress} +$${amount}, new balance: $${newBalance}`);

  return {
    success: true,
    newBalance,
    transaction: {
      id: transactionId,
      amount: amount.toFixed(6),
      timestamp: now,
    },
  };
}

/**
 * Deduct from prepaid balance for service usage
 */
export async function deductPrepaidBalance(
  walletAddress: string,
  amount: number,
  serviceId?: string
): Promise<PrepaidDeductionResult> {
  if (amount <= 0) {
    return {
      success: false,
      previousBalance: "0",
      deducted: "0",
      newBalance: "0",
      error: "Amount must be positive",
    };
  }

  // Get current balance
  const [record] = await db
    .select()
    .from(prepaidBalances)
    .where(eq(prepaidBalances.walletAddress, walletAddress))
    .limit(1);

  if (!record) {
    return {
      success: false,
      previousBalance: "0",
      deducted: "0",
      newBalance: "0",
      error: "No prepaid balance found",
    };
  }

  const previousBalance = parseFloat(record.balance);
  
  if (previousBalance < amount) {
    return {
      success: false,
      previousBalance: previousBalance.toFixed(6),
      deducted: "0",
      newBalance: previousBalance.toFixed(6),
      error: "Insufficient prepaid balance",
    };
  }

  const newBalanceNum = previousBalance - amount;
  const newBalance = newBalanceNum.toFixed(6);
  const now = new Date();

  // Update balance
  await db
    .update(prepaidBalances)
    .set({
      balance: newBalance,
      updatedAt: now,
    })
    .where(eq(prepaidBalances.walletAddress, walletAddress));

  // Record transaction
  const transactionId = generateTransactionId();
  await db.insert(prepaidTransactions).values({
    id: transactionId,
    walletAddress,
    type: "deduction",
    amount: amount.toFixed(6),
    serviceId,
    balanceAfter: newBalance,
  });

  console.log(`[Prepaid] Deduction: ${walletAddress} -$${amount} for ${serviceId || 'unknown'}, new balance: $${newBalance}`);

  return {
    success: true,
    previousBalance: previousBalance.toFixed(6),
    deducted: amount.toFixed(6),
    newBalance,
  };
}

/**
 * Refund to prepaid balance (for failed transactions)
 */
export async function refundPrepaidBalance(
  walletAddress: string,
  amount: number,
  serviceId?: string
): Promise<PrepaidDeductionResult> {
  if (amount <= 0) {
    return {
      success: false,
      previousBalance: "0",
      deducted: "0",
      newBalance: "0",
      error: "Amount must be positive",
    };
  }

  // Get current balance
  const currentBalance = await getPrepaidBalance(walletAddress);
  const previousBalanceNum = parseFloat(currentBalance.balance);
  const newBalanceNum = previousBalanceNum + amount;
  const newBalance = newBalanceNum.toFixed(6);
  const now = new Date();

  // Update balance
  const [existingRecord] = await db
    .select()
    .from(prepaidBalances)
    .where(eq(prepaidBalances.walletAddress, walletAddress))
    .limit(1);

  if (existingRecord) {
    await db
      .update(prepaidBalances)
      .set({
        balance: newBalance,
        updatedAt: now,
      })
      .where(eq(prepaidBalances.walletAddress, walletAddress));
  } else {
    await db.insert(prepaidBalances).values({
      walletAddress,
      balance: newBalance,
    });
  }

  // Record transaction
  const transactionId = generateTransactionId();
  await db.insert(prepaidTransactions).values({
    id: transactionId,
    walletAddress,
    type: "refund",
    amount: amount.toFixed(6),
    serviceId,
    balanceAfter: newBalance,
  });

  console.log(`[Prepaid] Refund: ${walletAddress} +$${amount} for ${serviceId || 'unknown'}, new balance: $${newBalance}`);

  return {
    success: true,
    previousBalance: previousBalanceNum.toFixed(6),
    deducted: `-${amount.toFixed(6)}`, // Negative to indicate refund
    newBalance,
  };
}

/**
 * Get transaction history for a wallet
 */
export async function getPrepaidTransactions(
  walletAddress: string,
  limit: number = 20
): Promise<PrepaidTransaction[]> {
  const records = await db
    .select()
    .from(prepaidTransactions)
    .where(eq(prepaidTransactions.walletAddress, walletAddress))
    .orderBy(prepaidTransactions.timestamp)
    .limit(limit);

  return records.map(record => ({
    id: record.id,
    walletAddress: record.walletAddress,
    type: record.type as 'topup' | 'deduction' | 'refund',
    amount: record.amount,
    serviceId: record.serviceId ?? undefined,
    paymentTx: record.paymentTx ?? undefined,
    timestamp: record.timestamp,
  }));
}

/**
 * Calculate prepaid discount for a service
 */
export async function calculatePrepaidPrice(
  serviceId: string,
  basePrice: number
): Promise<{ discountedPrice: number; discount: number }> {
  const [service] = await db
    .select()
    .from(aiServices)
    .where(eq(aiServices.id, serviceId))
    .limit(1);

  if (!service || !service.prepaidDiscount) {
    return { discountedPrice: basePrice, discount: 0 };
  }

  const discountPercent = service.prepaidDiscount || 0;
  const discountAmount = basePrice * (discountPercent / 100);
  const discountedPrice = basePrice - discountAmount;

  return {
    discountedPrice: Math.round(discountedPrice * 1000000) / 1000000, // 6 decimal precision
    discount: discountPercent,
  };
}

/**
 * Check if wallet has sufficient prepaid balance for a service
 */
export async function hasSufficientPrepaidBalance(
  walletAddress: string,
  serviceId: string
): Promise<{ sufficient: boolean; balance: string; required: string; discountApplied: number }> {
  // Get service price
  const [service] = await db
    .select()
    .from(aiServices)
    .where(eq(aiServices.id, serviceId))
    .limit(1);

  if (!service) {
    return { sufficient: false, balance: "0", required: "0", discountApplied: 0 };
  }

  const basePrice = parseFloat(service.price) + parseFloat(service.platformFee);
  const { discountedPrice, discount } = await calculatePrepaidPrice(serviceId, basePrice);

  // Get balance
  const balance = await getPrepaidBalance(walletAddress);
  const balanceNum = parseFloat(balance.balance);

  return {
    sufficient: balanceNum >= discountedPrice,
    balance: balance.balance,
    required: discountedPrice.toFixed(6),
    discountApplied: discount,
  };
}
