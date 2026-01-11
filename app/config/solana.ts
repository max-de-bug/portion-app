/**
 * Centralized Solana Configuration
 * 
 * Best practices for Solana RPCs:
 * 1. Always allow environment variable override for production RPCs.
 * 2. Provide sensible fallbacks for development.
 * 3. Use dedicated RPC providers (Helius, Triton, QuickNode, Alchemy) for production
 *    rather than public endpoints which are heavily rate-limited.
 */

export const SOLANA_NETWORKS = {
  MAINNET: "mainnet-beta",
  DEVNET: "devnet",
} as const;

export type SolanaNetwork = typeof SOLANA_NETWORKS[keyof typeof SOLANA_NETWORKS];

export const SOLANA_RPC_CONFIG = {
  [SOLANA_NETWORKS.MAINNET]: [
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    "https://api.mainnet-beta.solana.com", // Official public fallback
    "https://solana-mainnet.rpc.extrnode.com",
    "https://rpc.ankr.com/solana",
  ].filter(Boolean) as string[],
  
  [SOLANA_NETWORKS.DEVNET]: [
    process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL,
    "https://api.devnet.solana.com",
    "https://rpc.ankr.com/solana_devnet",
  ].filter(Boolean) as string[],
};

/**
 * Gets the prioritized list of RPC endpoints for a given network
 */
export function getRpcEndpoints(network: SolanaNetwork): string[] {
  return SOLANA_RPC_CONFIG[network] || SOLANA_RPC_CONFIG[SOLANA_NETWORKS.MAINNET];
}
