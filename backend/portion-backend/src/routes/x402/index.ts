import { FastifyPluginAsync } from "fastify";
import { PublicKey } from "@solana/web3.js";
import { getSpendableYield, getCachedYieldInfo } from "../../services/yield";
import { executeAIService } from "../../services/ai";

/**
 * x402 Payment Protocol Routes
 *
 * Implements the Coinbase x402 specification for HTTP 402 payments.
 * https://github.com/coinbase/x402
 *
 * Portion Flow:
 * 1. User has sUSDV (staked elsewhere on Solomon Labs)
 * 2. sUSDV appreciates over time (yield)
 * 3. User can spend ONLY the yield via x402
 * 4. Principal (sUSDV) stays protected
 */

// Environment configuration (reserved for future use)
// const SOLANA_RPC = {
//   mainnet:
//     process.env.SOLANA_RPC_MAINNET || "https://api.mainnet-beta.solana.com",
//   devnet: process.env.SOLANA_RPC_DEVNET || "https://api.devnet.solana.com",
// };

const NETWORK = (process.env.SOLANA_NETWORK || "devnet") as
  | "mainnet"
  | "devnet";
const TREASURY_ADDRESS =
  process.env.PORTION_TREASURY_ADDRESS ||
  "PoRTn1WzKQVfBPGjC7LU1RVrS6NkYSkKuSWLKsmDorP";

// x402 Payment Requirements (per spec)
interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  maxTimeoutSeconds: number;
  outputSchema?: object;
}

// x402 Payment Payload (per spec) - Reserved for future use
// interface PaymentPayload {
//   x402Version: 1;
//   scheme: "exact";
//   network: string;
//   payload: {
//     signature: string;
//   };
// }

// Service pricing (in USD)
const SERVICE_PRICING: Record<string, { price: number; platformFee: number; description: string }> =
  {
    "gpt-4": { price: 0.03, platformFee: 0.005, description: "GPT-4 text completion" },
    "gpt-4-turbo": { price: 0.01, platformFee: 0.002, description: "GPT-4 Turbo completion" },
    "claude-3": { price: 0.025, platformFee: 0.004, description: "Claude 3 Sonnet completion" },
    "dall-e-3": { price: 0.04, platformFee: 0.008, description: "DALL-E 3 image generation" },
    "whisper": { price: 0.006, platformFee: 0.001, description: "Whisper audio transcription" },
    "web-search": { price: 0, platformFee: 0, description: "Web search" },
    "solana-agent": { price: 0, platformFee: 0, description: "Solana transactions, purchases, and faucet" },
  };

// In-memory stores (use Redis in production)
const verifiedPayments = new Map<
  string,
  { 
    amount: number; 
    basePrice: number; 
    platformFee: number; 
    isSubscription: boolean;
    service: string; 
    timestamp: Date 
  }
>();
const yieldAllocations = new Map<
  string,
  { wallet: string; amount: number; expiresAt: Date }
>();

