"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  AlertCircle,
  QrCode,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================
// RECEIVE MODAL - Get sUSDV deposits
// ============================================
interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export const ReceiveModal = ({
  isOpen,
  onClose,
  walletAddress,
}: ReceiveModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4 scrollbar-hide"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ArrowDownToLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Receive sUSDV</h2>
                <p className="text-blue-100 text-xs">Deposit to earn yield</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* QR Code Placeholder */}
            <div className="bg-gray-100 rounded-2xl p-8 mb-6 flex flex-col items-center">
              <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                <QrCode className="w-20 h-20 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                Scan to receive sUSDV or USDV
              </p>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-500 block mb-2">
                Your Solana Address
              </label>
              <div
                className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={handleCopy}
              >
                <code className="flex-1 text-sm font-mono text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                  {walletAddress && walletAddress.length > 10
                    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                    : walletAddress || "Connect wallet first"}
                </code>
                {copied ? (
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-2">
                💡 How to receive sUSDV
              </p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Send USDV or sUSDV to this address</li>
                <li>If you sent USDV, stake it to earn yield</li>
                <li>Your yield becomes spendable via x402</li>
              </ol>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                window.open("https://app.solomonlabs.org", "_blank")
              }
            >
              <ExternalLink className="w-4 h-4" />
              Get sUSDV on Solomon Labs
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// WITHDRAW MODAL - Withdraw yield to wallet
// ============================================
interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableYield: number;
  walletAddress: string;
}

export const WithdrawModal = ({
  isOpen,
  onClose,
  availableYield,
  walletAddress,
}: WithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("same"); // "same" | "other"
  const [customAddress, setCustomAddress] = useState("");

  const maxAmount = availableYield;
  const isValidAmount =
    parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4 scrollbar-hide"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ArrowUpFromLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Withdraw Yield</h2>
                <p className="text-orange-100 text-xs">Convert to USDV</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Available Balance */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-orange-600 font-medium">
                Available to Withdraw
              </p>
              <p className="text-2xl font-bold text-orange-800 break-all">
                ${maxAmount.toFixed(2)}
              </p>
              <p className="text-xs text-orange-600">
                Principal stays protected ✓
              </p>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 block mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-16 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  max={maxAmount}
                  step="0.01"
                />
                <button
                  onClick={() => setAmount(maxAmount.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Destination */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-500 block mb-2">
                Withdraw To
              </label>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <button
                  onClick={() => setDestination("same")}
                  className={`flex-1 p-3 rounded-xl text-sm font-medium transition-colors ${
                    destination === "same"
                      ? "bg-orange-100 text-orange-700 border-2 border-orange-500"
                      : "bg-gray-100 text-gray-600 border-2 border-transparent"
                  }`}
                >
                  Same Wallet
                </button>
                <button
                  onClick={() => setDestination("other")}
                  className={`flex-1 p-3 rounded-xl text-sm font-medium transition-colors ${
                    destination === "other"
                      ? "bg-orange-100 text-orange-700 border-2 border-orange-500"
                      : "bg-gray-100 text-gray-600 border-2 border-transparent"
                  }`}
                >
                  Other Address
                </button>
              </div>
              {destination === "other" && (
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="Solana address (e.g., 7xKX...)"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                />
              )}
            </div>

            {/* Warning */}
            {maxAmount <= 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  No yield available to withdraw. Stake sUSDV to start earning
                  yield.
                </p>
              </div>
            )}

            <Button
              variant="success"
              className="w-full"
              disabled={!isValidAmount || maxAmount <= 0}
            >
              Withdraw ${amount || "0.00"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


