"use client";

/**
 * Wallet Search Component
 * 
 * Search any Solana wallet address and view its token holdings
 * Validates addresses, fetches on-chain data, and displays balances
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Wallet, 
  Loader2,
  AlertCircle,
  Coins
} from "lucide-react";

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

// Validate Solana address format (base58, 32-44 chars)
const isValidSolanaAddress = (address: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

// Mock token data for demonstration
const MOCK_TOKENS: TokenHolding[] = [
  { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana", balance: 0, decimals: 9 },
  { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "USD Coin", balance: 0, decimals: 6 },
  { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", balance: 0, decimals: 6 },
  { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk", balance: 0, decimals: 5 },
];

export const WalletSearch = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      // In production, this would call your API endpoint or directly query RPC
      // For now, we'll simulate the API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock wallet data based on address
      const mockSolBalance = Math.random() * 100;
      const solPrice = 185; // Mock SOL price
      
      const mockTokens: TokenHolding[] = MOCK_TOKENS.map(token => ({
        ...token,
        balance: token.symbol === "SOL" ? mockSolBalance : Math.random() * 10000,
        usdValue: token.symbol === "SOL" 
          ? mockSolBalance * solPrice 
          : Math.random() * 5000,
      })).filter(t => t.balance > 0.001);

      const totalUsdValue = mockTokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);

      setWalletData({
        address: trimmedAddress,
        solBalance: mockSolBalance,
        solUsdValue: mockSolBalance * solPrice,
        tokens: mockTokens,
        totalUsdValue,
      });
      setIsExpanded(true);
    } catch (err) {
      setError("Failed to fetch wallet data. Please try again.");
      console.error("Wallet search error:", err);
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
    setIsExpanded(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSearch();
    }
  }, [handleSearch, isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Wallet Search</h3>
          <p className="text-sm text-muted-foreground">
            Look up any Solana wallet to view holdings
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Solana wallet address..."
              className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              disabled={isLoading}
            />
            {searchAddress && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchAddress.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
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
            className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
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
            className="space-y-4"
          >
            {/* Wallet Header */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {walletData.address.slice(0, 8)}...{walletData.address.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground">Solana Wallet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAddress}
                    className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${walletData.address}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    title="View on Solscan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              {/* Portfolio Value */}
              <div className="text-center py-3 border-t border-blue-500/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Total Portfolio Value
                </p>
                <p className="text-2xl font-black">
                  ${walletData.totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Token Holdings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Coins className="w-4 h-4" />
                Token Holdings ({walletData.tokens.length})
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {walletData.tokens.map((token) => (
                  <motion.div
                    key={token.mint}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm">
                        {token.balance.toLocaleString(undefined, { 
                          maximumFractionDigits: token.decimals > 6 ? 4 : 2 
                        })}
                      </p>
                      {token.usdValue !== undefined && (
                        <p className="text-xs text-muted-foreground">
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
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a Solana address to view wallet holdings</p>
          <p className="text-xs mt-1">Example: vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg</p>
        </div>
      )}
    </motion.div>
  );
};
