"use client";

/**
 * X402 V2 Session Hook
 * 
 * Manages session-based authentication for X402 V2 protocol:
 * - Wallet signature authentication
 * - Session token management
 * - Session persistence via localStorage
 * - Auto-refresh on expiry
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";
const SESSION_STORAGE_KEY = "x402_v2_session";

interface X402Session {
  sessionToken: string;
  walletAddress: string;
  expiresAt: Date;
}

interface SessionState {
  session: X402Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface PrepaidBalance {
  balance: string;
  lastTopup?: Date;
  updatedAt?: string;
}

/**
 * Hook for managing X402 V2 sessions with React Query for data fetching
 */
export function useX402Session(walletAddress: string) {
  const { wallets } = useWallets();
  const queryClient = useQueryClient();
  
  // Local session state (persisted in localStorage)
  const [state, setState] = useState<SessionState>({
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Load session from localStorage on mount
   */
  useEffect(() => {
    if (!walletAddress) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const stored = localStorage.getItem(`${SESSION_STORAGE_KEY}_${walletAddress}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const expiresAt = new Date(parsed.expiresAt);
        
        // Check if session is still valid
        if (expiresAt > new Date()) {
          setState({
            session: { ...parsed, expiresAt },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        }
      }
    } catch (e) {
      console.error("[useX402Session] Failed to load stored session:", e);
    }

    setState(prev => ({ ...prev, isLoading: false }));
  }, [walletAddress]);

  /**
   * React Query for Prepaid Balance
   */
  const { 
    data: prepaidBalance, 
    isLoading: isBalanceLoading,
    refetch: refreshPrepaidBalance 
  } = useQuery<PrepaidBalance | null>({
    queryKey: ["x402-prepaid-balance", walletAddress, state.session?.sessionToken],
    queryFn: async () => {
      if (!state.isAuthenticated || !state.session) return null;
      
      const res = await fetch(`${BACKEND_URL}/x402/prepaid/balance`, {
        headers: { "X-Session-Token": state.session.sessionToken },
      });
      
      if (!res.ok) throw new Error("Failed to fetch balance");
      const data = await res.json();
      
      return {
        balance: data.balance,
        lastTopup: data.lastTopup ? new Date(data.lastTopup) : undefined,
        updatedAt: data.updatedAt,
      };
    },
    enabled: state.isAuthenticated && !!state.session,
    staleTime: 60 * 1000, // 1 minute stale time
  });

  /**
   * Get nonce for signing
   */
  const getNonce = useCallback(async (): Promise<{ nonce: string; message: string } | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/x402/nonce?walletAddress=${walletAddress}`);
      if (!res.ok) throw new Error("Failed to get nonce");
      return await res.json();
    } catch (e) {
      console.error("[useX402Session] Failed to get nonce:", e);
      return null;
    }
  }, [walletAddress]);

  /**
   * Authenticate with wallet signature
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!walletAddress) {
      setState(prev => ({ ...prev, error: "No wallet connected" }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get nonce
      const nonceData = await getNonce();
      if (!nonceData) throw new Error("Failed to get nonce");

      // Step 2: Find wallet to sign with
      const wallet = wallets.find(w => 
        w.address.toLowerCase() === walletAddress.toLowerCase()
      ) || wallets[0];
      
      if (!wallet) {
        throw new Error("No wallet available for signing. Please connect a Solana wallet.");
      }

      // Step 3: Sign message
      const message = nonceData.message;
      const messageBytes = new TextEncoder().encode(message);
      
      const signedResult = await (wallet as any).signMessage({
        message: messageBytes
      });
      
      let signature: string;
      if (signedResult instanceof Uint8Array || Array.isArray(signedResult)) {
        signature = btoa(String.fromCharCode(...new Uint8Array(signedResult)));
      } else if (signedResult && typeof signedResult === 'object') {
        const sig = signedResult.signature || signedResult.sig;
        if (sig instanceof Uint8Array || Array.isArray(sig)) {
          signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
        } else if (typeof sig === 'string') {
          signature = sig;
        } else if (typeof signedResult === 'string') {
          signature = signedResult;
        } else {
          throw new Error("Unexpected signature format from wallet");
        }
      } else if (typeof signedResult === 'string') {
        signature = signedResult;
      } else {
        throw new Error("Could not parse signature from wallet response");
      }

      // Step 4: Authenticate with backend
      const authRes = await fetch(`${BACKEND_URL}/x402/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature, message }),
      });

      if (!authRes.ok) {
        const errorData = await authRes.json();
        throw new Error(errorData.error || "Authentication failed");
      }

      const authData = await authRes.json();
      const session: X402Session = {
        sessionToken: authData.sessionToken,
        walletAddress: authData.walletAddress,
        expiresAt: new Date(authData.expiresAt),
      };

      // Store in localStorage
      localStorage.setItem(`${SESSION_STORAGE_KEY}_${walletAddress}`, JSON.stringify(session));

      setState({
        session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Invalidating balance tag ensures fresh data on login
      queryClient.invalidateQueries({ queryKey: ["x402-prepaid-balance", walletAddress] });

      return true;
    } catch (e) {
      const error = e instanceof Error ? e.message : "Authentication failed";
      setState(prev => ({ ...prev, isLoading: false, error }));
      return false;
    }
  }, [walletAddress, wallets, getNonce, queryClient]);

  /**
   * Mutation for Top up
   */
  const topupMutation = useMutation({
    mutationFn: async ({ amount, paymentTx }: { amount: number, paymentTx: string }) => {
      if (!state.session) throw new Error("No active session");

      const res = await fetch(`${BACKEND_URL}/x402/prepaid/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Token": state.session.sessionToken,
        },
        body: JSON.stringify({ amount, paymentTx }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Topup failed");
      }

      return await res.json();
    },
    onSuccess: () => {
      // Refresh balance immediately
      queryClient.invalidateQueries({ queryKey: ["x402-prepaid-balance", walletAddress] });
    },
  });

  /**
   * Revoke current session
   */
  const logout = useCallback(async () => {
    if (state.session) {
      try {
        await fetch(`${BACKEND_URL}/x402/auth/revoke`, {
          method: "POST",
          headers: { "X-Session-Token": state.session.sessionToken },
        });
      } catch (e) {
        console.error("[useX402Session] Failed to revoke session:", e);
      }
    }

    localStorage.removeItem(`${SESSION_STORAGE_KEY}_${walletAddress}`);
    
    setState({
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    queryClient.removeQueries({ queryKey: ["x402-prepaid-balance", walletAddress] });
  }, [state.session, walletAddress, queryClient]);

  /**
   * Get session token for API calls
   */
  const getSessionToken = useCallback((): string | null => {
    if (!state.session || state.session.expiresAt < new Date()) {
      return null;
    }
    return state.session.sessionToken;
  }, [state.session]);

  /**
   * Check if session will expire soon (within 30 minutes)
   */
  const isExpiringSoon = useCallback((): boolean => {
    if (!state.session) return false;
    const thirtyMinutes = 30 * 60 * 1000;
    return state.session.expiresAt.getTime() - Date.now() < thirtyMinutes;
  }, [state.session]);

  /**
   * Memoized top up action
   */
  const topupPrepaid = useCallback(async (amount: number, paymentTx: string) => {
    return topupMutation.mutateAsync({ amount, paymentTx });
  }, [topupMutation]);

  /**
   * Memoized return object for stable references
   */
  return useMemo(() => ({
    // State
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading || isBalanceLoading,
    isTopupLoading: topupMutation.isPending,
    error: state.error,
    session: state.session,
    prepaidBalance: prepaidBalance || null,
    
    // Actions
    authenticate,
    logout,
    getSessionToken,
    isExpiringSoon,
    refreshPrepaidBalance,
    topupPrepaid,
  }), [
    state.isAuthenticated, 
    state.isLoading, 
    isBalanceLoading, 
    topupMutation.isPending, 
    state.error, 
    state.session, 
    prepaidBalance, 
    authenticate, 
    logout, 
    getSessionToken, 
    isExpiringSoon, 
    refreshPrepaidBalance,
    topupPrepaid
  ]);
}
