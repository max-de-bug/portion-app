"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Shield, CheckCircle, Zap, Activity, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  service: string;
  status: "Processing" | "Validated" | "Settled";
  time: string;
  amount: string;
  type: "API" | "SaaS" | "Cloud" | "Content";
  source: string;
}

const SERVICES = [
  { name: "OpenAI Payments", type: "API", source: "sUSDv Staking" },
  { name: "Portion Analytics", type: "SaaS", source: "YaaS (Liquid)" },
  { name: "Anthropic API", type: "API", source: "sUSDv Staking" },
  { name: "AWS Cloudfront", type: "Cloud", source: "SOLO Rewards" },
  { name: "Supabase DB", type: "Cloud", source: "YaaS (Liquid)" },
  { name: "Midjourney Sub", type: "Content", source: "SOLO Rewards" },
];

type TabId = "yield" | "policies" | "transactions" | "audit";

interface Tab {
  id: TabId;
  icon: any;
  label: string;
  description: string;
}

const TABS: Tab[] = [
  { id: "yield", icon: Zap, label: "YaaS Yield Capacity", description: "Monitor yield allocation and efficiency" },
  { id: "policies", icon: Shield, label: "Configure Policies", description: "Set up spending limits and rules" },
  { id: "transactions", icon: Activity, label: "Process Transactions", description: "Automated x402 payments" },
  { id: "audit", icon: FileText, label: "Review Audit Trail", description: "Track all activity and compliance" },
];

