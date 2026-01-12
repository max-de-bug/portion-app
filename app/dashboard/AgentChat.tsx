"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Bot,
  User,
  Zap,
  Loader2,
  CheckCircle2,
  Coins,
  Crown,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  CreditCard,
  Infinity as InfinityIcon,
  Clock,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import { useAgentChat, Message } from "@/app/hooks/useAgentChat";
import { AI_SERVICES, AIService } from "@/app/config/agent-services";
import { useChatStore } from "@/app/store/useChatStore";
import { useYieldStore } from "@/app/store/useYieldStore";

const renderMarkdown = (content: string) => {
  if (!content) return null;
  
  // Custom regex to handle basic markdown: ### headers, **bold**, and [label](url) links
  const parts = content.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(### .*?\n?)/g).filter(Boolean);
  
  return parts.map((part, index) => {
    // Match Links: [label](url)
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a 
          key={index} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-500 hover:text-emerald-400 font-bold underline transition-colors inline-block break-all"
        >
          {linkMatch[1]}
        </a>
      );
    }
    
    // Match Bold: **text**
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
    }
    
    // Match Headers: ### text
    if (part.startsWith("### ")) {
      return <h3 key={index} className="text-lg font-bold text-zinc-900 mt-2 mb-1 block uppercase tracking-tight">{part.slice(4)}</h3>;
    }

    // Default: Plain Text
    return <span key={index}>{part}</span>;
  });
};

const Typewriter = ({ 
  text, 
  speed = 15, 
  startAnimating = true,
  onComplete 
}: { 
  text: string; 
  speed?: number;
  startAnimating?: boolean;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState(startAnimating ? "" : text);
  const [isComplete, setIsComplete] = useState(!startAnimating);

  useEffect(() => {
    if (!startAnimating) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, startAnimating, onComplete]);

  return (
    <span>
      {renderMarkdown(displayedText)}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1.5 h-3.5 bg-emerald-500 ml-1 align-middle"
        />
      )}
    </span>
  );
};

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
  const [showSubscription, setShowSubscription] = useState(false);
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
    approveProposal,
    cancelProposal,
  } = useAgentChat(walletAddress);

  const toggleView = () => setShowSubscription(!showSubscription);

  return (
    <>
      <style>{`
        .agent-chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .agent-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .agent-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .agent-chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .rainbow-border {
          position: relative;
        }
        .rainbow-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 2rem;
          padding: 1px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0,0,0,0.05));
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: destination-out;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="agent-chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 scrollbar-hide"
            onClick={onClose}
          >
            <motion.div
              key="agent-chat-modal"
              initial={{ opacity: 0, scale: 0.92, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-4xl glass-panel rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[850px] border border-white/20 z-[10002] rainbow-border"
              onClick={(e) => e.stopPropagation()}
            >
              <UnifiedHeader 
                currentYield={currentYield}
                hasSubscription={hasSubscription}
                onClose={onClose} 
                onToggleSubscription={toggleView}
                isSubscriptionView={showSubscription} 
                onBack={() => setShowSubscription(false)} 
              />
              
              {!showSubscription ? (
                <>
                  <CompactServicePicker 
                    currentYield={currentYield} 
                    selectedService={selectedService} 
                    onServiceSelect={handleServiceSelect}
                    hasSubscription={hasSubscription}
                  />

                  <MessageList 
                    messages={messages} 
                    isLoading={isLoading} 
                    messagesEndRef={messagesEndRef} 
                    hasSubscription={hasSubscription}
                    onApproveProposal={approveProposal}
                    onCancelProposal={cancelProposal}
                  />

                  <ChatInput 
                    input={input}
                    setInput={setInput}
                    isLoading={isLoading}
                    selectedService={selectedService}
                    onSend={handleSend}
                  />
                </>
              ) : (
                <SubscriptionView 
                  hasSubscription={hasSubscription} 
                  onToggle={toggleSubscription} 
                  onBack={() => setShowSubscription(false)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const UnifiedHeader = ({ 
  currentYield,
  hasSubscription,
  onClose, 
  onToggleSubscription,
  isSubscriptionView,
  onBack
}: { 
  currentYield: number;
  hasSubscription: boolean;
  onClose: () => void; 
  onToggleSubscription: () => void;
  isSubscriptionView: boolean;
  onBack: () => void;
}) => (
  <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 bg-white/50 relative z-20 backdrop-blur-xl shrink-0 h-[72px]">
    <div className="flex items-center gap-4">
      {isSubscriptionView && (
        <button 
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-600" />
        </button>
      )}
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <Bot className="w-6 h-6 text-emerald-600" />
          </div>
          {!isSubscriptionView && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-[2px] border-white shadow-xl" />
          )}
        </div>
        
        <div>
          <h2 className="text-sm font-bold text-zinc-900 tracking-tight leading-none">
            {isSubscriptionView ? "Pro Membership" : "Portion AI"}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            {!isSubscriptionView ? (
              <>
                <div className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 flex items-center gap-1.5">
                   <Coins className="w-3 h-3 text-emerald-600" />
                   <span className="text-[10px] font-mono text-emerald-700 font-medium">${currentYield.toFixed(4)}</span>
                </div>
                <button 
                  onClick={onToggleSubscription}
                  className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors ${hasSubscription ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-900"}`}
                >
                   {hasSubscription ? <Crown className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                   <span className="text-[10px] font-bold uppercase tracking-wider">{hasSubscription ? "PRO" : "UPGRADE"}</span>
                </button>
              </>
            ) : (
                <span className="text-[11px] text-zinc-500 font-medium">Manage your access level</span>
            )}
          </div>
        </div>
      </div>
    </div>

    <button
      onClick={onClose}
      className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-all duration-300 group active:scale-90"
    >
      <X className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900" />
    </button>
  </div>
);

