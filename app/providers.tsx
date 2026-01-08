"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { NetworkProvider } from "./context/NetworkContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <PrivyProvider
        appId="cmk48opg601hkjr0cuyqwv983"
        config={{
          appearance: {
            theme: "light",
            accentColor: "#10b981", // Emerald-500
            logo: "https://your-logo-url.com/logo.png", // Placeholder or local asset if available
          },
          loginMethods: ["wallet", "email", "sms"],
          solana: {
            rpcs: {
              "solana:mainnet": {
                rpc: createSolanaRpc("https://api.mainnet-beta.solana.com"),
                rpcSubscriptions: createSolanaRpcSubscriptions("wss://api.mainnet-beta.solana.com"),
              },
            },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </NetworkProvider>
  );
}
