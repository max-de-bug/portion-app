"use client";

/**
 * Portion AI Chat Page
 * 
 * Dedicated page for AI-powered interactions using x402 protocol.
 * Features ChatGPT-style conversation tabs and AI service selection.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Connection, Transaction } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import { AI_SERVICES, AIService } from "@/app/config/agent-services";
import { useYieldStore } from "@/app/store/useYieldStore";
import { useTransactionStore } from "@/app/store/useTransactionStore";
import { useChatStore, Message } from "@/app/store/useChatStore";
import { useX402Session } from "@/app/hooks/useX402Session";

import { ConversationSidebar } from "@/app/dashboard/_components/ConversationSidebar";
import { 
  Send, 
  Bot, 
  Sparkles, 
  Loader2,
  Brain,
  MessageSquare,
  Zap,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";
const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "devnet" | "mainnet-beta") || "devnet";

// Filter services to show only LLM-related ones
const LLM_SERVICES = AI_SERVICES.filter(s => 
  s.id.includes("gpt") || s.id.includes("claude") || s.id.includes("llama")
);

export default function PortionAIPage() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  
  // Get Solana wallet address
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === "wallet" && account.chainType === "solana"
  ) as { address: string } | undefined;
  const walletAddress = solanaWallet?.address || "";
  const isValidSolanaAddress = walletAddress && !walletAddress.startsWith("0x");

  // Stores
  const currentYield = useYieldStore((state) => state.spendableYield);
  const deductYield = useYieldStore((state) => state.deductYield);
  const hasSubscription = useYieldStore((state) => state.hasSubscription);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  
  const {
    input,
    addMessage: storeAddMessage,
    updateMessage: storeUpdateMessage,
    setInput,
    setSelectedService,
    getActiveMessages,
    getSelectedService,
    activeConversationId,
  } = useChatStore();

  // Get messages and selected service from active conversation
  const messages = getActiveMessages();
  const selectedService = getSelectedService();

  // X402 Session
  const { 
    isAuthenticated, 
    isLoading: sessionLoading, 
    prepaidBalance, 
    getSessionToken,
    authenticate,
    error: sessionError
  } = useX402Session(walletAddress);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showConversationSidebar, setShowConversationSidebar] = useState(true);
  const [isSyncingSuccess, setIsSyncingSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeConversationId]);

  // Focus input on mount and sync success
  useEffect(() => {
    if (isAuthenticated && !isSyncingSuccess) {
      inputRef.current?.focus();
    }
  }, [activeConversationId, isAuthenticated, isSyncingSuccess]);

  const generateMessageId = () => 
    `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const addMessage = useCallback((content: string, role: "user" | "assistant", extras?: Partial<Message>) => {
    const msg: Message = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      hasAnimated: false,
      ...extras,
    };
    storeAddMessage(msg);
    return msg.id;
  }, [storeAddMessage]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    storeUpdateMessage(id, updates);
  }, [storeUpdateMessage]);

  const executeService = useCallback(async (service: AIService, userInput: string) => {
    if (!isAuthenticated) return;

    const totalCost = service.pricePerCall + service.platformFee;
    
    if (!hasSubscription && currentYield < totalCost) {
      addMessage(
        `Insufficient yield.\n\nRequired: $${totalCost.toFixed(3)}\nAvailable: $${currentYield.toFixed(2)}\n\nYour sUSDV needs more time to appreciate or top up your prepaid balance.`,
        "assistant",
        { status: "error", hasAnimated: false }
      );
      return;
    }

    const displayCost = hasSubscription 
      ? "Included in Subscription" 
      : totalCost === 0 
        ? "Free (Demo Beta)" 
        : `$${totalCost.toFixed(3)}`;

    const msgId = addMessage(
      `Processing with ${service.name}...\n\nCost: ${displayCost}`,
      "assistant",
      { status: "processing", hasAnimated: false }
    );

    try {
      // Step 1: Prepare payment
      const prepareRes = await fetch(`${BACKEND_URL}/x402/prepare`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(getSessionToken() && { "X-Session-Token": getSessionToken()! }),
        },
        body: JSON.stringify({
          service: service.id,
          walletAddress,
          inputData: userInput,
          usePrepaid: isAuthenticated && prepaidBalance && parseFloat(prepaidBalance.balance) >= totalCost,
        }),
      });

      if (!prepareRes.ok && prepareRes.status !== 402 && prepareRes.status !== 200) {
        throw new Error("Failed to prepare payment");
      }

      const prepareData = await prepareRes.json();
      const paymentId = prepareData.paymentId;

      // Step 2: Execute
      const executeRes = await fetch(`${BACKEND_URL}/x402/execute/${service.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": "yield-authorized",
          "X-Subscription": hasSubscription ? "active" : "none",
          ...(getSessionToken() && { "X-Session-Token": getSessionToken()! }),
        },
        body: JSON.stringify({
          input: userInput,
          paymentId,
          walletAddress,
          usePrepaid: prepareData.paymentMethod === "prepaid",
        }),
      });

      if (!executeRes.ok) {
        throw new Error("Service execution failed");
      }

      const result = await executeRes.json();

      updateMessage(msgId, {
        content: `${result.result.content || JSON.stringify(result.result, null, 2)}\n\n---\n💰 Cost: ${displayCost} | 📝 Payment: ${result.paymentMethod || 'yield'}`,
        status: "completed",
        cost: hasSubscription ? 0 : totalCost,
        hasAnimated: false,
      });

      addTransaction({
        service: service.name,
        type: "API",
        amount: hasSubscription ? "SUB" : `$${totalCost.toFixed(3)}`,
        status: "Processing",
        source: hasSubscription ? "x402 Monthly" : result.paymentMethod === "prepaid" ? "Prepaid" : "sUSDV Yield",
      });

      if (!hasSubscription && result.paymentMethod !== "prepaid") {
        deductYield(totalCost);
        useYieldStore.getState().recordSpending(totalCost);
      }
    } catch (error) {
      console.error("[PortionAI] Service execution error:", error);
      updateMessage(msgId, {
        content: `Request failed: ${error instanceof Error ? error.message : "Unknown error"}\n\nNo yield was spent.`,
        status: "error",
        hasAnimated: false,
      });
    }
  }, [walletAddress, currentYield, addMessage, updateMessage, hasSubscription, addTransaction, deductYield, getSessionToken, isAuthenticated, prepaidBalance]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isAuthenticated) return;

    const userInput = input.trim();
    addMessage(userInput, "user", { hasAnimated: true });
    setInput("");
    setIsLoading(true);

    try {
      if (selectedService) {
        await executeService(selectedService, userInput);
      } else {
        addMessage(
          "Please select a model above to start chatting.\n\nTip: Choose GPT-4 for advanced reasoning or Claude-3 for creative tasks.",
          "assistant",
          { hasAnimated: false }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleServiceSelect = (service: AIService) => {
    setSelectedService(service);
    setShowServiceSelector(false);
    if (isAuthenticated) {
      addMessage(
        `${service.name} selected.\n\nCost: ${service.pricePerCall === 0 ? "Free" : `$${service.pricePerCall.toFixed(3)} per request`}\n\nStart typing your message below.`,
        "assistant",
        { hasAnimated: false }
      );
    }
  };

  const handleAuth = async () => {
    const success = await authenticate();
    if (success) {
      setIsSyncingSuccess(true);
      setTimeout(() => {
        setIsSyncingSuccess(false);
      }, 1500);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Conversation Sidebar - ChatGPT Style */}
      <div 
        className={`border-r border-border bg-muted/30 transition-all duration-300 ${
          showConversationSidebar ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <ConversationSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setShowConversationSidebar(!showConversationSidebar)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={showConversationSidebar ? "Hide conversations" : "Show conversations"}
            >
              {showConversationSidebar ? (
                <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
              ) : (
                <PanelLeft className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-bold text-lg tracking-tight text-foreground">Portion AI</h1>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  {isAuthenticated ? 'Session Active' : 'Offline'} <Sparkles className="w-2.5 h-2.5" />
                </p>
              </div>
            </div>
          </div>
          
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowServiceSelector(!showServiceSelector)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              {selectedService ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium">{selectedService.name}</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Select Model</span>
                </>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showServiceSelector ? "rotate-180" : ""}`} />
            </button>

            {showServiceSelector && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-background border border-border rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">AI Models</p>
                <div className="space-y-1">
                  {LLM_SERVICES.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedService?.id === service.id
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedService?.id === service.id
                          ? "bg-emerald-500/20"
                          : "bg-muted"
                      }`}>
                        <Brain className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${service.pricePerCall.toFixed(3)} per call
                        </p>
                      </div>
                      {selectedService?.id === service.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          {/* Authentication Overlay */}
          <AnimatePresence>
            {!isAuthenticated && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-background/60 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="max-w-md w-full bg-background border border-border rounded-2xl shadow-2xl p-8 text-center"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transition-all duration-500 ${
                    isSyncingSuccess 
                      ? "bg-emerald-500 shadow-emerald-500/20 rotate-[360deg]" 
                      : "bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20"
                  }`}>
                    {isSyncingSuccess ? (
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    ) : (
                      <Zap className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {isSyncingSuccess ? "Session Synced!" : "Sync Your Session"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    {isSyncingSuccess 
                      ? "Your x402 session is now active. You can start chatting using your yield."
                      : "To interact with AI models using your yield, you need to prove wallet ownership. This is a one-time secure signature."}
                  </p>

                  {sessionError && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-left overflow-hidden text-ellipsis">
                      {sessionError}
                    </div>
                  )}

                  {!isSyncingSuccess && (
                    <button
                      onClick={handleAuth}
                      disabled={sessionLoading}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sessionLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Syncing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 fill-current" />
                          <span>Enable x402 AI Session</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {isSyncingSuccess && (
                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Initializing Chat...</span>
                    </div>
                  )}

                  <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Secure & Gasless Signature
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Welcome to Portion AI</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Chat with powerful AI models using your yield. Select a model above and start typing.
              </p>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                  Yield-Powered
                </div>
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium">
                  x402 Protocol
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-emerald-500 text-white"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                {message.status && message.status !== "completed" && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                    {message.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {message.status === "error" && <XCircle className="w-3 h-3" />}
                    <span className="capitalize">{message.status}</span>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={!isAuthenticated ? "Sync session to start chatting..." : selectedService ? `Message ${selectedService.name}...` : "Select a model to start chatting..."}
              disabled={!selectedService || isLoading || !isAuthenticated}
              className="flex-1 min-h-[52px] max-h-32 px-4 py-3 rounded-xl bg-muted border-none text-sm resize-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 placeholder:text-muted-foreground"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !selectedService || !isAuthenticated}
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Yield: ${currentYield.toFixed(2)}
              </span>
              {isAuthenticated && prepaidBalance && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" />
                  Prepaid: ${parseFloat(prepaidBalance.balance).toFixed(2)}
                </span>
              )}
            </div>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>


    </div>
  );
}
