"use client";

/**
 * Wallet Explorer Page
 * 
 * Dedicated dashboard section for exploring Solana wallet holdings
 * Fetches real on-chain data using Solana RPC
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Wallet, 
  Loader2,
  AlertCircle,
  Coins,
  RefreshCcw,
  Sparkles
} from "lucide-react";

// RPC endpoint - uses Helius or public RPC
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue?: number;
  logoUri?: string;
}

interface WalletData {
  address: string;
  solBalance: number;
  solUsdValue: number;
  tokens: TokenHolding[];
  totalUsdValue: number;
}

// Known token metadata (in production, fetch from token list API)
const TOKEN_METADATA: Record<string, { symbol: string; name: string; decimals: number }> = {
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", name: "USD Coin", decimals: 6 },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", name: "Tether USD", decimals: 6 },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": { symbol: "BONK", name: "Bonk", decimals: 5 },
  "So11111111111111111111111111111111111111112": { symbol: "SOL", name: "Wrapped SOL", decimals: 9 },
};

// Validate Solana address format (base58, 32-44 chars)
const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export default function WalletExplorerPage() {
  const [searchAddress, setSearchAddress] = useState("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmedAddress = searchAddress.trim();
    
    if (!trimmedAddress) {
      setError("Please enter a wallet address");
      return;
    }

    if (!isValidSolanaAddress(trimmedAddress)) {
      setError("Invalid Solana address format");
      return;
    }

    setIsLoading(true);
    setError(null);
    setWalletData(null);

    try {
      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const publicKey = new PublicKey(trimmedAddress);
      
      // Fetch SOL balance
      const solBalanceLamports = await connection.getBalance(publicKey);
      const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;
      
      // Mock SOL price (in production, fetch from price API)
      const solPrice = 185;
      const solUsdValue = solBalance * solPrice;
      
      // Fetch SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
      );

      const tokens: TokenHolding[] = [];
      
      // Add SOL as first token
      tokens.push({
        mint: "native",
        symbol: "SOL",
        name: "Solana",
        balance: solBalance,
        decimals: 9,
        usdValue: solUsdValue,
      });

      // Process SPL tokens
      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed?.info;
        if (!parsedInfo) continue;
        
        const mint = parsedInfo.mint as string;
        const tokenAmount = parsedInfo.tokenAmount;
        const balance = parseFloat(tokenAmount.uiAmountString || "0");
        
        if (balance === 0) continue; // Skip zero balances
        
        const metadata = TOKEN_METADATA[mint] || {
          symbol: mint.slice(0, 4) + "...",
          name: "Unknown Token",
          decimals: tokenAmount.decimals,
        };
        
        tokens.push({
          mint,
          symbol: metadata.symbol,
          name: metadata.name,
          balance,
          decimals: metadata.decimals,
          usdValue: undefined, // Would need price API for accurate USD values
        });
      }

      const totalUsdValue = tokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);

      setWalletData({
        address: trimmedAddress,
        solBalance,
        solUsdValue,
        tokens,
        totalUsdValue,
      });
    } catch (err) {
      console.error("Wallet search error:", err);
      setError(
        err instanceof Error 
          ? `Failed to fetch wallet data: ${err.message}`
          : "Failed to fetch wallet data. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchAddress]);

  const handleCopyAddress = useCallback(async () => {
    if (!walletData?.address) return;
    
    try {
      await navigator.clipboard.writeText(walletData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }, [walletData?.address]);

  const handleClear = useCallback(() => {
    setSearchAddress("");
    setWalletData(null);
    setError(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSearch();
    }
  }, [handleSearch, isLoading]);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Search className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Wallet Explorer
              <Sparkles className="w-6 h-6 text-blue-500" />
            </h1>
            <p className="text-muted-foreground text-sm">
              Look up any Solana wallet to view on-chain holdings
            </p>
          </div>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl"
        >
          {/* Search Input */}
          <div className="relative mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter Solana wallet address..."
                  className="w-full pl-12 pr-10 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  disabled={isLoading}
                />
                {searchAddress && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading || !searchAddress.trim()}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {walletData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                {/* Wallet Header */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Wallet className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {walletData.address.slice(0, 12)}...{walletData.address.slice(-12)}
                        </p>
                        <p className="text-xs text-muted-foreground">Solana Wallet</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyAddress}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy address"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <a
                        href={`https://explorer.solana.com/address/${walletData.address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button
                        onClick={handleSearch}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        title="Refresh"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Portfolio Value */}
                  <div className="text-center py-4 border-t border-blue-500/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Estimated Portfolio Value
                    </p>
                    <p className="text-4xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      ${walletData.totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on SOL price (SPL token prices not included)
                    </p>
                  </div>
                </div>

                {/* Token Holdings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                      <Coins className="w-4 h-4" />
                      Token Holdings ({walletData.tokens.length})
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {walletData.tokens.map((token, index) => (
                      <motion.div
                        key={token.mint}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                            token.symbol === "SOL" 
                              ? "bg-gradient-to-br from-purple-500 to-indigo-500"
                              : token.symbol === "USDC"
                              ? "bg-gradient-to-br from-blue-500 to-blue-600"
                              : token.symbol === "USDT"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                              : "bg-gradient-to-br from-zinc-500 to-zinc-600"
                          }`}>
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold">
                            {token.balance.toLocaleString(undefined, { 
                              maximumFractionDigits: token.decimals > 6 ? 4 : 2 
                            })}
                          </p>
                          {token.usdValue !== undefined && (
                            <p className="text-sm text-emerald-500 font-medium">
                              ${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!walletData && !error && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-lg font-medium mb-2">Search for a Wallet</p>
              <p className="text-sm max-w-md mx-auto">
                Enter any Solana wallet address to view its SOL balance and SPL token holdings in real-time.
              </p>
              <p className="text-xs mt-4 font-mono opacity-50">
                Example: vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
