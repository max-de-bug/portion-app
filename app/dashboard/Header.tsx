"use client";
import { Button } from "@/components/ui/button";
import { Search, Bell, Settings, Wallet } from "lucide-react";
import { WalletPopover } from "./WalletPopover";
import { usePrivy } from "@privy-io/react-auth";

export const Header = () => {
  const { login, authenticated, user, logout } = usePrivy();

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search yields, wallets..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Network Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold">Solana Mainnet</span>
        </div>

        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-border mx-2" />

        {/* Authentication State */}
        {authenticated ? (
          <WalletPopover 
            onDisconnect={logout} 
          />
        ) : (
          <Button onClick={login} className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
};