export function TransactionSimulation() {
  const [activeTab, setActiveTab] = useState<TabId>("yield");
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", service: "OpenAI Payments", status: "Settled", time: "2m ago", amount: "$15.00", type: "API", source: "sUSDv Staking" },
    { id: "2", service: "Portion Analytics", status: "Settled", time: "5m ago", amount: "$12.00", type: "SaaS", source: "YaaS Yield" },
  ]);
  const [pulse, setPulse] = useState(false);
  const [limitUsage, setLimitUsage] = useState(42);
  const [isSimulating, setIsSimulating] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  
  // Audit trail state for real-time simulation
  const [auditLogs, setAuditLogs] = useState<{id: string; action: string; detail: string; time: string; status: "success" | "error"}[]>([]);
  const [isAuditSimulating, setIsAuditSimulating] = useState(false);

  const AUDIT_EVENTS = [
    { action: "Policy Updated", detail: "Daily limit increased to $500", status: "success" as const },
    { action: "Transaction Approved", detail: "OpenAI Payments - $15.00", status: "success" as const },
    { action: "Policy Check", detail: "Merchant whitelist validated", status: "success" as const },
    { action: "Transaction Denied", detail: "Exceeded daily limit", status: "error" as const },
    { action: "Wallet Connected", detail: "0x7a...f3c2", status: "success" as const },
    { action: "New Merchant Added", detail: "Anthropic API", status: "success" as const },
  ];

  const addAuditLog = useCallback(() => {
    const event = AUDIT_EVENTS[Math.floor(Math.random() * AUDIT_EVENTS.length)];
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: event.action,
      detail: event.detail,
      time: "Just now",
      status: event.status,
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 6));
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setContentKey(prev => prev + 1);
    
    // Auto-start simulation for transactions tab
    if (tabId === "transactions" && !isSimulating) {
      setIsSimulating(true);
      addTransaction();
    }
    
    // Auto-start audit trail simulation
    if (tabId === "audit" && !isAuditSimulating) {
      setIsAuditSimulating(true);
      addAuditLog();
    }
    
    // Stop simulations when leaving tabs
    if (tabId !== "transactions") {
      setIsSimulating(false);
    }
    if (tabId !== "audit") {
      setIsAuditSimulating(false);
    }
  };

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
      type: service.type as any,
      source: service.source,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 5));
    setPulse(true);
    setTimeout(() => setPulse(false), 1000);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        addTransaction();
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, addTransaction]);

  const handleSimulate = () => {
    setIsSimulating(true);
    addTransaction();
  };

  const handleReset = () => {
    setIsSimulating(false);
    setTransactions([]);
    setLimitUsage(0);
  };

  const handleAuditReset = () => {
    setIsAuditSimulating(false);
    setAuditLogs([]);
  };

  // Audit trail interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuditSimulating) {
      interval = setInterval(() => {
        addAuditLog();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAuditSimulating, addAuditLog]);

  // Content Components
  const YieldCapacityContent = () => (
    <div className="space-y-6 animate-tabContent">
      <div className="flex items-center justify-between mb-4 animate-stagger1">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">YaaS Yield Capacity</h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-success/20 text-success text-[10px] font-black tracking-tighter animate-pulse">100% UTILIZED</span>
      </div>
      
      <div className="space-y-6">
        <div className="animate-stagger2">
          <div className="flex justify-between text-xs mb-3 font-bold">
            <span className="text-muted-foreground">Allocated for Payments</span>
            <span className="text-primary animate-countUp">{limitUsage}%</span>
          </div>
          <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden border border-border/20">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full animate-progressFill shadow-[0_0_10px_rgba(0,163,255,0.4)]" 
              style={{ width: `${limitUsage}%`, animationDelay: '0.3s' }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-background/40 border border-border/20 animate-stagger3 hover:scale-105 transition-transform">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">Yield Source</span>
            <span className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Solomon YaaS
            </span>
          </div>
          <div className="p-5 rounded-xl bg-background/40 border border-border/20 animate-stagger4 hover:scale-105 transition-transform">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-2">Efficiency</span>
            <span className="text-base font-mono font-bold text-primary">99.9%</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-dashed border-border/60 bg-primary/5 flex items-center justify-center animate-stagger5">
          <div className="text-center">
            <Shield className={cn("w-10 h-10 text-primary mx-auto mb-3 transition-all duration-500 animate-float", pulse && "scale-125 shadow-primary/50")} />
            <p className="text-sm font-bold text-foreground">Autonomous Authorization</p>
            <p className="text-xs text-muted-foreground">Signed via Portion Vault</p>
          </div>
        </div>
      </div>
    </div>
  );

  const ConfigurePoliciesContent = () => (
    <div className="space-y-6 animate-tabContent">
      <div className="flex items-center gap-2 mb-4 animate-stagger1">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Configure Policies</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6 animate-stagger1">Set up spending limits and rules</p>

      <div className="space-y-4">
        {/* Daily Spending Limit Policy */}
        <div className="p-5 rounded-xl bg-background/60 border border-border/30 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 animate-stagger2 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-bold text-foreground">Daily Spending Limit</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-success/20 text-success uppercase">Active</span>
          </div>
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="text-muted-foreground">$0</span>
            <span className="text-primary font-bold">${Math.floor(limitUsage * 5)} / $500</span>
          </div>
          <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary rounded-full animate-progressFill animate-shimmer bg-[length:200%_100%]" 
              style={{ width: `${limitUsage}%`, animationDelay: '0.4s' }} 
            />
          </div>
        </div>

        {/* Merchant Whitelist Policy */}
        <div className="p-5 rounded-xl bg-background/60 border border-border/30 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 animate-stagger3 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-bold text-foreground">Merchant Whitelist</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-success/20 text-success uppercase">Active</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["OpenAI", "Portion", "AWS", "Anthropic"].map((merchant, idx) => (
              <span 
                key={merchant}
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 transition-all duration-300 hover:bg-primary/20 hover:scale-110 animate-tagPop"
                style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
              >
                {merchant}
              </span>
            ))}
            <span className="text-xs font-medium px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground border border-border/20 animate-tagPop" style={{ animationDelay: '0.9s' }}>
              +2 more
            </span>
          </div>
        </div>

        {/* Transaction Size Limit */}
        <div className="p-5 rounded-xl bg-background/60 border border-border/30 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 animate-stagger4 hover:scale-[1.02]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-bold text-foreground">Max Transaction Size</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 uppercase animate-pulse">Pending</span>
          </div>
          <p className="text-xs text-muted-foreground">Limit: <span className="text-primary font-mono font-bold">$100.00</span> per transaction</p>
        </div>
      </div>
    </div>
  );

  const ProcessTransactionsContent = () => (
    <div className="space-y-6 animate-tabContent">
      <div className="flex items-center justify-between mb-4 animate-stagger1">
        <div className="flex items-center gap-2">
          <Activity className={cn("w-5 h-5 text-primary", isSimulating && "animate-spin")} />
          <h3 className="text-lg font-bold text-foreground">Process Transactions</h3>
          {isSimulating && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 uppercase animate-pulse">Live</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="font-bold hover:scale-105 transition-transform">Reset</Button>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 && (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl opacity-50 animate-stagger2">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Transactions will appear automatically...</p>
          </div>
        )}
        {transactions.map((tx, idx) => (
          <div 
             key={tx.id} 
             className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-all duration-500 border",
                idx === 0 ? "bg-emerald-50 border-emerald-200 scale-[1.02] shadow-xl shadow-emerald-500/5" : "bg-white border-border opacity-80"
             )}
             style={{ animation: idx === 0 ? 'slideDown 0.5s ease-out' : 'none' }}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                tx.status === "Processing" ? "bg-amber-500/20 text-amber-500" : 
                tx.status === "Validated" ? "bg-blue-500/20 text-blue-500" : "bg-success/20 text-success"
              )}>
                {tx.status === "Processing" ? <Clock className="w-5 h-5 animate-spin" /> : 
                 tx.status === "Validated" ? <Shield className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 animate-scaleIn" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-foreground">{tx.service}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase">{tx.type}</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    tx.status === "Processing" ? "bg-amber-500 animate-pulse" : 
                    tx.status === "Validated" ? "bg-blue-500 animate-pulse" : "bg-success shadow-[0_0_5px_rgba(34,197,94,0.8)]"
                  )} />
                  {tx.status} • {tx.time}
                </p>
              </div>
            </div>
            <span className="text-base font-mono font-black text-primary">{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const AuditTrailContent = () => (
    <div className="space-y-6 animate-tabContent">
      <div className="flex items-center justify-between mb-4 animate-stagger1">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Review Audit Trail</h3>
          {isAuditSimulating && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 uppercase animate-pulse">Live</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleAuditReset} className="font-bold hover:scale-105 transition-transform">Clear</Button>
      </div>

      <div className="space-y-3">
        {auditLogs.length === 0 && (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl opacity-50 animate-stagger2">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Audit events will appear automatically...</p>
          </div>
        )}
        {auditLogs.map((log, idx) => (
          <div 
            key={log.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl transition-all duration-500 border",
              idx === 0 ? "bg-emerald-50 border-emerald-200 scale-[1.02] shadow-xl shadow-emerald-500/5" : "bg-white border-border opacity-80"
            )}
            style={{ animation: idx === 0 ? 'slideDown 0.5s ease-out' : 'none' }}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                log.status === "success" ? "bg-success/20 text-success" : "bg-red-500/20 text-red-500"
              )}>
                {log.status === "success" ? <CheckCircle className="w-5 h-5 animate-scaleIn" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-black text-foreground">{log.action}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    log.status === "success" ? "bg-success shadow-[0_0_5px_rgba(34,197,94,0.8)]" : "bg-red-500 animate-pulse"
                  )} />
                  {log.detail} • {log.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderContent = () => {
    switch (activeTab) {
      case "yield": return <YieldCapacityContent />;
      case "policies": return <ConfigurePoliciesContent />;
      case "transactions": return <ProcessTransactionsContent />;
      case "audit": return <AuditTrailContent />;
      default: return null;
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
        {/* Tab Navigation - Left Side */}
        <div className="space-y-2">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
        
        {/* Content Area - Right Side */}
        <div className="p-6 rounded-2xl bg-muted/40 border border-border/50 backdrop-blur-sm min-h-[400px]" key={contentKey}>
          {renderContent()}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes tabContent {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
        }
        @keyframes tagPop {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes stagger {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-tabContent {
          animation: tabContent 0.4s ease-out;
        }
        .animate-progressFill {
          animation: progressFill 1s ease-out forwards;
        }
        .animate-tagPop {
          animation: tagPop 0.4s ease-out forwards;
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
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
        .animate-stagger3 {
          animation: stagger 0.4s ease-out 0.3s both;
        }
        .animate-stagger4 {
          animation: stagger 0.4s ease-out 0.4s both;
        }
        .animate-stagger5 {
          animation: stagger 0.4s ease-out 0.5s both;
        }
      `}</style>
    </div>
  );
}

