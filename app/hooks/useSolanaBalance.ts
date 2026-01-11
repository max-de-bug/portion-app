"use client";

import { useQuery } from "@tanstack/react-query";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { getRpcEndpoints, SOLANA_NETWORKS, type SolanaNetwork } from "@/app/config/solana";

/**
 * Fetch SOL balance with fallback RPC endpoints
 */
async function fetchSolBalance(
  address: string,
  network: SolanaNetwork
): Promise<number> {
  if (!address || address.startsWith("0x")) {
    throw new Error("Invalid Solana address");
  }

  const endpoints = getRpcEndpoints(network);
  const publicKey = new PublicKey(address);

  console.log(
    `[useSolanaBalance] Fetching balance for ${address} on ${network}`
  );
  console.log(`[useSolanaBalance] Using endpoints:`, endpoints);

  // Try each endpoint until one works
  const errors: string[] = [];
  for (const endpoint of endpoints) {
    try {
      console.log(`[useSolanaBalance] Trying endpoint: ${endpoint}`);
      const connection = new Connection(endpoint, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 15000,
      });

      // Test connection first
      const blockhash = await connection.getLatestBlockhash("confirmed");
      if (!blockhash) {
        throw new Error("Failed to get blockhash");
      }

      const balance = await connection.getBalance(publicKey, "confirmed");
      console.log(
        `[useSolanaBalance] Success! Balance: ${balance} lamports (${
          balance / LAMPORTS_PER_SOL
        } SOL) on ${network}`
      );
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[useSolanaBalance] RPC ${endpoint} failed:`, errorMsg);
      errors.push(`${endpoint}: ${errorMsg}`);
      continue;
    }
  }

  const errorMessage = `All ${network} RPC endpoints failed:\n${errors.join(
    "\n"
  )}`;
  console.error(`[useSolanaBalance] ${errorMessage}`);
  throw new Error(errorMessage);
}

/**
 * Hook to fetch and cache SOL balance using react-query
 */
export function useSolanaBalance(
  address: string | undefined,
  network: SolanaNetwork = SOLANA_NETWORKS.MAINNET
) {
  // Validate address format (Solana addresses are base58, typically 32-44 chars)
  const isValidAddress =
    !!address &&
    !address.startsWith("0x") &&
    address.length >= 32 &&
    address.length <= 44;

  return useQuery({
    queryKey: ["solBalance", address, network],
    queryFn: () => {
      if (!address) throw new Error("Address is required");
      return fetchSolBalance(address, network);
    },
    enabled: isValidAddress,
    staleTime: 15 * 1000, // Consider fresh for 15 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2, // Reduce retries to fail faster
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce RPC calls
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
