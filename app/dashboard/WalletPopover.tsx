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
              {/* Header Tabs */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
                  <button
                    onClick={() => setActiveTab("home")}
                    className={`transition-colors hover:text-gray-900 ${
                      activeTab === "home" ? "text-gray-900" : ""
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setActiveTab("stats")}
                    className={`relative transition-colors hover:text-gray-900 ${
                      activeTab === "stats" ? "text-blue-500" : ""
                    }`}
                  >
                    Stats
                    {activeTab === "stats" && (
                      <motion.div
                        layoutId="underline"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                      />
                    )}
                  </button>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#d1f4e8] text-[#059669] text-xs font-bold font-mono border border-[#a7f3d0]">
                  {shortenedAddress}
                </div>
              </div>

              <div className="p-6 pt-2">
                {/* Address Row */}
                <div
                  className="flex items-center gap-2 mb-6 group cursor-pointer"
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
                        <div className="w-8 h-8 rounded-full bg-[#fbbf24] border-2 border-orange-200 flex items-center justify-center text-orange-700">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-600">USDv</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        0.0000
                      </span>
                    </div>

                    {/* sUSDv */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#fbbf24] border-2 border-orange-200 flex items-center justify-center text-orange-700 relative">
                          <DollarSign className="w-5 h-5" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#f3f0e8] flex items-center justify-center">
                            <Zap className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <span className="font-medium text-gray-600">sUSDv</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        0.0000
                      </span>
                    </div>

                    {/* SOL (Solana) - REAL TIME */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#14F195] flex items-center justify-center text-white border-2 border-[#000000]/10">
                          <span className="font-bold text-xs text-black">
                            SOL
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">SOL</span>
                          <span className="text-[10px] text-gray-400">
                            {network === "devnet" ? "Devnet" : "Mainnet"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-gray-900 text-lg ${
                            isRefreshing ? "opacity-50" : ""
                          }`}
                        >
                          {solBalanceLoading
                            ? "Loading…"
                            : formatSolBalance(solBalance)}
                        </span>
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
                        <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-white">
                          <Layers className="w-4 h-4" />
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
                    </div>
                    {lastUpdated && (
                      <p className="mt-2 text-green-700 text-[10px]">
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </p>
                    )}
                    {fetchError && (
                      <p className="mt-2 text-red-700 text-[10px]">
                        Error:{" "}
                        {fetchError instanceof Error
                          ? fetchError.message
                          : String(fetchError)}
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
