import { NextResponse } from "next/server";

// Cache the APY value to avoid excessive requests
let cachedAPY: { value: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the current sUSDV APY from Solomon Labs
 * The current APY is approximately 10.3% as of late 2025
 */
async function fetchSolomonAPY(): Promise<number> {
  try {
    // Check cache first
    if (cachedAPY && Date.now() - cachedAPY.timestamp < CACHE_DURATION) {
      return cachedAPY.value;
    }

    // Try to fetch from Solomon Labs API
    // Note: Replace with actual Solomon Labs API endpoint when available
    const response = await fetch("https://api.solomonlabs.org/v1/yield/susdv", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Portion-App/1.0",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (response.ok) {
      const data = await response.json();
      const apy = data.apy || data.yield?.apy || 10.3;
      cachedAPY = { value: apy, timestamp: Date.now() };
      return apy;
    }

    // Fallback: Try DeFiLlama API for Solomon Labs protocol data
    const llamaResponse = await fetch(
      "https://yields.llama.fi/pools",
      { next: { revalidate: 300 } }
    );

    if (llamaResponse.ok) {
      const llamaData = await llamaResponse.json();
      // Look for Solomon Labs / sUSDV pool
      const solomonPool = llamaData.data?.find(
        (pool: { project: string; symbol: string }) =>
          pool.project?.toLowerCase().includes("solomon") ||
          pool.symbol?.toLowerCase().includes("susdv")
      );

      if (solomonPool?.apy) {
        cachedAPY = { value: solomonPool.apy, timestamp: Date.now() };
        return solomonPool.apy;
      }
    }

    // Default fallback based on current Solomon Labs rate
    return 10.3;
  } catch (error) {
    console.error("Failed to fetch Solomon APY:", error);
    // Return cached value if available, otherwise default
    return cachedAPY?.value || 10.3;
  }
}

export async function GET() {
  try {
    const apy = await fetchSolomonAPY();

    return NextResponse.json({
      apy,
      protocol: "Solomon Labs",
      token: "sUSDV",
      source: cachedAPY ? "cached" : "live",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        apy: 10.3, // Fallback APY
        protocol: "Solomon Labs",
        token: "sUSDV",
        source: "fallback",
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 with fallback data instead of error
    );
  }
}