const CompactServicePicker = ({ 
  currentYield, 
  selectedService, 
  onServiceSelect,
  hasSubscription
}: { 
  currentYield: number; 
  selectedService: AIService | null;
  onServiceSelect: (service: AIService) => void;
  hasSubscription: boolean;
}) => (
  <div className="px-6 py-3 border-b border-zinc-100 bg-white/50 backdrop-blur-md shrink-0 overflow-x-auto scrollbar-hide flex items-center gap-3">
    {AI_SERVICES.map((service) => {
      const Icon = service.icon;
      const isDisabled = !hasSubscription && currentYield < service.pricePerCall;
      const isSelected = selectedService?.id === service.id;
      
      return (
        <button
          key={service.id}
          onClick={() => onServiceSelect(service)}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${
            isDisabled
              ? "opacity-40 grayscale cursor-not-allowed border-transparent bg-zinc-50"
              : isSelected
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
              : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="text-xs font-bold tracking-tight">{service.name}</span>
          {isSelected && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          )}
        </button>
      );
    })}
  </div>
);

const MessageList = ({ 
  messages, 
  isLoading, 
  messagesEndRef,
  hasSubscription,
  onApproveProposal,
  onCancelProposal
}: { 
  messages: Message[]; 
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  hasSubscription: boolean;
  onApproveProposal: (id: string) => void;
  onCancelProposal: (id: string) => void;
}) => {
  const { markMessageAsAnimated } = useChatStore();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 agent-chat-messages scroll-smooth bg-zinc-50/50">
      {messages.length === 0 && !isLoading && (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
          <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center">
              <Bot className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-400">How can I help you today?</p>
        </div>
      )}
      {messages.map((message, idx) => (
        <motion.div
          key={message.id || `msg-fallback-${idx}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex gap-4 ${
            message.role === "user" ? "flex-row-reverse" : ""
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              message.role === "user" 
                ? "bg-emerald-600 text-white" 
                : "bg-white border border-zinc-200 text-zinc-500"
            }`}
          >
            {message.role === "user" ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          <div
            className={`max-w-[85%] px-5 py-3 rounded-2xl text-[14px] leading-relaxed relative shadow-sm overflow-hidden break-words ${
              message.role === "user"
                ? "bg-emerald-600 text-white rounded-tr-sm"
                : "bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm"
            }`}
          >
            <div className="whitespace-pre-wrap font-sans">
              {message.role === "assistant" && message.status === "completed" ? (
                <Typewriter 
                  text={message.content} 
                  startAnimating={!message.hasAnimated}
                  onComplete={() => markMessageAsAnimated(message.id)}
                />
              ) : (
                renderMarkdown(message.content)
              )}
            </div>

            <div className={`mt-2 flex flex-col gap-3 pt-2 border-t ${message.role === "user" ? "border-white/20" : "border-zinc-100"}`}>
              {message.status === "proposal" && (
                <div className="flex items-center gap-2 py-1">
                  <button
                    onClick={() => onApproveProposal(message.id)}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Pay Now
                  </button>
                  <button
                    onClick={() => onCancelProposal(message.id)}
                    className="flex-1 py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                   {/* Status Indicators */}
                   {(message.status === "processing" || message.status === "pending") && (
                     <span className="text-[10px] text-amber-500 animate-pulse font-medium flex items-center gap-1">
                       <Loader2 className="w-2.5 h-2.5 animate-spin" />
                       Processing...
                     </span>
                   )}
                   {message.status === "proposal" && (
                     <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                       <CircleDollarSign className="w-2.5 h-2.5" />
                       Awaiting Approval
                     </span>
                   )}
                   {message.status === "error" && <span className="text-[10px] text-rose-500 font-medium">Error</span>}
                </div>
                {message.cost !== undefined && message.role === "assistant" && (
                   <span className="text-[10px] font-mono text-zinc-400 font-medium tracking-tight">
                      {message.cost === 0 ? "FREE" : `$${message.cost.toFixed(4)}`}
                   </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {isLoading && !messages.find((m) => m.status === "processing") && (
         <div className="flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
               <Bot className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
               <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            </div>
         </div>
      )}
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
};

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
  <div className="p-4 border-t border-zinc-100 bg-white/80 backdrop-blur-md relative z-20 shrink-0">
    <div className="flex gap-3 relative max-w-4xl mx-auto">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
        placeholder={
          selectedService
            ? `Message ${selectedService.name}...`
            : "Select a model to start"
        }
        className="flex-1 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium shadow-sm"
        disabled={isLoading || !selectedService}
      />
      
      <button
        onClick={onSend}
        disabled={!input.trim() || isLoading || !selectedService}
        className="w-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-400 text-white flex items-center justify-center transition-all shadow-lg shadow-emerald-600/20"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  </div>
);

const SubscriptionView = ({ 
  hasSubscription, 
  onToggle, 
  onBack 
}: { 
  hasSubscription: boolean; 
  onToggle: (val: boolean) => void;
  onBack: () => void;
}) => (
  <div className="flex-1 overflow-y-auto p-12 bg-zinc-50/50">
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10"
        >
          <Crown className="w-10 h-10 text-indigo-600" />
        </motion.div>
        <h3 className="text-4xl font-black text-zinc-900 tracking-tighter">Choose Your Power</h3>
        <p className="text-zinc-500 text-lg font-medium">Unlock the full potential of Portion Intelligence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 space-y-8 shadow-xl shadow-zinc-200/50 hover:shadow-2xl transition-all group">
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-zinc-900">Basic Access</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-zinc-900">$0.00</span>
              <span className="text-sm font-medium text-zinc-500">per month</span>
            </div>
          </div>
          
          <ul className="space-y-4">
            {[
              { text: "Pay per request", icon: CircleDollarSign },
              { text: "Uses sUSDV yield", icon: Coins },
              { text: "Standard priority", icon: Clock },
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-600">
                <feature.icon className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-medium">{feature.text}</span>
              </li>
            ))}
          </ul>

          <button 
            disabled={!hasSubscription}
            onClick={() => onToggle(false)}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
              !hasSubscription 
                ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-default" 
                : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20"
            }`}
          >
            {!hasSubscription ? "Current Plan" : "Switch to Basic"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-8 rounded-[3rem] bg-indigo-600 text-white space-y-8 shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
          <div className="absolute top-4 right-6 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20">Best Value</div>
          
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-white">Portion Pro</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">$0.00</span>
              <span className="text-sm font-medium text-white/60">BETA PROMO</span>
            </div>
          </div>
          
          <ul className="space-y-4">
            {[
              { text: "Unlimited requests", icon: InfinityIcon },
              { text: "Zero per-call fees", icon: Zap },
              { text: "Neural Priority", icon: Sparkles },
              { text: "Exclusive AI Models", icon: Crown },
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <feature.icon className="w-5 h-5 text-white/80" />
                <span className="text-sm font-bold text-white">{feature.text}</span>
              </li>
            ))}
          </ul>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={hasSubscription}
            onClick={() => onToggle(true)}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
              hasSubscription 
                ? "bg-white/20 text-white border border-white/20 cursor-default" 
                : "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
            }`}
          >
            {hasSubscription ? "Active Plan" : "Get Portion Pro"}
          </motion.button>
        </div>
      </div>

      <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 flex flex-col sm:flex-row items-center gap-8 justify-between shadow-lg shadow-zinc-200/50">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
              <CreditCard className="w-7 h-7 text-zinc-400" />
           </div>
           <div>
              <p className="text-zinc-900 font-bold">Secure Settlement</p>
              <p className="text-zinc-500 text-sm">Payments authorized via sUSDV protocol</p>
           </div>
        </div>
        <button 
          onClick={onBack}
          className="text-emerald-600 font-black text-sm uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-2"
        >
          Return to Hub <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);