const x402Plugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Health check
  fastify.get("/health", async () => ({
    status: "ok",
    network: NETWORK,
    timestamp: new Date().toISOString(),
  }));

  /**
   * GET /x402/services
   * List available AI services with pricing
   */
  fastify.get("/services", async (request, reply) => {
    const services = Object.entries(SERVICE_PRICING).map(([id, info]) => ({
      id,
      ...info,
      x402Enabled: true,
    }));

    return reply.send({
      services,
      network: NETWORK,
      paymentMethod: "x402",
      acceptedTokens: ["SOL", "sUSDV-yield"],
    });
  });

  /**
   * POST /x402/prepare
   * Prepare a payment for an AI service
   * Returns 402 with payment requirements
   */
  fastify.post<{
    Body: {
      service: string;
      walletAddress: string;
      inputData?: string;
    };
  }>("/prepare", async (request, reply) => {
    const { service, walletAddress } = request.body;

    const serviceInfo = SERVICE_PRICING[service];
    if (!serviceInfo) {
      return reply.status(400).send({
        error: "Unknown service",
        availableServices: Object.keys(SERVICE_PRICING),
      });
    }

    // Check user's spendable yield
    // OPTIMIZATION: Try to use cached info first to avoid RPC 429s during chat interactions
    const cachedInfo = getCachedYieldInfo(walletAddress);
    let spendableYield = 0;

    if (cachedInfo) {
      // Calculate spendable from cache
      // Note: We need to subtract allocated amount, but for speed we might skip it or 
      // ideally we should move `allocations` map export to be accessible or move getSpendableYield logic
      // For now, we'll re-use getSpendableYield but reliance on `services/yield.ts` internal caching helps
      spendableYield = await getSpendableYield(walletAddress);
    } else {
      // If no cache, we might triggered a fresh fetch which is circuit-broken if needed
      spendableYield = await getSpendableYield(walletAddress);
    }

    if (spendableYield < serviceInfo.price) {
      return reply.status(402).send({
        error: "Insufficient yield",
        required: serviceInfo.price,
        available: spendableYield,
        message:
          "Not enough spendable yield. Your sUSDV needs to appreciate more.",
      });
    }

    // Create payment requirements per x402 spec
    const paymentId = `pay-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const requirements: PaymentRequirements = {
      scheme: "exact",
      network: `solana:${NETWORK}`,
      maxAmountRequired: Math.ceil(serviceInfo.price * 1e6).toString(), // Convert to micro-units
      resource: `/x402/execute/${service}`,
      description: serviceInfo.description,
      payTo: TREASURY_ADDRESS,
      maxTimeoutSeconds: 300,
    };

    // Allocate yield temporarily
    yieldAllocations.set(paymentId, {
      wallet: walletAddress,
      amount: serviceInfo.price,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Return 402 with requirements
    const encodedRequirements = Buffer.from(
      JSON.stringify(requirements)
    ).toString("base64");

    return reply
      .status(402)
      .header("X-Payment-Required", encodedRequirements)
      .send({
        status: 402,
        message: "Payment Required",
        paymentId,
        requirements,
        service: {
          id: service,
          ...serviceInfo,
        },
        yield: {
          available: spendableYield,
          required: serviceInfo.price,
          remaining: spendableYield - serviceInfo.price,
        },
        instructions:
          "Sign the payment authorization and call /x402/execute with X-Payment header",
      });
  });

  /**
   * POST /x402/execute/:service
   * Execute AI service after payment verification
   */
  fastify.post<{
    Params: { service: string };
    Body: {
      input: string;
      paymentId: string;
      walletAddress: string;
    };
    Headers: {
      "x-payment"?: string;
    };
  }>("/execute/:service", async (request, reply) => {
    const { service } = request.params;
    const { input, paymentId } = request.body;
    // paymentHeader and walletAddress reserved for future payment verification
    // const paymentHeader = request.headers["x-payment"];
    // const { walletAddress } = request.body;

    const serviceInfo = SERVICE_PRICING[service];
    const isSubscription = request.headers["x-subscription"] === "active";

    if (!serviceInfo) {
      return reply.status(400).send({ error: "Unknown service" });
    }

    // Verify yield allocation exists
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

    // In production: verify the payment signature on-chain
    // For beta/devnet: accept yield allocation as proof

    // Mark allocation as used
    yieldAllocations.delete(paymentId);

    // Total cost calculation
    const totalCost = isSubscription ? 0 : serviceInfo.price + serviceInfo.platformFee;

    // Record the payment
    verifiedPayments.set(paymentId, {
      amount: totalCost,
      basePrice: serviceInfo.price,
      platformFee: serviceInfo.platformFee,
      isSubscription,
      service,
      timestamp: new Date(),
    });

    // Execute the AI service
    let result;
    try {
      result = await executeAIService(service, input, request.body.walletAddress, isSubscription);
    } catch (error) {
      // Refund on failure (in production, this would be an actual refund)
      return reply.status(500).send({
        error: "Service execution failed",
        message: error instanceof Error ? error.message : "Unknown error",
        refunded: true,
      });
    }

    return reply.send({
      success: true,
      paymentId,
      service,
      cost: totalCost,
      receipt: {
        id: paymentId,
        amount: totalCost,
        base: serviceInfo.price,
        fee: serviceInfo.platformFee,
        currency: "USD (from sUSDV yield)",
        timestamp: new Date().toISOString(),
        network: NETWORK,
      },
      result,
    });
  });

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

    return reply.send({
      wallet,
      spendableYield,
      currency: "USD",
      source: "sUSDV appreciation",
      network: NETWORK,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /x402/history/:wallet
   * Get payment history for a wallet
   */
  fastify.get<{
    Params: { wallet: string };
  }>("/history/:wallet", async (request, reply) => {
    const { wallet } = request.params;

    // In production, query from database
    const history = Array.from(verifiedPayments.entries())
      .filter(([_, p]) => true) // Would filter by wallet
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
                   undefined; // undefined means SOL

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
