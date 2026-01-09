"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";

// Token mint addresses
export const TOKEN_MINTS = {
  USDV: "USDVXBhRzuSLKGtq8T9aA3LJNFGpTxvYokGJjm9GkuJ", // Replace with actual
  sUSDV: "sUSDVyWxWGHNT8xqJBzFqFJKNGFXv9fDJ1dqbT1Vy9R", // Replace with actual
  SOLO: "SoLoNBhyFwRZzvcJvMVP3c7cjb3Ys5mcPP8DBhKvpump", // Solomon token
} as const;

// RPC endpoints with fallbacks
const RPC_ENDPOINTS: Record<string, string[]> = {
  "mainnet-beta": [
    "https://api.mainnet-beta.solana.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
  ],
  devnet: [
    "https://api.devnet.solana.com",
  ],
};

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
  uiAmount: string;
}

interface BalanceData {
  sol: number;
  solFormatted: string;
  tokens: Record<string, TokenBalance>;
  lastUpdated: Date | null;
}

interface UseTokenBalancesOptions {
  walletAddress?: string;
  network?: "mainnet-beta" | "devnet";
  refreshInterval?: number;
  enabled?: boolean;
}

const DEFAULT_BALANCE_DATA: BalanceData = {
  sol: 0,
  solFormatted: "0",
  tokens: {},
  lastUpdated: null,
};

/**
 * Hook to fetch SOL and SPL token balances for a wallet
 */
export function useTokenBalances({
  walletAddress,
  network = "mainnet-beta",
  refreshInterval = 15000,
  enabled = true,
}: UseTokenBalancesOptions = {}) {
  const [data, setData] = useState<BalanceData>(DEFAULT_BALANCE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rpcEndpoints = useMemo(() => {
    return RPC_ENDPOINTS[network] || [clusterApiUrl(network)];
  }, [network]);

  const getConnection = useCallback(async (): Promise<Connection | null> => {
    for (const endpoint of rpcEndpoints) {
      try {
        const connection = new Connection(endpoint, {
          commitment: "confirmed",
          confirmTransactionInitialTimeout: 10000,
        });
        // Test the connection
        await connection.getLatestBlockhash();
        return connection;
      } catch {
        console.warn(`RPC endpoint ${endpoint} failed, trying next...`);
        continue;
      }
    }
    return null;
  }, [rpcEndpoints]);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const connection = await getConnection();
      if (!connection) {
        throw new Error("Unable to connect to Solana network");
      }

      const publicKey = new PublicKey(walletAddress);

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey, "confirmed");
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Fetch SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
      );

      const tokens: Record<string, TokenBalance> = {};

      for (const { account, pubkey } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed?.info;
        if (!parsedInfo) continue;

        const mint = parsedInfo.mint;
        const tokenAmount = parsedInfo.tokenAmount;

        // Check if it's a token we care about
        const tokenEntry = Object.entries(TOKEN_MINTS).find(([, m]) => m === mint);
        if (tokenEntry) {
          const [symbol] = tokenEntry;
          tokens[symbol] = {
            mint,
            symbol,
            balance: tokenAmount.amount,
            decimals: tokenAmount.decimals,
            uiAmount: tokenAmount.uiAmountString || "0",
          };
        }
      }

      // Add zero balances for tokens not found
      for (const [symbol, mint] of Object.entries(TOKEN_MINTS)) {
        if (!tokens[symbol]) {
          tokens[symbol] = {
            mint,
            symbol,
            balance: 0,
            decimals: 6,
            uiAmount: "0.0000",
          };
        }
      }

      setData({
        sol: solAmount,
        solFormatted: solAmount.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        }),
        tokens,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("Failed to fetch token balances:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, enabled, getConnection]);

  useEffect(() => {
    if (!walletAddress || !enabled) return;

    fetchBalances();

    const interval = setInterval(fetchBalances, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchBalances, refreshInterval, walletAddress, enabled]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchBalances,
  };
}
