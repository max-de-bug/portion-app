import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIService } from "@/app/config/agent-services";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  status?: "pending" | "processing" | "completed" | "error" | "proposal";
  cost?: number;
  hasAnimated?: boolean;
  proposal?: {
    txBase64: string;
    description: string;
    serviceId: string;
    currency?: string;
  };
}

interface ChatState {
  messages: Message[];
  input: string;
  selectedService: AIService | null;
  
  // Actions
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setInput: (value: string) => void;
  setSelectedService: (service: AIService | null) => void;
  markMessageAsAnimated: (id: string) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Welcome to Portion x402.\n\nSpend your sUSDV yield on AI services. Select a service below or describe your task.",
          timestamp: new Date(),
          hasAnimated: true, // Welcome message should not animate on reload
        },
      ],
      input: "",
      selectedService: null,

      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      setInput: (value) => set({ input: value }),
      
      setSelectedService: (service) => set({ selectedService: service }),

      markMessageAsAnimated: (id) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, hasAnimated: true } : m
          ),
        })),

      clearHistory: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Welcome to Portion x402.\n\nSpend your sUSDV yield on AI services. Select a service below or describe your task.",
              timestamp: new Date(),
              hasAnimated: true,
            },
          ],
          input: "",
          selectedService: null,
        }),
    }),
    {
      name: "portion_chat_storage_v1",
      partialize: (state) => ({
        messages: state.messages,
        input: state.input, // Optional: restore typed input
        // selectedService is complex object, maybe skip or ensure serializable. 
        // It's just config data, so it's fine to persist if it matches usage.
        selectedService: state.selectedService 
      }),
    }
  )
);
