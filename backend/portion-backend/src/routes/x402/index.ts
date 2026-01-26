/**
 * Unified X402 Protocol Routes
 * 
 * Consolidates X402 V1 and V2 into a single, comprehensive route handler.
 * V2 is now the default - all endpoints support session-based auth and prepaid.
 * 
 * Features:
 * - Session-based authentication (GET /nonce, POST /auth)
 * - Service discovery (GET /discover, GET /service/:id)
 * - Prepaid balance (GET/POST /prepaid/*)
 * - Payment flow (POST /prepare, POST /execute/:service)
 * - Yield information (GET /yield/:wallet)
 * - Payment history (GET /history/:wallet)
 * - Faucet for testing (POST /faucet)
 */

import { FastifyPluginAsync } from "fastify";
import { PublicKey } from "@solana/web3.js";
import { 
  createNonce, 
  createSession, 
  validateSession, 
  revokeSession,
  getActiveSessions 
} from "../../services/session.js";
import { 
  getPrepaidBalance, 
  topupPrepaidBalance, 
  deductPrepaidBalance,
  refundPrepaidBalance,
  getPrepaidTransactions,
  hasSufficientPrepaidBalance 
} from "../../services/prepaid.js";
import { 
  discoverServices, 
  getServiceById, 
  getServiceCategories,
  getServicePricingSummary 
} from "../../services/discovery.js";
import { executeAIService } from "../../services/ai.js";
import { getSpendableYield, getCachedYieldInfo } from "../../services/yield.js";
import { aiServices, usageMetrics } from "../../db/schema.js";
import { db } from "../../db/index.js";
import { eq } from "drizzle-orm";
import type { SessionValidationResult } from "../../types/x402-v2.js";

const NETWORK = (process.env.SOLANA_NETWORK || "devnet") as "mainnet" | "devnet";
const TREASURY_ADDRESS = process.env.PORTION_TREASURY_ADDRESS || "PoRTn1WzKQVfBPGjC7LU1RVrS6NkYSkKuSWLKsmDorP";
const X402_VERSION = 2;

// Payment allocation store
const verifiedPayments = new Map<
  string,
  { 
    amount: number; 
    basePrice: number; 
    platformFee: number; 
    isSubscription: boolean;
    paymentMethod: 'yield' | 'prepaid' | 'subscription';
    service: string; 
    timestamp: Date 
  }
>();
const yieldAllocations = new Map<string, { 
  wallet: string; 
  amount: number; 
  usePrepaid: boolean;
  expiresAt: Date 
}>();

/**
 * Session validation helper
 */
async function validateSessionToken(token: string | undefined): Promise<SessionValidationResult> {
  if (!token) {
    return { valid: false, error: "Missing session token" };
  }
  return await validateSession(token);
}

