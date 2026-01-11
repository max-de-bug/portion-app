"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Zap,
  TrendingUp,
  Shield,
  ChevronRight,
  Bot,
  Home,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgentChat } from "./AgentChat";
import { usePrivy } from "@privy-io/react-auth";
import { useSolomonYield } from "@/app/hooks/useSolomonYield";

interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: TrendingUp, label: "Yield", href: "/dashboard/yield" },
];

export const Sidebar = () => {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const pathname = usePathname();
  const { user } = usePrivy();

  // Get Solana wallet address
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === "wallet" && account.chainType === "solana"
  ) as { address: string } | undefined;
  const walletAddress = solanaWallet?.address || "";

  // Check if address is valid Solana address (not Ethereum 0x...)
  const isValidSolanaAddress = walletAddress && !walletAddress.startsWith("0x");

  // Fetch yield data for available yield
  const { data: yieldData } = useSolomonYield(
    isValidSolanaAddress ? walletAddress : undefined
  );
  const availableYield = yieldData?.spendableYield ?? 0;

  return (
    <aside className="w-[220px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md">
            <span className="font-serif text-xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">
              P
            </span>
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm tracking-tight">
              Portion
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Yield Spending
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Mode Toggle - DISABLED as requested */}
      <div className="p-4 opacity-50 cursor-not-allowed">
        <div className="w-full flex items-center justify-between p-3 rounded-xl bg-accent border border-primary/20">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div className="text-left">
              <p className="text-xs font-medium text-muted-foreground">
                Privacy Mode
              </p>
              <p className="text-[10px] text-muted-foreground">
                Locked for Beta
              </p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-zinc-600" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col">
        <p className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        <ul className="space-y-1 mb-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* x402 AI Agent Button */}
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          <button
            onClick={() => setIsAgentOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <span className="block">Spend with x402 AI</span>
              <span className="text-[10px] text-emerald-100 font-normal">
                Yield-powered payments
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-200 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Back to Landing */}
        <div className="mt-2">
          <Link href="/landing">
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer">
              <Home className="w-4 h-4" />
              <span>Back to main page</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Wallet Status Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                walletAddress && !walletAddress.startsWith("0x")
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                  : "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
              }`}
            >
              {walletAddress && !walletAddress.startsWith("0x") ? "◎" : "0x"}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                {walletAddress
                  ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                  : "No wallet"}
              </p>
              <p
                className={`text-[10px] ${
                  walletAddress && !walletAddress.startsWith("0x")
                    ? "text-primary"
                    : walletAddress
                    ? "text-orange-500"
                    : "text-muted-foreground"
                }`}
              >
                {walletAddress && !walletAddress.startsWith("0x")
                  ? "Solana Connected"
                  : walletAddress
                  ? "Ethereum (switch to Solana)"
                  : "Not connected"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* AI Agent Chat Modal */}
      <AgentChat
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        walletAddress={walletAddress}
        availableYield={availableYield}
      />
    </aside>
  );
};
