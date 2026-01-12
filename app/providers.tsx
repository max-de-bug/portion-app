"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { NetworkProvider } from "./context/NetworkContext";
import { QueryProvider } from "./QueryProvider";
import { useState, useEffect, useMemo } from "react";
import LoadingScreen from "./components/LoadingScreen";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid wallet extension conflicts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create Solana wallet connectors for external wallets (Phantom, Solflare, Backpack, etc.)
  // Initialize connectors only on client-side after mount to avoid SSR issues
  const solanaConnectors = useMemo(() => {
    if (typeof window === "undefined" || !mounted) {
      return undefined; // Return undefined instead of empty array when not ready
    }
    try {
      // Create connectors with proper configuration for Solflare compatibility
      // Create connectors with proper configuration
      return toSolanaWalletConnectors({
        shouldAutoConnect: true, // Enable auto-connect to ensure wallets are available for signing
      });
    } catch (error) {
      console.error("[Providers] Error creating Solana connectors:", error);
      return undefined;
    }
  }, [mounted]);

  // Show loading on server and during initial client mount
  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <QueryProvider>
      <NetworkProvider>
        <PrivyProvider
          appId="cmk48opg601hkjr0cuyqwv983"
          config={{
            appearance: {
              theme: "light",
              accentColor: "#10b981", // Emerald-500
              logo: "/portion-privy-logo.svg",
              walletChainType: "solana-only",
              // Order matters - list Solflare first for better visibility and compatibility
              walletList: [
                "solflare", // List Solflare first for better visibility
                "phantom",
                "backpack",
                "detected_solana_wallets", // This should come last
              ],
            },
            // Login methods - wallet should be first for better UX
            loginMethods: ["wallet", "email", "sms"],
            // Embedded wallets - creates Solana wallet for email/sms users
            embeddedWallets: {
              solana: {
                createOnLogin: "users-without-wallets",
              },
            },
            // External wallet connectors for Solana (required for Solflare, Phantom, etc.)
            externalWallets: {
              solana: {
                connectors: solanaConnectors,
              },
            },
          }}
        >
          {children}
        </PrivyProvider>
      </NetworkProvider>
    </QueryProvider>
  );
}
