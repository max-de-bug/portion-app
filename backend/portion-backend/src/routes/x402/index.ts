import { FastifyPluginAsync } from "fastify";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

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

// Environment configuration
const SOLANA_RPC = {
  mainnet:
    process.env.SOLANA_RPC_MAINNET || "https://api.mainnet-beta.solana.com",
  devnet: process.env.SOLANA_RPC_DEVNET || "https://api.devnet.solana.com",
};

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

// x402 Payment Payload (per spec)
interface PaymentPayload {
  x402Version: 1;
  scheme: "exact";
  network: string;
  payload: {
    signature: string;
  };
}

// Service pricing (in USD)
const SERVICE_PRICING: Record<string, { price: number; description: string }> =
  {
    "gpt-4": { price: 0.03, description: "GPT-4 text completion" },
    "gpt-4-turbo": { price: 0.01, description: "GPT-4 Turbo completion" },
    "claude-3": { price: 0.025, description: "Claude 3 Sonnet completion" },
    "dall-e-3": { price: 0.04, description: "DALL-E 3 image generation" },
    whisper: { price: 0.006, description: "Whisper transcription per minute" },
    "web-search": { price: 0.005, description: "Web search query" },
  };

// In-memory stores (use Redis in production)
const verifiedPayments = new Map<
  string,
  { amount: number; service: string; timestamp: Date }
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
    const { service, walletAddress, inputData } = request.body;

    const serviceInfo = SERVICE_PRICING[service];
    if (!serviceInfo) {
      return reply.status(400).send({
        error: "Unknown service",
        availableServices: Object.keys(SERVICE_PRICING),
      });
    }

    // Check user's spendable yield
    const spendableYield = await getSpendableYield(walletAddress);

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
    const { input, paymentId, walletAddress } = request.body;
    const paymentHeader = request.headers["x-payment"];

    const serviceInfo = SERVICE_PRICING[service];
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

    // Record the payment
    verifiedPayments.set(paymentId, {
      amount: serviceInfo.price,
      service,
      timestamp: new Date(),
    });

    // Execute the AI service
    let result;
    try {
      result = await executeAIService(service, input);
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
      cost: serviceInfo.price,
      result,
      receipt: {
        id: paymentId,
        amount: serviceInfo.price,
        currency: "USD (from sUSDV yield)",
        timestamp: new Date().toISOString(),
        network: NETWORK,
      },
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
    const demo = request.query.demo === "true";

    try {
      new PublicKey(wallet);
    } catch {
      return reply.status(400).send({ error: "Invalid wallet address" });
    }

    const spendableYield = await getSpendableYield(wallet, demo);

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
};

/**
 * Get spendable yield for a wallet
 * Spendable yield = sUSDV appreciation (not the principal)
 */
async function getSpendableYield(
  wallet: string,
  demo = false
): Promise<number> {
  // Demo mode for devnet testing
  if (demo || NETWORK === "devnet") {
    // Generate consistent demo yield based on wallet
    const hash = wallet.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseYield = (hash % 50) + 5; // $5-$55 demo yield
    return Math.round(baseYield * 100) / 100;
  }

  // Production: query actual sUSDV balance and calculate appreciation
  try {
    const connection = new Connection(SOLANA_RPC[NETWORK], "confirmed");

    // TODO: Implement actual sUSDV yield calculation
    // 1. Get sUSDV balance from Solomon Labs token account
    // 2. Get current exchange rate from Solomon Labs contract
    // 3. Calculate: yield = (sUSDV * exchangeRate) - principal

    return 0;
  } catch (error) {
    console.error("Failed to fetch yield:", error);
    return 0;
  }
}

/**
 * Execute AI service (mock for beta)
 * In production, integrate with actual AI providers
 */
async function executeAIService(
  service: string,
  input: string
): Promise<object> {
  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

  const responses: Record<string, () => object> = {
    "gpt-4": () => ({
      model: "gpt-4",
      content: `[GPT-4 Response]\n\nBased on your query: "${input.slice(
        0,
        100
      )}..."\n\nThis is a simulated response for beta testing. In production, this would connect to OpenAI's API via x402 payment.`,
      tokens: { prompt: input.length, completion: 150 },
    }),
    "gpt-4-turbo": () => ({
      model: "gpt-4-turbo",
      content: `[GPT-4 Turbo Response]\n\nQuery: "${input.slice(
        0,
        100
      )}..."\n\nSimulated response for devnet beta. Production will use real OpenAI integration.`,
      tokens: { prompt: input.length, completion: 120 },
    }),
    "claude-3": () => ({
      model: "claude-3-sonnet",
      content: `[Claude 3 Response]\n\nAnalyzing: "${input.slice(
        0,
        100
      )}..."\n\nThis is a beta simulation. Production connects to Anthropic's API.`,
      tokens: { input: input.length, output: 130 },
    }),
    "dall-e-3": () => ({
      model: "dall-e-3",
      prompt: input,
      imageUrl:
        "https://placehold.co/1024x1024/1a1a2e/10b981?text=x402+Generated",
      revisedPrompt: input,
    }),
    whisper: () => ({
      model: "whisper-1",
      transcription: "[Transcription would appear here]",
      duration: 60,
    }),
    "web-search": () => ({
      query: input,
      results: [
        {
          title: "Result 1",
          url: "https://example.com/1",
          snippet: "Relevant content...",
        },
        {
          title: "Result 2",
          url: "https://example.com/2",
          snippet: "More information...",
        },
      ],
      totalResults: 2,
    }),
  };

  const handler = responses[service];
  if (!handler) {
    throw new Error(`Service ${service} not implemented`);
  }

  return handler();
}

export default x402Plugin;
