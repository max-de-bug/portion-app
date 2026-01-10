"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { NetworkProvider } from "./context/NetworkContext";
import { QueryProvider } from "./QueryProvider";
import { useState, useEffect } from "react";

// Create Solana wallet connectors for external wallets (Phantom, Solflare, Backpack, etc.)
const solanaConnectors = toSolanaWalletConnectors();

// Loading component while Privy initializes
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md mx-auto mb-4">
          <span className="font-serif text-2xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">
            P
          </span>
        </div>
        <p className="text-sm text-gray-500">Loading Portion...</p>
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid wallet extension conflicts
  useEffect(() => {
    setMounted(true);
  }, []);

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
              // Specify chain type for Solana-focused app
              walletChainType: "solana-only",
              walletList: [
                "phantom",
                "solflare",
                "backpack",
                "detected_solana_wallets",
              ],
            },
            // Login methods
            loginMethods: ["wallet", "email", "sms"],
            // Embedded wallets - creates Solana wallet for email/sms users
            embeddedWallets: {
              solana: {
                createOnLogin: "users-without-wallets",
              },
            },
            // External wallet connectors for Solana (required for Solflare, etc.)
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
