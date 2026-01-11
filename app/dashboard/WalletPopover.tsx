"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  LogOut,
  ChevronDown,
  DollarSign,
  Zap,
  Layers,
  RefreshCw,
} from "lucide-react";

import { usePrivy } from "@privy-io/react-auth";
import { useNetwork } from "@/app/context/NetworkContext";
import {
  useSolanaBalance,
  formatSolBalance,
} from "@/app/hooks/useSolanaBalance";
import { useSolomonYield } from "@/app/hooks/useSolomonYield";

export const WalletPopover = () => {
  const { user, logout } = usePrivy();
  const { network } = useNetwork();

  // Find specifically the Solana wallet address from linked accounts
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === "wallet" && account.chainType === "solana"
  ) as { address: string } | undefined;

  // Only use Solana wallet address - do NOT fall back to Ethereum
  const address = solanaWallet?.address || "";

  // Check if address is valid Solana address (not Ethereum 0x...)
  const isValidSolanaAddress = address && !address.startsWith("0x");

  const shortenedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "No Wallet";

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [copied, setCopied] = useState(false);

  // Use react-query for SOL balance with caching
  // Note: The hook only runs when isOpen is true to save RPC calls
  const {
    data: solBalance,
    isLoading: solBalanceLoading,
    isFetching,
    error: fetchError,
    dataUpdatedAt,
    refetch,
    status,
  } = useSolanaBalance(isOpen ? address : undefined, network);

  // Fetch yield data (USDv, sUSDv, spendable yield)
  const {
    data: yieldData,
    isLoading: yieldLoading,
    error: yieldError,
  } = useSolomonYield(isOpen && isValidSolanaAddress ? address : undefined);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const isRefreshing = isFetching && !solBalanceLoading;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="relative z-50">
      {/* Trigger Button */}
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fdfbf7] border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors shadow-sm"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#8ba1f5] to-[#c084fc] flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">👻</span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {shortenedAddress}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Content */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-[320px] bg-[#fdfbf7] rounded-3xl shadow-xl border border-[#e5e7eb] z-50 overflow-hidden"
            >
              <div className="p-6 pt-2">
                {/* Address Row */}
                <div
                  className="flex items-center gap-2 mb-6 p-2 group cursor-pointer"
                  onClick={handleCopy}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#a78bfa] flex items-center justify-center text-white">
                    👻
                  </div>
                  <span className="font-bold text-lg text-gray-800">
                    {shortenedAddress}
                  </span>
                  <Copy
                    className={`w-4 h-4 ${
                      copied
                        ? "text-green-500"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                </div>

                {/* Wallet Type Warning */}
                {!isValidSolanaAddress && address && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-800">
                      ⚠️ Ethereum Wallet Detected
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please connect a Solana wallet to view balances and use
                      Portion features.
                    </p>
                  </div>
                )}

                {!address && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800">
                      💡 No Wallet Connected
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Connect a Solana wallet to view your balances and start
                      earning yield.
                    </p>
                  </div>
                )}

                {/* Balances Card */}
                <div className="space-y-4 mb-2">
                  <p className="text-gray-500 font-medium">Balances</p>

                  <div className="bg-[#f3f0e8] rounded-2xl p-4 space-y-4">
                    {/* USDv */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                          <img src="/USDv.svg" alt="USDv" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-medium text-gray-600">USDv</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        {yieldLoading
                          ? "Loading…"
                          : (yieldData?.usdvBalance ?? 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                      </span>
                    </div>

                    {/* sUSDv */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center relative overflow-visible">
                          <img src="/sUSDv.svg" alt="sUSDv" className="w-full h-full object-contain" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#f3f0e8] flex items-center justify-center">
                            <Zap className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">sUSDv</span>
                          {yieldData && yieldData.susdvBalance > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Earning {yieldData.apy.toFixed(1)}% APY
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        {yieldLoading
                          ? "Loading…"
                          : (yieldData?.susdvBalance ?? 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                      </span>
                    </div>

                    {/* Spendable Yield */}
                    {yieldData && yieldData.spendableYield > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Spendable Yield</span>
                            <span className="text-[10px] text-gray-400">
                              Available for x402 payments
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-600 text-lg">
                          ${(yieldData.spendableYield ?? 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    {/* SOL (Solana) - REAL TIME */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white border-2 border-white/10 shadow-sm overflow-hidden p-1.5">
                          <svg viewBox="0 0 397 311" className="w-full h-full fill-white">
                            <path d="M64.6 237.9c2.4 2.4 5.7 3.7 9.2 3.7h314.8c5.8 0 8.7-7 4.6-11.1l-64.6-64.6c-2.4-2.4-5.7-3.7-9.2-3.7H4.6c-5.8 0-8.7 7-4.6 11.1l64.6 64.6zm332.4-162c-2.4-2.4-5.7-3.7-9.2-3.7H73c-5.8 0-8.7 7-4.6 11.1l64.6 64.6c2.4 2.4 5.7 3.7 9.2 3.7h314.8c5.8 0 8.7-7 4.6-11.1l-64.6-64.6zM73 0c-3.5 0-6.8 1.3-9.2 3.7L-.8 68.3c-4.1 4.1-1.2 11.1 4.6 11.1h314.8c3.5 0 6.8-1.3 9.2-3.7l64.6-64.6c4.1-4.1 1.2-11.1-4.6-11.1H73z" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">SOL</span>
                          <span className="text-[10px] text-gray-400">
                            {network === "devnet" ? "Devnet" : "Mainnet"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold text-gray-900 text-lg ${
                              isRefreshing ? "opacity-50" : ""
                            }`}
                          >
                            {solBalanceLoading
                              ? "Loading…"
                              : fetchError
                              ? "Error"
                              : formatSolBalance(solBalance)}
                          </span>
                          {fetchError && (
                            <span className="text-[10px] text-red-500">
                              Check console
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refetch();
                          }}
                          disabled={isFetching}
                          className="p-1 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                          title="Refresh balance"
                        >
                          <RefreshCw
                            className={`w-3 h-3 text-gray-500 ${
                              isFetching ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* SOLO */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                          <img src="/Solomon.svg" alt="SOLO" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-medium text-gray-600">SOLO</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        0.0000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Debug Info */}
                {process.env.NODE_ENV === "development" && (
                  <div className="p-4 mt-4 border-t border-gray-200 text-xs text-gray-500 bg-gray-50 rounded-lg">
                    <p className="font-bold text-gray-700">Debug Info:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <span className="font-semibold">Network:</span>
                      <code
                        className={`text-[10px] ${
                          network === "devnet"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {network}
                      </code>
                      <span className="font-semibold">Address:</span>
                      <code className="text-gray-900 text-[10px] truncate">
                        {address ? `${address.slice(0, 8)}...` : "None"}
                      </code>
                      <span className="font-semibold">Query Status:</span>
                      <code className="text-gray-900 text-[10px]">
                        {status} {isFetching ? "(fetching)" : ""}
                      </code>
                      <span className="font-semibold">SOL Balance:</span>
                      <code className="text-gray-900 text-[10px]">
                        {solBalance !== undefined ? `${solBalance} SOL` : "—"}
                      </code>
                      {yieldData?.timestamp && (
                        <>
                          <span className="font-semibold">Yield Updated:</span>
                          <code className="text-gray-900 text-[10px]">
                            {new Date(yieldData.timestamp).toLocaleTimeString()}
                          </code>
                        </>
                      )}
                      {lastUpdated && (
                        <>
                          <span className="font-semibold">SOL Updated:</span>
                          <code className="text-gray-900 text-[10px]">
                            {lastUpdated.toLocaleTimeString()}
                          </code>
                        </>
                      )}
                    </div>
                    {fetchError && (
                      <p className="mt-2 text-red-700 text-[10px]">
                        SOL Error:{" "}
                        {fetchError instanceof Error
                          ? fetchError.message
                          : String(fetchError)}
                      </p>
                    )}
                    {yieldError && (
                      <p className="mt-2 text-red-700 text-[10px]">
                        Yield Error:{" "}
                        {yieldError instanceof Error
                          ? yieldError.message
                          : String(yieldError)}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 mt-6 text-gray-500 hover:text-red-500 transition-colors py-2"
                >
                  <div className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center">
                    <LogOut className="w-3 h-3" />
                  </div>
                  <span className="font-bold">Disconnect Wallet</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
