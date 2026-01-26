"use client";
import { Button } from "@/components/ui/button";
import { Search, Bell, Settings, Wallet } from "lucide-react";
import { WalletPopover } from "./WalletPopover";
import { usePrivy } from "@privy-io/react-auth";
import { useNetwork } from "@/app/context/NetworkContext";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const NetworkSwitcher = () => {
  const { network, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMainnet = network === "mainnet-beta";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
          isMainnet
            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
            : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${
            isMainnet ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <span className="text-xs font-bold w-24 text-left">
          {isMainnet ? "Solana Mainnet" : "Solana Devnet"}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1">
            <button
              onClick={() => {
                setNetwork("mainnet-beta");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isMainnet
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Mainnet Beta
              </div>
              {isMainnet && <Check className="w-3 h-3" />}
            </button>
            <button
              onClick={() => {
                setNetwork("devnet");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isMainnet
                  ? "bg-amber-50 text-amber-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Devnet
              </div>
              {!isMainnet && <Check className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Header = () => {
  const { login, authenticated, ready } = usePrivy();

  const handleLogin = async () => {
    if (!ready) {
      console.warn("[Header] Privy not ready, waiting...");
      return;
    }

    try {
      console.log("[Header] Initiating wallet login...");
      await login();
      console.log("[Header] Login successful");
    } catch (error: any) {
      console.error("[Header] Login error detected:", error);

      // Check for common errors and provide helpful messages (moved from PrivyErrorHandler)
      if (
        error?.message?.includes("403") ||
        error?.message?.includes("Forbidden")
      ) {
        console.error(
          "[Header] 403 Forbidden Error Detected!\n" +
            "This usually means your domain is not whitelisted in Privy dashboard.\n" +
            "Please see PRIVY_SETUP.md for instructions on how to fix this."
        );
      }

      if (error?.message?.includes("siws/init")) {
        console.error(
          "[Header] SIWS initialization error.\n" +
            "Check that:\n" +
            "1. Domain is whitelisted in Privy dashboard\n" +
            "2. App ID is correct\n" +
            "3. Solana is enabled for your app\n" +
            "See PRIVY_SETUP.md for detailed setup instructions."
        );
      }

      // Privy will show its own error UI, but log for debugging
      console.error("[Header] Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
    }
  };

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
        <NetworkSwitcher />

        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-border mx-2" />

        {/* Authentication State */}
        {authenticated ? (
          <WalletPopover />
        ) : (
          <Button
            onClick={handleLogin}
            disabled={!ready}
            className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Connect wallet"
          >
            <Wallet className="w-4 h-4" />
            {ready ? "Connect Wallet" : "Loading..."}
          </Button>
        )}
      </div>
    </header>
  );
};
