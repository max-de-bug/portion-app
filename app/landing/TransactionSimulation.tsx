"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  YieldCapacityContent,
  ConfigurePoliciesContent,
  ProcessTransactionsContent,
  AuditTrailContent,
  type Transaction,
  type AuditLog,
} from "./_components/simulation";

// Constants moved outside component to avoid recreation
const SERVICES = [
  { name: "OpenAI Payments", type: "API", source: "sUSDv Staking" },
  { name: "Portion Analytics", type: "SaaS", source: "YaaS (Liquid)" },
  { name: "Anthropic API", type: "API", source: "sUSDv Staking" },
  { name: "AWS Cloudfront", type: "Cloud", source: "SOLO Rewards" },
  { name: "Supabase DB", type: "Cloud", source: "YaaS (Liquid)" },
  { name: "Midjourney Sub", type: "Content", source: "SOLO Rewards" },
] as const;

const AUDIT_EVENTS = [
  { action: "Policy Updated", detail: "Daily limit increased to $500", status: "success" as const },
  { action: "Transaction Approved", detail: "OpenAI Payments - $15.00", status: "success" as const },
  { action: "Policy Check", detail: "Merchant whitelist validated", status: "success" as const },
  { action: "Transaction Denied", detail: "Exceeded daily limit", status: "error" as const },
  { action: "Wallet Connected", detail: "0x7a...f3c2", status: "success" as const },
  { action: "New Merchant Added", detail: "Anthropic API", status: "success" as const },
] as const;

type TabId = "yield" | "policies" | "transactions" | "audit";

interface Tab {
  id: TabId;
  label: string;
  description: string;
}

const TABS: Tab[] = [
  { id: "yield", label: "YaaS Yield Capacity", description: "Monitor yield allocation and efficiency" },
  { id: "policies", label: "Configure Policies", description: "Set up spending limits and rules" },
  { id: "transactions", label: "Process Transactions", description: "Automated x402 payments" },
  { id: "audit", label: "Review Audit Trail", description: "Track all activity and compliance" },
];

/**
 * TransactionSimulation - Refactored for Performance
 * 
 * Key optimizations:
 * 1. Nested components extracted to separate memoized files
 * 2. Constants moved outside component
 * 3. useCallback for stable function references
 * 4. Reduced from ~1000 lines to ~250 lines
 */
export const TransactionSimulation = memo(function TransactionSimulation() {
  const [activeTab, setActiveTab] = useState<TabId>("yield");
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", service: "OpenAI Payments", status: "Settled", time: "2m ago", amount: "$15.00", type: "API", source: "sUSDv Staking" },
    { id: "2", service: "Portion Analytics", status: "Settled", time: "5m ago", amount: "$12.00", type: "SaaS", source: "YaaS Yield" },
  ]);
  const [limitUsage, setLimitUsage] = useState(42);
  const [isSimulating, setIsSimulating] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuditSimulating, setIsAuditSimulating] = useState(false);

  // Memoized callbacks for stable references
  const addAuditLog = useCallback(() => {
    const event = AUDIT_EVENTS[Math.floor(Math.random() * AUDIT_EVENTS.length)];
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: event.action,
      detail: event.detail,
      time: "Just now",
      status: event.status,
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 6));
  }, []);

  const addTransaction = useCallback(() => {
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
    const isSolo = service.source === "SOLO Rewards";
    const amount = isSolo 
      ? `${(Math.random() * 50 + 10).toFixed(0)} SOLO` 
      : `$${(Math.random() * 20 + 5).toFixed(2)}`;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      service: service.name,
      status: "Processing",
      time: "Just now",
      amount,
      type: service.type as Transaction["type"],
      source: service.source,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 5));

    // Update status after delays
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === newTx.id ? { ...tx, status: "Validated" } : tx))
      );
      setLimitUsage((prev) => Math.min(prev + 2, 100));
    }, 2000);

    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === newTx.id ? { ...tx, status: "Settled" } : tx))
      );
    }, 4500);
  }, []);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    
    if (tabId === "transactions" && !isSimulating) {
      setIsSimulating(true);
      addTransaction();
    }
    
    if (tabId === "audit" && !isAuditSimulating) {
      setIsAuditSimulating(true);
      addAuditLog();
    }
    
    if (tabId !== "transactions") setIsSimulating(false);
    if (tabId !== "audit") setIsAuditSimulating(false);
  }, [isSimulating, isAuditSimulating, addTransaction, addAuditLog]);

  const handleReset = useCallback(() => {
    setIsSimulating(false);
    setTransactions([]);
    setLimitUsage(0);
  }, []);

  const handleAuditReset = useCallback(() => {
    setIsAuditSimulating(false);
    setAuditLogs([]);
  }, []);

  // Transaction simulation interval
  useEffect(() => {
    if (!isSimulating) return;
    
    const interval = setInterval(addTransaction, 6000);
    return () => clearInterval(interval);
  }, [isSimulating, addTransaction]);

  // Audit simulation interval
  useEffect(() => {
    if (!isAuditSimulating) return;
    
    const interval = setInterval(addAuditLog, 4000);
    return () => clearInterval(interval);
  }, [isAuditSimulating, addAuditLog]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "yield":
        return <YieldCapacityContent limitUsage={limitUsage} />;
      case "policies":
        return <ConfigurePoliciesContent limitUsage={limitUsage} />;
      case "transactions":
        return (
          <ProcessTransactionsContent
            transactions={transactions}
            isSimulating={isSimulating}
            onReset={handleReset}
          />
        );
      case "audit":
        return (
          <AuditTrailContent
            auditLogs={auditLogs}
            isAuditSimulating={isAuditSimulating}
            onReset={handleAuditReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-3xl border border-border p-6 md:p-10 shadow-2xl relative overflow-hidden group">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className={cn("w-5 h-5 text-primary", isSimulating && "animate-pulse")} />
            <h4 className="text-2xl font-bold text-foreground">Spending Simulation</h4>
          </div>
          <p className="text-muted-foreground">Watch transactions flow through policy validation in real-time</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-8 relative z-10">
        {/* Tab Navigation */}
        <TabNavigation 
          tabs={TABS} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        {/* Content Area */}
        <div className="p-6 rounded-2xl bg-muted/40 border border-border/50 backdrop-blur-sm min-h-[400px]">
          {renderContent()}
        </div>
      </div>
      
      <SimulationStyles />
    </div>
  );
});

// Memoized tab navigation component
const TabNavigation = memo(function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}) {
  return (
    <div className="space-y-2">
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-300 border-l-4",
              isActive 
                ? "bg-white border-l-primary shadow-lg" 
                : "bg-transparent border-l-transparent hover:bg-white/50 hover:border-l-muted-foreground/30"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300",
              isActive 
                ? "bg-foreground text-white" 
                : "bg-muted text-muted-foreground"
            )}>
              {idx + 1}
            </div>
            <div className="min-w-0">
              <p className={cn(
                "text-sm font-bold truncate transition-colors duration-300",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {tab.label}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {tab.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
});

// CSS animations extracted to separate component
function SimulationStyles() {
  return (
    <style jsx>{`
      @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes tabContent {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
      @keyframes stagger {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-tabContent {
        animation: tabContent 0.4s ease-out;
      }
      .animate-scaleIn {
        animation: scaleIn 0.3s ease-out;
      }
      .animate-stagger1 {
        animation: stagger 0.4s ease-out 0.1s both;
      }
      .animate-stagger2 {
        animation: stagger 0.4s ease-out 0.2s both;
      }
    `}</style>
  );
}

// Re-export for backwards compatibility
export { TransactionSimulation as default };
