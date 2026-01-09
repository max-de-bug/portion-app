"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden"
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

          <div className="p-6">
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
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                  {walletAddress || "Connect wallet first"}
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden"
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

          <div className="p-6">
            {/* Available Balance */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-orange-600 font-medium">
                Available to Withdraw
              </p>
              <p className="text-2xl font-bold text-orange-800">
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
              <div className="flex gap-2 mb-3">
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

// ============================================
// PAY CARD MODAL - x402 Virtual Card
// ============================================
interface PayCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableYield: number;
}

export const PayCardModal = ({
  isOpen,
  onClose,
  availableYield,
}: PayCardModalProps) => {
  const [cardLimit, setCardLimit] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">x402 Pay Card</h2>
                <p className="text-purple-100 text-xs">Virtual debit card</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-6">
            {/* Card Preview */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs font-medium text-gray-400">
                    PORTION x402
                  </span>
                  <Wallet className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-2xl font-mono tracking-wider mb-4">
                  •••• •••• •••• 0402
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400">SPENDING LIMIT</p>
                    <p className="text-sm font-bold">
                      ${availableYield.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">SOURCE</p>
                    <p className="text-sm font-bold">sUSDV Yield</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Yield-Backed Spending
                  </p>
                  <p className="text-xs text-purple-700">
                    Only spends your earned yield, never principal
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    x402 Protocol
                  </p>
                  <p className="text-xs text-purple-700">
                    Instant payments for online services
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Set Custom Limits
                  </p>
                  <p className="text-xs text-purple-700">
                    Control how much can be spent
                  </p>
                </div>
              </div>
            </div>

            {/* Limit Setter */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-500 block mb-2">
                Card Spending Limit (USD)
              </label>
              <input
                type="number"
                value={cardLimit}
                onChange={(e) => setCardLimit(e.target.value)}
                placeholder={availableYield.toFixed(2)}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                max={availableYield}
              />
              <p className="text-xs text-gray-500 mt-2">
                Max: ${availableYield.toFixed(2)} (your available yield)
              </p>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={availableYield <= 0}
            >
              {availableYield > 0
                ? "Create x402 Pay Card"
                : "Earn yield to create card"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
