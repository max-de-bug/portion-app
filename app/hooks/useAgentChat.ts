"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AI_SERVICES, AIService } from "@/app/config/agent-services";
import { useYieldStore } from "@/app/store/useYieldStore";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  status?: "pending" | "processing" | "completed" | "error";
  cost?: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export function useAgentChat(walletAddress: string) {
  const { spendableYield: currentYield, deductYield } = useYieldStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Portion x402.\n\nSpend your sUSDV yield on AI services. Select a service below or describe your task.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<AIService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const addMessage = useCallback((content: string, role: "user" | "assistant", extras?: Partial<Message>) => {
    const msg: Message = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      ...extras,
    };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const executeService = useCallback(
    async (service: AIService, userInput: string) => {
      if (currentYield < service.pricePerCall) {
        addMessage(
          `Insufficient yield.\n\nRequired: $${service.pricePerCall.toFixed(3)}\nAvailable: $${currentYield.toFixed(2)}\n\nYour sUSDV needs more time to appreciate.`,
          "assistant",
          { status: "error" }
        );
        return;
      }

      const msgId = addMessage(
        `Processing ${service.name} request...\n\nCost: $${service.pricePerCall.toFixed(3)}\nInput: "${userInput.slice(0, 50)}${userInput.length > 50 ? "..." : ""}"`,
        "assistant",
        { status: "processing" }
      );

      try {
        // Step 1: Prepare payment
        const prepareRes = await fetch(`${BACKEND_URL}/x402/prepare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: service.id,
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
        const executeRes = await fetch(`${BACKEND_URL}/x402/execute/${service.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": "yield-authorized",
          },
          body: JSON.stringify({
            input: userInput,
            paymentId,
            walletAddress,
          }),
        });

        if (!executeRes.ok) {
          throw new Error("Service execution failed");
        }

        const result = await executeRes.json();

        let responseContent = "";
        if (service.id === "dall-e-3") {
          responseContent = `Image generated.\n\nPrompt: "${userInput}"\n\n[Image: ${result.result.imageUrl}]\n\nCost: $${service.pricePerCall.toFixed(3)}`;
        } else if (service.id === "web-search") {
          const results = result.result.results || [];
          responseContent = `Search complete.\n\nQuery: "${userInput}"\n\nResults:\n${results
            .map((r: { title: string }, i: number) => `${i + 1}. ${r.title}`)
            .join("\n")}\n\nCost: $${service.pricePerCall.toFixed(3)}`;
        } else {
          responseContent = `${result.result.content || JSON.stringify(result.result, null, 2)}\n\nCost: $${service.pricePerCall.toFixed(3)}`;
        }

        updateMessage(msgId, {
          content: responseContent,
          status: "completed",
          cost: service.pricePerCall,
        });

        deductYield(service.pricePerCall);
      } catch (error) {
        updateMessage(msgId, {
          content: `Request failed: ${error instanceof Error ? error.message : "Unknown error"}\n\nNo yield was spent.`,
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
        const lower = userInput.toLowerCase();
        if (lower.includes("balance") || lower.includes("yield") || lower.includes("how much")) {
          addMessage(
            `Your spendable yield: $${currentYield.toFixed(2)}\n\nThis is the appreciation from your sUSDV holdings. Your principal (sUSDV) remains untouched.\n\nSelect a service below to spend yield.`,
            "assistant"
          );
        } else {
          addMessage(`To process your request, select an AI service first.\n\nYour query: "${userInput}"`, "assistant");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: AIService) => {
    setSelectedService(service);
    addMessage(
      `${service.name} selected.\n\nCost: $${service.pricePerCall.toFixed(3)} per request\n\nEnter your prompt or query.`,
      "assistant"
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
  };
}
