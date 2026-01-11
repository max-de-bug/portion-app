"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Typewriter = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="inline-block w-1.5 h-3.5 bg-emerald-500 ml-1 animate-pulse" />}
    </span>
  );
};
import {
  X,
  Send,
  Bot,
  User,
  Zap,
  Loader2,
  CheckCircle2,
  Shield,
  Coins,
} from "lucide-react";
import { useAgentChat, Message } from "@/app/hooks/useAgentChat";
import { AI_SERVICES, AIService } from "@/app/config/agent-services";
import { useYieldStore } from "@/app/store/useYieldStore";

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
  availableYield?: number;
}

export const AgentChat = ({
  isOpen,
  onClose,
  walletAddress = "",
  availableYield = 0,
}: AgentChatProps) => {
  const { hasSubscription, toggleSubscription } = useYieldStore();
  const {
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
  } = useAgentChat(walletAddress);

  return (
    <>
      <style>{`
        .agent-chat-messages::-webkit-scrollbar {
          width: 5px;
        }
        .agent-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .agent-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .agent-chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="agent-chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 scrollbar-hide"
            onClick={onClose}
          >
            <motion.div
              key="agent-chat-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="w-full max-w-xl bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px] border border-zinc-800 z-[10002]"
              onClick={(e) => e.stopPropagation()}
            >
              <ChatHeader onClose={onClose} />
              
              <ChatStatusBar 
                currentYield={currentYield} 
                selectedService={selectedService} 
                hasSubscription={hasSubscription}
                onToggleSubscription={toggleSubscription}
                onDeselectService={() => setSelectedService(null)} 
              />

              <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                messagesEndRef={messagesEndRef} 
              />

              <ServicePicker 
                currentYield={currentYield} 
                selectedService={selectedService} 
                onServiceSelect={handleServiceSelect} 
              />

              <ChatInput 
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                selectedService={selectedService}
                onSend={handleSend}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* --- Sub-components --- */

const ChatHeader = ({ onClose }: { onClose: () => void }) => (
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
);

const ChatStatusBar = ({ 
  currentYield, 
  selectedService, 
  hasSubscription,
  onToggleSubscription,
  onDeselectService 
}: { 
  currentYield: number; 
  selectedService: AIService | null;
  hasSubscription: boolean;
  onToggleSubscription: (enabled: boolean) => void;
  onDeselectService: () => void;
}) => (
  <div className="px-5 py-2.5 bg-zinc-850 border-b border-zinc-800 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Coins className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs text-zinc-400">Yield</span>
        <span className="text-sm font-medium text-emerald-400">
          ${currentYield.toFixed(2)}
        </span>
      </div>

      <div className="h-4 w-px bg-zinc-700" />

      <button 
        onClick={() => onToggleSubscription(!hasSubscription)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
          hasSubscription 
            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" 
            : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${hasSubscription ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {hasSubscription ? "Subscription Active" : "Enable Subscription"}
        </span>
      </button>
    </div>
      {selectedService && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-800/50">
          <span className="text-xs text-emerald-400">
            {selectedService.name}
          </span>
          <button onClick={onDeselectService}>
            <X className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      )}
  </div>
);

const MessageList = ({ 
  messages, 
  isLoading, 
  messagesEndRef 
}: { 
  messages: Message[]; 
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 agent-chat-messages">
    {messages.map((message, idx) => (
      <motion.div
        key={message.id || `msg-fallback-${idx}`}
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
          className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm transition-all shadow-sm ${
            message.role === "user"
              ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-900/20"
              : "bg-zinc-800/80 backdrop-blur-md text-zinc-100 border border-zinc-700 shadow-black/20"
          }`}
        >
          <div className="whitespace-pre-wrap leading-relaxed font-mono text-xs">
            {message.role === "assistant" && message.status === "completed" ? (
              <Typewriter text={message.content} />
            ) : (
              message.content
            )}
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
      <div key="loading-indicator" className="flex gap-2.5">
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
);

const ServicePicker = ({ 
  currentYield, 
  selectedService, 
  onServiceSelect 
}: { 
  currentYield: number; 
  selectedService: AIService | null;
  onServiceSelect: (service: AIService) => void;
}) => (
  <div className="px-4 py-3 bg-zinc-850 border-t border-zinc-800 shrink-0">
    <p className="text-[10px] text-zinc-500 mb-2 uppercase font-bold tracking-wider">AI Services (x402)</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[200px] custom-scrollbar p-1">
      {AI_SERVICES.map((service) => {
        const Icon = service.icon;
        const isDisabled = currentYield < service.pricePerCall;
        const isSelected = selectedService?.id === service.id;
        
        return (
          <button
            key={service.id}
            onClick={() => onServiceSelect(service)}
            disabled={isDisabled}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
              isDisabled
                ? "bg-zinc-800/30 opacity-40 cursor-not-allowed"
                : isSelected
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            <div className={isSelected ? "text-white" : "text-emerald-400"}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-zinc-300 truncate w-full">
              {service.name}
            </span>
            <span className={`text-[9px] ${isSelected ? "text-emerald-100" : "text-emerald-500"}`}>
              ${service.pricePerCall.toFixed(3)}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const ChatInput = ({
  input,
  setInput,
  isLoading,
  selectedService,
  onSend
}: {
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  selectedService: AIService | null;
  onSend: () => void;
}) => (
  <div className="p-4 border-t border-zinc-800 bg-zinc-900">
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
        placeholder={
          selectedService
            ? `Enter prompt for ${selectedService.name}...`
            : "Select a service above..."
        }
        className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-600 font-mono"
        disabled={isLoading || !selectedService}
      />
      <button
        onClick={onSend}
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
);
