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
  KeyRound,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useSolomonYield } from "@/app/hooks/useSolomonYield";
import { useX402Session } from "@/app/hooks/useX402Session";
import { PrepaidBalance } from "@/components/PrepaidBalance";

interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: TrendingUp, label: "Yield", href: "/dashboard/yield" },
  { icon: Bot, label: "Portion AI", href: "/dashboard/ai" },
  { icon: Sparkles, label: "DLMM", href: "/dashboard/dlmm", badge: "New" },
];

export const Sidebar = () => {
  const [privacyMode, setPrivacyMode] = useState(true);
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

  // X402 Session - click "Start Session" to authenticate
  const { isAuthenticated, isLoading: sessionLoading, authenticate } = useX402Session(walletAddress);

  return (
    <aside className="w-full h-full flex flex-col bg-sidebar overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border shrink-0">
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

      {/* Privacy Mode Toggle */}
      <div className="p-4 shrink-0">
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-accent border border-primary/20 hover:bg-accent/80 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">
                Privacy Mode
              </p>
              <p className="text-[10px] text-muted-foreground">
                {privacyMode ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              privacyMode ? "bg-primary animate-pulse" : "bg-muted-foreground"
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col pb-6">
        <p className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            // Simple pathname-based active check
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            const isDLMM = item.label === "DLMM";
            const activeStyles = isDLMM
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
              : "bg-primary text-white shadow-sm";

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? activeStyles
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : isDLMM ? "text-indigo-500" : ""}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider and Home */}
        <div className="mt-auto pt-4 border-t border-sidebar-border">
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
    </aside>
  );
};
