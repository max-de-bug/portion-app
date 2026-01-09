"use client";

import { useQuery } from "@tanstack/react-query";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Reliable RPC endpoints that support CORS
const RPC_ENDPOINTS: Record<string, string[]> = {
  "mainnet-beta": [
    "https://solana-mainnet.rpc.extrnode.com",
    "https://rpc.ankr.com/solana",
    "https://solana.public-rpc.com",
  ],
  devnet: [
    "https://api.devnet.solana.com",
    "https://devnet.helius-rpc.com/?api-key=demo",
    "https://rpc.ankr.com/solana_devnet",
  ],
};

/**
 * Fetch SOL balance with fallback RPC endpoints
 */
async function fetchSolBalance(
  address: string,
  network: "mainnet-beta" | "devnet"
): Promise<number> {
  if (!address || address.startsWith("0x")) {
    throw new Error("Invalid Solana address");
  }

  const endpoints = RPC_ENDPOINTS[network] || RPC_ENDPOINTS["mainnet-beta"];
  const publicKey = new PublicKey(address);

  console.log(
    `[useSolanaBalance] Fetching balance for ${address} on ${network}`
  );
  console.log(`[useSolanaBalance] Using endpoints:`, endpoints);

  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`[useSolanaBalance] Trying endpoint: ${endpoint}`);
      const connection = new Connection(endpoint, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 20000,
      });

      const balance = await connection.getBalance(publicKey, "confirmed");
      console.log(
        `[useSolanaBalance] Success! Balance: ${balance} lamports (${
          balance / LAMPORTS_PER_SOL
        } SOL)`
      );
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.warn(`[useSolanaBalance] RPC ${endpoint} failed:`, error);
      continue;
    }
  }

  throw new Error(`All ${network} RPC endpoints failed`);
}

/**
 * Hook to fetch and cache SOL balance using react-query
 */
export function useSolanaBalance(
  address: string | undefined,
  network: "mainnet-beta" | "devnet" = "mainnet-beta"
) {
  return useQuery({
    queryKey: ["solBalance", address, network],
    queryFn: () => fetchSolBalance(address!, network),
    enabled: !!address && !address.startsWith("0x") && address.length > 30,
    staleTime: 15 * 1000, // Consider fresh for 15 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}

/**
 * Format SOL balance for display
 */
export function formatSolBalance(balance: number | undefined): string {
  if (balance === undefined) return "—";
  return balance.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
