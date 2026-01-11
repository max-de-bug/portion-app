"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Component to handle and log Privy errors for debugging
 * This helps identify connection issues like 403 errors
 */
export function PrivyErrorHandler() {
  const { error } = usePrivy();

  useEffect(() => {
    if (error) {
      console.error("[PrivyErrorHandler] Privy error detected:", error);
      
      // Check for common errors and provide helpful messages
      if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
        console.error(
          "[PrivyErrorHandler] 403 Forbidden Error Detected!\n" +
          "This usually means your domain is not whitelisted in Privy dashboard.\n" +
          "Please see PRIVY_SETUP.md for instructions on how to fix this."
        );
      }
      
      if (error.message?.includes("siws/init")) {
        console.error(
          "[PrivyErrorHandler] SIWS initialization error.\n" +
          "Check that:\n" +
          "1. Domain is whitelisted in Privy dashboard\n" +
          "2. App ID is correct\n" +
          "3. Solana is enabled for your app\n" +
          "See PRIVY_SETUP.md for detailed setup instructions."
        );
      }
    }
  }, [error]);

  // This component doesn't render anything, it just logs errors
  return null;
}
