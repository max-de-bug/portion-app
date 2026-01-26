import { FastifyPluginAsync } from "fastify";
import { getYieldInfo, fetchCurrentAPY, getSpendableYield } from "../../services/yield.js";

import { getSolBalance, getTokenBalance, TOKEN_MINTS } from "../../services/solana.js";
import { getAggregatedYields } from "../../services/yieldAggregator.js";

/**
 * API Routes for Portion App
 * These endpoints provide data for the frontend dashboard
 */
const apiPlugin: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  /**
   * GET /api/apy
   * Get current sUSDV APY from Solomon Labs
   */
  fastify.get("/apy", async (request, reply) => {
    const apy = await fetchCurrentAPY();
    
    return reply.send({
      apy,
      protocol: "Solomon Labs",
      token: "sUSDV",
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/yield/:wallet
   * Get yield information for a wallet
   */
  fastify.get<{
    Params: { wallet: string };
  }>("/yield/:wallet", async (request, reply) => {
    const { wallet } = request.params;

    // Validate wallet address
    if (!wallet || wallet.length < 32) {
      return reply.status(400).send({
        error: "Invalid wallet address",
      });
    }

    const yieldInfo = await getYieldInfo(wallet);

    return reply.send({
      ...yieldInfo,
      spendable: await getSpendableYield(wallet),
    });
  });

  /**
   * GET /api/balances/:wallet
   * Get all token balances for a wallet
   */
  fastify.get<{
    Params: { wallet: string };
  }>("/balances/:wallet", async (request, reply) => {
    const { wallet } = request.params;

    if (!wallet || wallet.length < 32) {
      return reply.status(400).send({
        error: "Invalid wallet address",
      });
    }

    try {
      const [solBalance, usdv, susdv, solo] = await Promise.all([
        getSolBalance(wallet),
        getTokenBalance(wallet, TOKEN_MINTS.USDV),
        getTokenBalance(wallet, TOKEN_MINTS.sUSDV),
        getTokenBalance(wallet, TOKEN_MINTS.SOLO),
      ]);

      return reply.send({
        wallet,
        balances: {
          SOL: {
            balance: solBalance,
            symbol: "SOL",
            formatted: solBalance.toFixed(4),
          },
          USDV: {
            balance: parseFloat(usdv.uiAmount),
            symbol: "USDV",
            formatted: usdv.uiAmount,
          },
          sUSDV: {
            balance: parseFloat(susdv.uiAmount),
            symbol: "sUSDV",
            formatted: susdv.uiAmount,
          },
          SOLO: {
            balance: parseFloat(solo.uiAmount),
            symbol: "SOLO",
            formatted: solo.uiAmount,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      return reply.status(500).send({
        error: "Failed to fetch balances",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/aggregator/yields
   * Get ranked yield opportunities for a specific token (USDV|SOLO)
   */
  fastify.get<{
    Querystring: { token?: string };
  }>("/aggregator/yields", async (request, reply) => {
    const { token = "USDV" } = request.query;
    const yields = await getAggregatedYields(token);
    return reply.send({
      yields,
      token,
      timestamp: new Date().toISOString(),
    });
  });


  /**
   * GET /api/health
   * Health check endpoint
   */
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      status: "ok",
      service: "portion-backend",
      timestamp: new Date().toISOString(),
    });
  });
};

export default apiPlugin;
