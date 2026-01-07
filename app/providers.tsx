"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="INSERT_PRIVY_APP_ID"
      config={{
        appearance: {
          theme: "light",
          accentColor: "#10b981", // Emerald-500
          logo: "https://your-logo-url.com/logo.png", // Placeholder or local asset if available
        },
        loginMethods: ["wallet", "email", "sms"],
        solanaClusters: [{ name: "mainnet-beta", rpcUrl: "https://api.mainnet-beta.solana.com" }],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