const x402Plugin: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // ============================================
  // Health & Info
  // ============================================

  fastify.get("/health", async () => ({
    status: "ok",
    version: X402_VERSION,
    network: NETWORK,
    features: ["sessions", "prepaid", "discovery", "yield"],
    timestamp: new Date().toISOString(),
  }));

  // ============================================
  // Session Authentication
  // ============================================

  /**
   * GET /x402/nonce
   * Get a nonce for signing
   */
  fastify.get<{
    Querystring: { walletAddress: string };
  }>("/nonce", async (request, reply) => {
    const { walletAddress } = request.query;

    if (!walletAddress) {
      return reply.status(400).send({ error: "walletAddress is required" });
    }

    try {
      new PublicKey(walletAddress);
    } catch {
      return reply.status(400).send({ error: "Invalid wallet address" });
    }

    const nonce = await createNonce(walletAddress);
    const message = `Sign this message to authenticate with Solomon App\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

    return reply.send({
      nonce,
      message,
      expiresIn: 600,
    });
  });

  /**
   * POST /x402/auth
   * Authenticate with wallet signature
   */
  fastify.post<{
    Body: {
      walletAddress: string;
      signature: string;
      message: string;
    };
  }>("/auth", async (request, reply) => {
    const { walletAddress, signature, message } = request.body;

    if (!walletAddress || !signature || !message) {
      return reply.status(400).send({ 
        error: "Missing required fields: walletAddress, signature, message" 
      });
    }

    try {
      new PublicKey(walletAddress);
    } catch {
      return reply.status(400).send({ error: "Invalid wallet address" });
    }

    const result = await createSession({ walletAddress, signature, message });

    if ("error" in result) {
      return reply.status(401).send({ error: result.error });
    }

    return reply.send({
      success: true,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
      walletAddress: result.walletAddress,
    });
  });

  /**
   * POST /x402/auth/revoke
   * Revoke current session
   */
  fastify.post<{
    Headers: { "x-session-token"?: string };
  }>("/auth/revoke", async (request, reply) => {
    const sessionToken = request.headers["x-session-token"];
    const validation = await validateSessionToken(sessionToken);

    if (!validation.valid || !validation.session) {
      return reply.status(401).send({ error: validation.error || "Invalid session" });
    }

    await revokeSession(validation.session.sessionId);

    return reply.send({ success: true, message: "Session revoked" });
  });

  /**
   * GET /x402/auth/sessions
   * Get active sessions for authenticated wallet
   */
  fastify.get<{
    Headers: { "x-session-token"?: string };
  }>("/auth/sessions", async (request, reply) => {
    const sessionToken = request.headers["x-session-token"];
    const validation = await validateSessionToken(sessionToken);

    if (!validation.valid || !validation.session) {
      return reply.status(401).send({ error: validation.error || "Invalid session" });
    }

    const sessions = await getActiveSessions(validation.session.walletAddress);

    return reply.send({
      walletAddress: validation.session.walletAddress,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.sessionId === validation.session!.sessionId,
      })),
    });
  });

  // ============================================
  // Service Discovery
  // ============================================

  /**
   * GET /x402/services (legacy) or /x402/discover
   * List available AI services
   */
  fastify.get<{
    Querystring: {
      category?: string;
      maxPrice?: string;
      pricingScheme?: string;
    };
  }>("/services", async (request, reply) => {
    const { category, maxPrice, pricingScheme } = request.query;

    const filters = {
      category,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      pricingScheme: pricingScheme as any,
    };

    const result = await discoverServices(filters);

    return reply.send({
      version: X402_VERSION,
      network: NETWORK,
      paymentMethod: "x402",
      acceptedTokens: ["SOL", "sUSDV-yield", "prepaid-USD"],
      ...result,
    });
  });

  // Alias for V2 discovery
  fastify.get<{
    Querystring: {
      category?: string;
      maxPrice?: string;
      pricingScheme?: string;
    };
  }>("/discover", async (request, reply) => {
    const { category, maxPrice, pricingScheme } = request.query;

    const filters = {
      category,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      pricingScheme: pricingScheme as any,
    };

    const result = await discoverServices(filters);

    return reply.send({
      version: X402_VERSION,
      network: NETWORK,
      ...result,
    });
  });

  /**
   * GET /x402/discover/categories
   */
  fastify.get("/discover/categories", async (request, reply) => {
    const categories = await getServiceCategories();
    return reply.send({ categories });
  });

  /**
   * GET /x402/discover/pricing
   */
  fastify.get("/discover/pricing", async (request, reply) => {
    const summary = await getServicePricingSummary();
    return reply.send(summary);
  });

  /**
   * GET /x402/service/:serviceId
   */
  fastify.get<{
    Params: { serviceId: string };
  }>("/service/:serviceId", async (request, reply) => {
    const { serviceId } = request.params;
    const service = await getServiceById(serviceId);

    if (!service) {
      return reply.status(404).send({ error: "Service not found" });
    }

    return reply.send(service);
  });

  // ============================================
  // Prepaid Balance
  // ============================================

  /**
   * GET /x402/prepaid/balance
   */
  fastify.get<{
    Headers: { "x-session-token"?: string };
  }>("/prepaid/balance", async (request, reply) => {
    const sessionToken = request.headers["x-session-token"];
    const validation = await validateSessionToken(sessionToken);

    if (!validation.valid || !validation.session) {
      return reply.status(401).send({ error: validation.error || "Invalid session" });
    }

    const balance = await getPrepaidBalance(validation.session.walletAddress);

    return reply.send({
      walletAddress: validation.session.walletAddress,
      balance: balance.balance,
      lastTopup: balance.lastTopup,
      updatedAt: balance.updatedAt,
    });
  });

  /**
   * POST /x402/prepaid/topup
   */
  fastify.post<{
    Headers: { "x-session-token"?: string };
    Body: {
      amount: number;
      paymentTx: string;
    };
  }>("/prepaid/topup", async (request, reply) => {
    const sessionToken = request.headers["x-session-token"];
    const validation = await validateSessionToken(sessionToken);

    if (!validation.valid || !validation.session) {
      return reply.status(401).send({ error: validation.error || "Invalid session" });
    }

    const { amount, paymentTx } = request.body;

    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: "Amount must be positive" });
    }

    if (!paymentTx) {
      return reply.status(400).send({ error: "Payment transaction signature required" });
    }

    try {
      const result = await topupPrepaidBalance({
        walletAddress: validation.session.walletAddress,
        amount,
        paymentTx,
      });

      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({
        error: "Topup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /x402/prepaid/transactions
   */
  fastify.get<{
    Headers: { "x-session-token"?: string };
    Querystring: { limit?: string };
  }>("/prepaid/transactions", async (request, reply) => {
    const sessionToken = request.headers["x-session-token"];
    const validation = await validateSessionToken(sessionToken);

    if (!validation.valid || !validation.session) {
      return reply.status(401).send({ error: validation.error || "Invalid session" });
    }

    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
    const transactions = await getPrepaidTransactions(
      validation.session.walletAddress,
      Math.min(limit, 100)
    );

    return reply.send({
      walletAddress: validation.session.walletAddress,
      transactions,
      count: transactions.length,
    });
  });

  /**
   * GET /x402/prepaid/check/:serviceId
   */
  fastify.get<{
    Headers: { "x-session-token"?: string };
    Params: { serviceId: string };
  }>("/prepaid/check/:serviceId", async (request, reply) => {
    const sessionToken = request.headers["x-session-token"];
    const validation = await validateSessionToken(sessionToken);

    if (!validation.valid || !validation.session) {
      return reply.status(401).send({ error: validation.error || "Invalid session" });
    }

    const result = await hasSufficientPrepaidBalance(
      validation.session.walletAddress,
      request.params.serviceId
    );

    return reply.send({
      serviceId: request.params.serviceId,
      ...result,
    });
  });

  // ============================================
  // Yield Information
  // ============================================

  /**
   * GET /x402/yield/:wallet
   * Get spendable yield for a wallet
   */
  fastify.get<{
    Params: { wallet: string };
    Querystring: { demo?: string };
  }>("/yield/:wallet", async (request, reply) => {
    const { wallet } = request.params;

    try {
      new PublicKey(wallet);
    } catch {
      return reply.status(400).send({ error: "Invalid wallet address" });
    }

    const spendableYield = await getSpendableYield(wallet);
    const prepaidBalance = await getPrepaidBalance(wallet);

    return reply.send({
      wallet,
      spendableYield,
      prepaidBalance: prepaidBalance.balance,
      totalAvailable: spendableYield + parseFloat(prepaidBalance.balance),
      currency: "USD",
      source: "sUSDV appreciation + prepaid",
      network: NETWORK,
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================
  // Payment Flow
  // ============================================

  /**
   * POST /x402/prepare
   * Prepare a payment for an AI service
   */
  fastify.post<{
    Headers: { "x-session-token"?: string };
    Body: {
      service: string;
      walletAddress: string;
      usePrepaid?: boolean;
      inputData?: string;
    };
  }>("/prepare", async (request, reply) => {
    const { service, walletAddress, usePrepaid = false } = request.body;
    const sessionToken = request.headers["x-session-token"];

    // Session validation (optional for backward compatibility)
    let sessionValid = false;
    let sessionInfo: SessionValidationResult | null = null;
    if (sessionToken) {
      sessionInfo = await validateSessionToken(sessionToken);
      sessionValid = sessionInfo.valid;
    }

    // Get service info
    const [serviceInfo] = await db
      .select()
      .from(aiServices)
      .where(eq(aiServices.id, service))
      .limit(1);

    if (!serviceInfo) {
      const allServices = await db.select({ id: aiServices.id }).from(aiServices).where(eq(aiServices.isActive, true));
      return reply.status(400).send({ 
        error: "Unknown service",
        availableServices: allServices.map(s => s.id),
      });
    }

    const basePrice = parseFloat(serviceInfo.price);
    const platformFee = parseFloat(serviceInfo.platformFee);
    const totalPrice = basePrice + platformFee;

    // Check prepaid balance if requested
    if (usePrepaid) {
      const prepaidCheck = await hasSufficientPrepaidBalance(walletAddress, service);
      
      if (prepaidCheck.sufficient) {
        const paymentId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        
        yieldAllocations.set(paymentId, {
          wallet: walletAddress,
          amount: parseFloat(prepaidCheck.required),
          usePrepaid: true,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        return reply.status(200).send({
          status: 200,
          message: "Payment Ready (Prepaid)",
          paymentId,
          paymentMethod: "prepaid",
          service: {
            id: service,
            price: basePrice,
            platformFee,
            discountApplied: prepaidCheck.discountApplied,
          },
          prepaid: {
            balance: prepaidCheck.balance,
            required: prepaidCheck.required,
            discount: prepaidCheck.discountApplied,
          },
          session: sessionValid ? {
            authenticated: true,
            expiresAt: sessionInfo?.session?.expiresAt,
          } : null,
          instructions: "Call /x402/execute/:service with paymentId and usePrepaid=true",
        });
      }
    }

    // Fall back to yield-based payment
    const cachedInfo = getCachedYieldInfo(walletAddress);
    let spendableYield = 0;
    
    if (cachedInfo) {
      spendableYield = cachedInfo.claimableYield + cachedInfo.pendingYield;
    } else {
      spendableYield = await getSpendableYield(walletAddress);
    }

    if (spendableYield < totalPrice) {
      const prepaidBalance = await getPrepaidBalance(walletAddress);
      
      return reply.status(402).send({
        error: "Insufficient balance",
        required: totalPrice,
        yield: {
          available: spendableYield,
          sufficient: false,
        },
        prepaid: {
          balance: prepaidBalance.balance,
          sufficient: parseFloat(prepaidBalance.balance) >= totalPrice,
          hint: parseFloat(prepaidBalance.balance) >= totalPrice 
            ? "Set usePrepaid=true to use prepaid balance" 
            : "Top up prepaid balance via POST /x402/prepaid/topup",
        },
        session: sessionValid,
      });
    }

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    yieldAllocations.set(paymentId, {
      wallet: walletAddress,
      amount: totalPrice,
      usePrepaid: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return reply.status(402).send({
      status: 402,
      message: "Payment Required",
      paymentId,
      paymentMethod: "yield",
      requirements: {
        scheme: "exact",
        network: `solana:${NETWORK}`,
        maxAmountRequired: Math.ceil(totalPrice * 1e6).toString(),
        resource: `/x402/execute/${service}`,
        description: serviceInfo.description,
        payTo: TREASURY_ADDRESS,
        maxTimeoutSeconds: 300,
        acceptsPrepaid: true,
      },
      service: {
        id: service,
        price: basePrice,
        platformFee,
      },
      yield: {
        available: spendableYield,
        required: totalPrice,
        remaining: spendableYield - totalPrice,
      },
      session: sessionValid ? {
        authenticated: true,
        expiresAt: sessionInfo?.session?.expiresAt,
      } : null,
      instructions: "Sign the payment authorization and call /x402/execute with X-Payment header",
    });
  });

  /**
   * POST /x402/execute/:service
   * Execute AI service after payment verification
   */
  fastify.post<{
    Params: { service: string };
    Headers: { 
      "x-session-token"?: string;
      "x-payment"?: string;
      "x-subscription"?: string;
    };
    Body: {
      input: string;
      paymentId: string;
      walletAddress: string;
      usePrepaid?: boolean;
    };
  }>("/execute/:service", async (request, reply) => {
    const { service } = request.params;
    const { input, paymentId, walletAddress, usePrepaid = false } = request.body;
    const sessionToken = request.headers["x-session-token"];
    const isSubscription = request.headers["x-subscription"] === "active";

    // Validate session if provided
    let sessionInfo: SessionValidationResult | null = null;
    if (sessionToken) {
      sessionInfo = await validateSessionToken(sessionToken);
    }

    // Get service info
    const [serviceInfo] = await db
      .select()
      .from(aiServices)
      .where(eq(aiServices.id, service))
      .limit(1);

    if (!serviceInfo) {
      return reply.status(400).send({ error: "Unknown service" });
    }

    // Verify allocation
    const allocation = yieldAllocations.get(paymentId);
    if (!allocation) {
      return reply.status(402).send({
        error: "Payment not prepared",
        message: "Call /x402/prepare first",
      });
    }

    if (allocation.expiresAt < new Date()) {
      yieldAllocations.delete(paymentId);
      return reply.status(402).send({
        error: "Payment expired",
        message: "Prepare a new payment",
      });
    }

    // Consume allocation
    yieldAllocations.delete(paymentId);

    const basePrice = parseFloat(serviceInfo.price);
    const platformFee = parseFloat(serviceInfo.platformFee);
    const totalCost = isSubscription ? 0 : allocation.amount;
    let paymentMethod: 'prepaid' | 'yield' | 'subscription' = 'yield';

    // Handle prepaid deduction
    if (usePrepaid || allocation.usePrepaid) {
      const deductResult = await deductPrepaidBalance(walletAddress, totalCost, service);
      
      if (!deductResult.success) {
        return reply.status(402).send({
          error: "Prepaid deduction failed",
          message: deductResult.error,
        });
      }
      
      paymentMethod = 'prepaid';
    } else if (isSubscription) {
      paymentMethod = 'subscription';
    }

    // Execute AI service
    let result;
    try {
      result = await executeAIService(service, input, walletAddress, isSubscription);
    } catch (error) {
      // Refund on failure
      if (paymentMethod === 'prepaid') {
        await refundPrepaidBalance(walletAddress, totalCost, service);
      }
      
      return reply.status(500).send({
        error: "Service execution failed",
        message: error instanceof Error ? error.message : "Unknown error",
        refunded: paymentMethod === 'prepaid',
      });
    }

    // Record payment
    verifiedPayments.set(paymentId, {
      amount: totalCost,
      basePrice,
      platformFee,
      isSubscription,
      paymentMethod,
      service,
      timestamp: new Date(),
    });

    // Record usage
    const usageId = `usage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(usageMetrics).values({
      id: usageId,
      walletAddress,
      serviceId: service,
      paymentScheme: paymentMethod,
      amount: totalCost.toFixed(6),
      sessionId: sessionInfo?.session?.sessionId,
    });

    return reply.send({
      success: true,
      version: X402_VERSION,
      paymentId,
      service,
      cost: totalCost,
      paymentMethod,
      receipt: {
        id: paymentId,
        amount: totalCost,
        base: basePrice,
        fee: platformFee,
        currency: paymentMethod === 'prepaid' ? "USD (prepaid)" : 
                  paymentMethod === 'subscription' ? "USD (subscription)" :
                  "USD (from sUSDV yield)",
        timestamp: new Date().toISOString(),
        network: NETWORK,
      },
      result,
      session: sessionInfo?.valid ? {
        walletAddress: sessionInfo.session?.walletAddress,
        expiresAt: sessionInfo.session?.expiresAt,
      } : null,
    });
  });

  // ============================================
  // History
  // ============================================

  /**
   * GET /x402/history/:wallet
   * Get payment history for a wallet
   */
  fastify.get<{
    Params: { wallet: string };
  }>("/history/:wallet", async (request, reply) => {
    const { wallet } = request.params;

    const history = Array.from(verifiedPayments.entries())
      .filter(([_, p]) => true) // Would filter by wallet in production
      .map(([id, payment]) => ({
        id,
        ...payment,
      }))
      .slice(-20);

    return reply.send({
      wallet,
      payments: history,
      total: history.reduce((sum, p) => sum + p.amount, 0),
    });
  });

  // ============================================
  // Faucet (Testing)
  // ============================================

  /**
   * POST /x402/faucet
   * Request mock USDV or SOL for testing
   */
  fastify.post<{
    Body: { walletAddress: string; amount?: number; currency?: string };
  }>("/faucet", async (request, reply) => {
    const { walletAddress, amount = 10, currency = "USDV" } = request.body;
    
    try {
      const { sendTokensFromTreasury, TOKEN_MINTS } = await import("../../services/solana.js");
      
      const mint = currency === "USDV" ? TOKEN_MINTS.USDV : 
                   currency === "USDC" ? TOKEN_MINTS.USDC : 
                   undefined;

      console.log(`[Faucet] Sending ${amount} ${currency} to ${walletAddress}`);
      
      const signature = await sendTokensFromTreasury(walletAddress, amount, mint);
      
      return reply.send({
        success: true,
        signature,
        message: `Successfully sent ${amount} ${currency} to ${walletAddress}`,
        explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`
      });
    } catch (error) {
      console.error("[Faucet Error]", error);
      return reply.status(500).send({
        error: "Faucet failed",
        message: error instanceof Error ? error.message : "Wait for airdrop quota or check treasury"
      });
    }
  });
};

export default x402Plugin;
