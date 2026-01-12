"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Network = "mainnet-beta" | "devnet";

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<Network>("devnet");

  // Optional: Persist network selection
  useEffect(() => {
    const saved = localStorage.getItem("portion-network");
    if (saved === "mainnet-beta" || saved === "devnet") {
      setNetwork(saved);
    }
  }, []);

  const handleSetNetwork = (newNetwork: Network) => {
    setNetwork(newNetwork);
    localStorage.setItem("portion-network", newNetwork);
  };

  return (
    <NetworkContext.Provider value={{ network, setNetwork: handleSetNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
