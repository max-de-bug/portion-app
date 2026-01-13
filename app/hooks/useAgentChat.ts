"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AI_SERVICES, AIService } from "@/app/config/agent-services";
import { usePrivy, ConnectedWallet } from "@privy-io/react-auth";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Connection, Transaction, clusterApiUrl } from "@solana/web3.js";
import { useYieldStore } from "@/app/store/useYieldStore";
import { useTransactionStore } from "@/app/store/useTransactionStore";
import { useChatStore, Message } from "@/app/store/useChatStore";

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";
const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "devnet" | "mainnet-beta") || "devnet";
const REQUEST_TIMEOUT_MS = 30_000; // 30 second timeout for API calls

export type { Message };

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Custom error types for better error handling */
class X402Error extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "X402Error";
  }
}



/** Result from the x402 prepare endpoint */
interface X402PrepareResponse {
  paymentId: string;
  requiredAmount?: number;
}

/** Result from the x402 execute endpoint */
interface X402ExecuteResponse {
  result: {
    content?: string;
    imageUrl?: string;
    results?: Array<{
      type?: string;
      transaction?: string;
      title?: string;
    }>;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique message ID
 */
const generateMessageId = () => 
  `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Creates a fetch request with timeout support
 */
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit, 
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Finds the best available wallet for signing transactions
 * Priority: exact match -> case-insensitive match -> any available wallet
 * 
 * IMPORTANT: For x402 transactions, we need ANY signer. If the user has
 * a connected wallet, we should use it even if the address doesn't match
 * what was passed in (user may have switched accounts in their wallet extension).
 */
const findSignerWallet = (
  wallets: any[],
  targetAddress: string
): any | undefined => {
  // Debug logging for troubleshooting
  console.log("[findSignerWallet] Looking for wallet...", {
    targetAddress,
    availableWallets: wallets.map((w) => ({
      address: w.address,
      walletClientType: w.walletClientType,
      chainType: (w as any).chainType || "solana",
    })),
  });

  if (wallets.length === 0) return undefined;

  // Priority 1: Exact address match
  let wallet = wallets.find((w) => w.address === targetAddress);
  if (wallet) {
    console.log("[findSignerWallet] Found exact match:", wallet.address);
    return wallet;
  }

  // Priority 2: Case-insensitive address match
  wallet = wallets.find(
    (w) => w.address.toLowerCase() === targetAddress.toLowerCase()
  );
  if (wallet) {
    console.log("[findSignerWallet] Found case-insensitive match:", wallet.address);
    return wallet;
  }

  // Priority 3: External wallets (Phantom, Solflare, etc.) usually have higher priority for signing
  wallet = wallets.find((w) => w.walletClientType !== "privy");
  if (wallet) {
    console.log("[findSignerWallet] Found external wallet:", wallet.address);
    return wallet;
  }

  // Priority 4: First available wallet (last resort)
  wallet = wallets[0];
  console.log("[findSignerWallet] Using first available wallet:", wallet.address);
  return wallet;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useAgentChat(walletAddress: string) {
  // Select only what we need to prevent unnecessary re-renders
  const currentYield = useYieldStore((state) => state.spendableYield);
  const deductYield = useYieldStore((state) => state.deductYield);
  const hasSubscription = useYieldStore((state) => state.hasSubscription);
  
  // Only select addTransaction to avoid re-renders on transaction list updates
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  // Chat store - main UI state drivers
  const {
    messages,
    input,
    selectedService,
    addMessage: storeAddMessage,
    updateMessage: storeUpdateMessage,
    setInput,
    setSelectedService,
  } = useChatStore();

  // Privy wallet hooks
  const { user, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();


  // Local loading state
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const addMessage = useCallback((content: string, role: "user" | "assistant", extras?: Partial<Message>) => {
    const msg: Message = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      hasAnimated: false, // Default to false, will be set to true by Typewriter
      ...extras,
    };
    storeAddMessage(msg);
    return msg.id;
  }, [storeAddMessage]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    storeUpdateMessage(id, updates);
  }, [storeUpdateMessage]);

  const executeService = useCallback(
    async (service: AIService, userInput: string) => {
      const totalCost = service.pricePerCall + service.platformFee;
      
      if (!hasSubscription && currentYield < totalCost) {
        addMessage(
          `Insufficient yield.\n\nRequired: $${totalCost.toFixed(3)}\nAvailable: $${currentYield.toFixed(2)}\n\nYour sUSDV needs more time to appreciate or you can enable a Monthly Subscription.`,
          "assistant",
          { status: "error", hasAnimated: false }
        );
        return;
      }

      const displayCost = hasSubscription 
        ? "Included in Subscription" 
        : totalCost === 0 
          ? "Free (Demo Beta)" 
          : `$${totalCost.toFixed(3)} ($${service.platformFee.toFixed(3)} fee)`;
      const msgId = addMessage(
        `Processing ${service.name} request...\n\nCost: ${displayCost}\nInput: "${userInput.slice(0, 50)}${userInput.length > 50 ? "..." : ""}"`,
        "assistant",
        { status: "processing", hasAnimated: false }
      );

      try {
        // Step 1: Prepare payment (with timeout handling)
        const prepareRes = await fetchWithTimeout(`${BACKEND_URL}/x402/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: service.id,
            walletAddress,
            inputData: userInput,
          }),
        });

        if (!prepareRes.ok && prepareRes.status !== 402) {
          throw new X402Error("Failed to prepare payment", "PREPARE_FAILED");
        }

        const prepareData: X402PrepareResponse = await prepareRes.json();
        const paymentId = prepareData.paymentId;

        // Step 2: Execute with payment (with timeout handling)
        const executeRes = await fetchWithTimeout(`${BACKEND_URL}/x402/execute/${service.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": "yield-authorized",
            "X-Subscription": hasSubscription ? "active" : "none",
          },
          body: JSON.stringify({
            input: userInput,
            paymentId,
            walletAddress,
            inputData: userInput,
          }),
        });

        if (!executeRes.ok) {
          throw new X402Error("Service execution failed", "EXECUTE_FAILED");
        }

        const result: X402ExecuteResponse = await executeRes.json();

        let responseContent = "";
        
        // Log the full response for debugging
        console.log("[useAgentChat] Service response:", {
          serviceId: service.id,
          hasResults: !!result.result.results,
          resultsLength: result.result.results?.length,
          firstResultType: result.result.results?.[0]?.type,
          hasContent: !!result.result.content,
        });
        
        // CHECK FOR TRANSACTION PROPOSAL (User Signing Flow)
        if (result.result.results && result.result.results[0]?.type === "transaction_proposal") {
             const proposal = result.result.results[0] as any;
             const txBase64 = proposal.transaction as string;
             const currency = proposal.currency || "SOL";
             
             updateMessage(msgId, {
                content: result.result.content || "Transaction Proposal",
                status: "proposal",
                hasAnimated: false,
                proposal: {
                  txBase64,
                  description: proposal.message || result.result.content || "Sign transaction",
                  serviceId: service.id,
                  currency // Store currency for the receipt
                }
             });
             return;
        }

        // CHECK FOR FAUCET REQUEST
        if (result.result.results && result.result.results[0]?.type === "faucet_request") {
          const faucet = result.result.results[0] as any;
          try {
            const faucetRes = await fetch(`${BACKEND_URL}/x402/faucet`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                walletAddress,
                amount: faucet.amount,
                currency: faucet.currency
              }),
            });
            const faucetData = await faucetRes.json();
            if (faucetData.success) {
              updateMessage(msgId, {
                content: `### 🎁 Faucet Success\n\nI've successfully sent **${faucet.amount} ${faucet.currency}** to your wallet!\n\n**Transaction:** \`${faucetData.signature.slice(0, 10)}...${faucetData.signature.slice(-10)}\`\n\n🔗 **[View on Solscan Explorer](https://solscan.io/tx/${faucetData.signature}?cluster=devnet)**`,
                status: "completed",
                hasAnimated: true
              });
              return;
            } else {
              throw new Error(faucetData.message || "Faucet failed");
            }
          } catch (err) {
            updateMessage(msgId, {
              content: `Faucet failed: ${err instanceof Error ? err.message : "Unknown error"}`,
              status: "error"
            });
            return;
          }
        }

        // Standard response handling
        if (service.id === "dall-e-3") {
          responseContent = `Image generated.\n\nPrompt: "${userInput}"\n\n[Image: ${result.result.imageUrl}]\n\nCost: ${displayCost}`;
        } else if (service.id === "web-search") {
          // If the backend returns explicit content (like Commerce Receipt), use it
          if (result.result.content) {
             responseContent = `${result.result.content}\n\nCost: ${displayCost}`;
          } else {
             // Otherwise format the search results
             const results = result.result.results || [];
             responseContent = `Search complete.\n\nQuery: "${userInput}"\n\nResults:\n${results
               .map((r, i) => `${i + 1}. ${r.title || "Untitled"}`)
               .join("\n")}\n\nCost: ${displayCost}`;
          }
        } else {
          responseContent = `${result.result.content || JSON.stringify(result.result, null, 2)}\n\nCost: ${displayCost}`;
        }

        updateMessage(msgId, {
          content: responseContent,
          status: "completed",
          cost: hasSubscription ? 0 : totalCost,
          hasAnimated: false, // New content should animate updates
        });

        // Always record transaction for demo/UX purposes
        addTransaction({
          service: service.name,
          type: "API",
          amount: hasSubscription ? "SUB" : `$${totalCost.toFixed(3)}`,
          status: "Processing", 
          source: hasSubscription ? "x402 Monthly" : "sUSDV Yield",
        });

        if (!hasSubscription) {
          deductYield(totalCost);
          // Optimize: access store directly instead of state to avoid subscription requirement if not needed
          useYieldStore.getState().recordSpending(totalCost);
        }
      } catch (error) {
        console.error("[useAgentChat] Service execution error:", error);
        updateMessage(msgId, {
          content: `Request failed: ${error instanceof Error ? error.message : "Unknown error"}\n\nNo yield was spent.`,
          status: "error",
          hasAnimated: false,
        });
      }
    },
    [walletAddress, currentYield, addMessage, updateMessage, hasSubscription, addTransaction, deductYield, wallets, connectWallet]
  );

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    addMessage(userInput, "user", { hasAnimated: true }); // User messages don't need typewriter
    setInput("");
    setIsLoading(true);

    try {
      if (selectedService) {
        await executeService(selectedService, userInput);
      } else {
        const lower = userInput.toLowerCase();
        if (lower.includes("balance") || lower.includes("yield") || lower.includes("how much")) {
          addMessage(
            `Your spendable yield: $${currentYield.toFixed(2)}\n\nThis is the appreciation from your sUSDV holdings. Your principal (sUSDV) remains untouched.\n\nSelect a service below to spend yield.`,
            "assistant",
            { hasAnimated: false }
          );
        } else {
          addMessage(`To process your request, select an AI service first.\n\nYour query: "${userInput}"`, "assistant", { hasAnimated: false });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const approveProposal = useCallback(async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || !msg.proposal) return;

    const { txBase64, serviceId } = msg.proposal;
    const service = AI_SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    updateMessage(messageId, { 
      status: "processing", 
      content: `${msg.content}\n\nWaiting for you to sign the transaction...` 
    });

    try {
      const wallet = findSignerWallet(wallets, walletAddress);

      if (!wallet) {
        console.log("[useAgentChat] No suitable wallet found for signing proposal.");
        updateMessage(messageId, {
          content: `⚠️ **Wallet Connection Required**\n\nPlease connect your Solana wallet (Phantom/Solflare) to sign this transaction.`,
          status: "proposal", // Stay in proposal state so they can try again
          hasAnimated: false,
        });
        connectWallet();
        return;
      }

      const transaction = Transaction.from(Buffer.from(txBase64, "base64"));
      
      // SENIOR FIX: Freshly fetch blockhash on the frontend to ensure network alignment
      // This solves the "Network mismatch" if the backend accidentally provided a blockhash from another cluster.
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      console.log("[useAgentChat] Overriding blockhash for network alignment:", blockhash);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      const { signature } = await signAndSendTransaction({
        transaction: transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }),
        wallet
      });

      // SENIOR FIX: Robust signature conversion to Base58
      // Solana signatures from Privy/SignAndSend can come in various formats
      let sigString = "";
      if (typeof signature === 'string') {
        sigString = signature;
      } else if (signature instanceof Uint8Array || Array.isArray(signature)) {
        // Base58 Encode for Solana signatures using a more robust utility if available, 
        // or this manual implementation which is standard for Solana web3 apps.
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const bytes = Array.from(signature as any) as number[];
        let digits: number[] = [0];
        for (let i = 0; i < bytes.length; i++) {
          for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
          digits[0] += bytes[i];
          let carry = 0;
          for (let j = 0; j < digits.length; j++) {
            digits[j] += carry;
            carry = (digits[j] / 58) | 0;
            digits[j] %= 58;
          }
          while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
          }
        }
        for (let i = 0; bytes[i] === 0 && i < bytes.length - 1; i++) digits.push(0);
        sigString = digits.reverse().map(digit => ALPHABET[digit]).join('');
      } else {
        // Fallback for unexpected types
        sigString = String(signature);
      }

      const truncatedSig = sigString.length > 20 ? `${sigString.slice(0, 10)}...${sigString.slice(-10)}` : sigString;

      console.log("Proposal signed successfully:", sigString);

      const totalCost = service.pricePerCall + service.platformFee;
      
      const currency = msg.proposal?.currency || "SOL";

      updateMessage(messageId, {
        content: `### 🧾 Digital Receipt\n` + 
                 `--- \n` +
                 `**Payment Status:** ✅ Confirmed & Settled\n\n` +
                 `**Transaction Details:**\n` +
                 `- **Hash:** \`${truncatedSig}\`\n` +
                 `- **Network:** Solana Devnet\n` +
                 `- **Currency:** ${currency}\n` +
                 `- **Method:** x402 Yield Protocol\n\n` +
                 `🔗 **[View on Solscan Explorer](https://solscan.io/tx/${sigString}?cluster=devnet)**`,
        status: "completed",
        cost: hasSubscription ? 0 : totalCost,
        proposal: undefined
      });

      // Always record transaction for demo/UX purposes
      addTransaction({
        service: service.name,
        type: "API",
        amount: hasSubscription ? "SUB" : `$${totalCost.toFixed(3)}`,
        status: "Settled", 
        source: hasSubscription ? "x402 Monthly" : "sUSDV Yield",
      });

      if (!hasSubscription) {
        deductYield(totalCost);
        useYieldStore.getState().recordSpending(totalCost);
      }
    } catch (error: any) {
      console.warn("Proposal signing error:", error);
      const isCancellation = error?.message?.toLowerCase().includes("user rejected") || 
                           error?.message?.toLowerCase().includes("cancelled");
      
      updateMessage(messageId, {
        content: isCancellation 
          ? "❌ **Transaction Cancelled**\n\nYou rejected the transaction in your wallet. No SOL was moved."
          : `❌ **Transaction Error**\n\n${error.message || "An unexpected error occurred during signing."}`,
        status: isCancellation ? "proposal" : "error", // Keep proposal available on cancellation
        hasAnimated: false,
      });
    }
  }, [messages, wallets, walletAddress, signAndSendTransaction, updateMessage, connectWallet, addTransaction, deductYield, hasSubscription]);

  const cancelProposal = useCallback((messageId: string) => {
    updateMessage(messageId, {
      status: "completed",
      content: "❌ **Transaction Cancelled**\n\nYou declined the transaction proposal. No yield was spent.",
      proposal: undefined
    });
  }, [updateMessage]);

  const handleServiceSelect = (service: AIService) => {
    setSelectedService(service);
    addMessage(
      `${service.name} selected.\n\nCost: ${service.pricePerCall === 0 ? "Free" : `$${service.pricePerCall.toFixed(3)} per request`}\n\nEnter your prompt or query.`,
      "assistant",
      { hasAnimated: false }
    );
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    selectedService,
    setSelectedService,
    currentYield,
    messagesEndRef,
    handleSend,
    handleServiceSelect,
    approveProposal,
    cancelProposal,
  };
}
