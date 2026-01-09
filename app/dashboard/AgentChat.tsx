"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Bot,
  User,
  Zap,
  Loader2,
  CheckCircle2,
  Shield,
  Activity,
  Globe,
  Image as ImageIcon,
  Coins,
  ArrowRight,
  Cpu,
  Mic,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  status?: "pending" | "processing" | "completed" | "error";
  cost?: number;
}

interface ServiceAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  pricePerCall: number;
  apiService: string;
}

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  availableYield?: number;
}

// AI Services available via x402
const AI_SERVICES: ServiceAgent[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Advanced reasoning",
    icon: <Cpu className="w-4 h-4" />,
    pricePerCall: 0.03,
    apiService: "gpt-4",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "Fast responses",
    icon: <Zap className="w-4 h-4" />,
    pricePerCall: 0.01,
    apiService: "gpt-4-turbo",
  },
  {
    id: "claude-3",
    name: "Claude 3",
    description: "Anthropic AI",
    icon: <Bot className="w-4 h-4" />,
    pricePerCall: 0.025,
    apiService: "claude-3",
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    description: "Image generation",
    icon: <ImageIcon className="w-4 h-4" />,
    pricePerCall: 0.04,
    apiService: "dall-e-3",
  },
  {
    id: "whisper",
    name: "Whisper",
    description: "Audio transcription",
    icon: <Mic className="w-4 h-4" />,
    pricePerCall: 0.006,
    apiService: "whisper",
  },
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web",
    icon: <Globe className="w-4 h-4" />,
    pricePerCall: 0.005,
    apiService: "web-search",
  },
];

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const AgentChat = ({
  isOpen,
  onClose,
  walletAddress = "",
  availableYield = 0,
}: AgentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to Portion x402.\n\nSpend your sUSDV yield on AI services. Select a service below or describe your task.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceAgent | null>(
    null
  );
  const [currentYield, setCurrentYield] = useState(availableYield);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setCurrentYield(availableYield);
  }, [availableYield]);

  const generateId = () =>
    `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const addMessage = useCallback(
    (
      content: string,
      role: "user" | "assistant",
      extras?: Partial<Message>
    ) => {
      const msg: Message = {
        id: generateId(),
        role,
        content,
        timestamp: new Date(),
        ...extras,
      };
      setMessages((prev) => [...prev, msg]);
      return msg.id;
    },
    []
  );

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  const executeService = useCallback(
    async (service: ServiceAgent, userInput: string) => {
      if (currentYield < service.pricePerCall) {
        addMessage(
          `Insufficient yield.\n\nRequired: $${service.pricePerCall.toFixed(
            3
          )}\nAvailable: $${currentYield.toFixed(
            2
          )}\n\nYour sUSDV needs more time to appreciate.`,
          "assistant",
          { status: "error" }
        );
        return;
      }

      // Show processing state
      const msgId = addMessage(
        `Processing ${
          service.name
        } request...\n\nCost: $${service.pricePerCall.toFixed(
          3
        )}\nInput: "${userInput.slice(0, 50)}${
          userInput.length > 50 ? "..." : ""
        }"`,
        "assistant",
        { status: "processing" }
      );

      try {
        // Step 1: Prepare payment
        const prepareRes = await fetch(`${BACKEND_URL}/x402/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: service.apiService,
            walletAddress,
            inputData: userInput,
          }),
        });

        if (!prepareRes.ok && prepareRes.status !== 402) {
          throw new Error("Failed to prepare payment");
        }

        const prepareData = await prepareRes.json();
        const paymentId = prepareData.paymentId;

        // Step 2: Execute with payment
        const executeRes = await fetch(
          `${BACKEND_URL}/x402/execute/${service.apiService}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Payment": "yield-authorized", // In production: actual signature
            },
            body: JSON.stringify({
              input: userInput,
              paymentId,
              walletAddress,
            }),
          }
        );

        if (!executeRes.ok) {
          throw new Error("Service execution failed");
        }

        const result = await executeRes.json();

        // Format response based on service
        let responseContent = "";
        if (service.id === "dall-e-3") {
          responseContent = `Image generated.\n\nPrompt: "${userInput}"\n\n[Image: ${
            result.result.imageUrl
          }]\n\nCost: $${service.pricePerCall.toFixed(3)}`;
        } else if (service.id === "web-search") {
          const results = result.result.results || [];
          responseContent = `Search complete.\n\nQuery: "${userInput}"\n\nResults:\n${results
            .map((r: { title: string }, i: number) => `${i + 1}. ${r.title}`)
            .join("\n")}\n\nCost: $${service.pricePerCall.toFixed(3)}`;
        } else {
          responseContent = `${
            result.result.content || JSON.stringify(result.result, null, 2)
          }\n\nCost: $${service.pricePerCall.toFixed(3)}`;
        }

        updateMessage(msgId, {
          content: responseContent,
          status: "completed",
          cost: service.pricePerCall,
        });

        // Update yield
        setCurrentYield((prev) => Math.max(0, prev - service.pricePerCall));
      } catch (error) {
        updateMessage(msgId, {
          content: `Request failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }\n\nNo yield was spent.`,
          status: "error",
        });
      }
    },
    [walletAddress, currentYield, addMessage, updateMessage]
  );

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    addMessage(userInput, "user");
    setInput("");
    setIsLoading(true);

    try {
      if (selectedService) {
        await executeService(selectedService, userInput);
        setSelectedService(null);
      } else {
        // Check for balance queries
        const lower = userInput.toLowerCase();
        if (
          lower.includes("balance") ||
          lower.includes("yield") ||
          lower.includes("how much")
        ) {
          addMessage(
            `Your spendable yield: $${currentYield.toFixed(
              2
            )}\n\nThis is the appreciation from your sUSDV holdings. Your principal (sUSDV) remains untouched.\n\nSelect a service below to spend yield.`,
            "assistant"
          );
        } else {
          addMessage(
            `To process your request, select an AI service first.\n\nYour query: "${userInput}"`,
            "assistant"
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: ServiceAgent) => {
    setSelectedService(service);
    addMessage(
      `${service.name} selected.\n\nCost: $${service.pricePerCall.toFixed(
        3
      )} per request\n\nEnter your prompt or query.`,
      "assistant"
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="w-full max-w-xl bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-zinc-800 px-5 py-4 flex items-center justify-between border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">x402 Services</h2>
                <p className="text-zinc-400 text-xs">Pay with sUSDV yield</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="px-5 py-2.5 bg-zinc-850 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-zinc-400">Yield</span>
                <span className="text-sm font-medium text-emerald-400">
                  ${currentYield.toFixed(2)}
                </span>
              </div>
              {selectedService && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-800/50">
                  <span className="text-xs text-emerald-400">
                    {selectedService.name}
                  </span>
                  <button onClick={() => setSelectedService(null)}>
                    <X className="w-3 h-3 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Shield className="w-3 h-3" />
              <span>Principal safe</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    message.role === "user" ? "bg-emerald-600" : "bg-zinc-700"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-zinc-300" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm ${
                    message.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-mono text-xs">
                    {message.content}
                  </div>

                  {message.status === "processing" && (
                    <div className="mt-2 flex items-center gap-1.5 text-amber-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Processing...</span>
                    </div>
                  )}
                  {message.status === "completed" && (
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs">Complete</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && !messages.find((m) => m.status === "processing") && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-md bg-zinc-700 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-zinc-300" />
                </div>
                <div className="bg-zinc-800 px-3.5 py-2.5 rounded-xl border border-zinc-700">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Service Picker */}
          <div className="px-4 py-3 bg-zinc-850 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">AI Services (x402):</p>
            <div className="grid grid-cols-3 gap-1.5">
              {AI_SERVICES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  disabled={currentYield < service.pricePerCall}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
                    currentYield < service.pricePerCall
                      ? "bg-zinc-800/30 opacity-40 cursor-not-allowed"
                      : selectedService?.id === service.id
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                  }`}
                >
                  <div
                    className={`${
                      selectedService?.id === service.id
                        ? "text-white"
                        : "text-emerald-400"
                    }`}
                  >
                    {service.icon}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-300 truncate w-full">
                    {service.name}
                  </span>
                  <span
                    className={`text-[9px] ${
                      selectedService?.id === service.id
                        ? "text-emerald-100"
                        : "text-emerald-500"
                    }`}
                  >
                    ${service.pricePerCall.toFixed(3)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                placeholder={
                  selectedService
                    ? `Enter prompt for ${selectedService.name}...`
                    : "Select a service above..."
                }
                className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 font-mono"
                disabled={isLoading || !selectedService}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !selectedService}
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2 text-center">
              x402 Protocol · Devnet Beta · Principal protected
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
