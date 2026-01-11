import { getTokenBalance, TOKEN_MINTS } from "./solana";

// Current Solomon Labs APY (fetched from API or config)
const CURRENT_APY = 10.3; // 10.3% as of late 2025

interface YieldInfo {
  walletAddress: string;
  usdvBalance: number;
  susdvBalance: number;
  stakedAmount: number;
  pendingYield: number;
  claimableYield: number;
  estimatedDailyYield: number;
  estimatedMonthlyYield: number;
  estimatedAnnualYield: number;
  apy: number;
  lastUpdated: Date;
}

interface YieldAllocation {
  id: string;
  walletAddress: string;
  amount: number;
  service: string;
  status: "pending" | "allocated" | "spent" | "returned";
  createdAt: Date;
  expiresAt: Date;
}

// In-memory store for yield allocations (use Redis/DB in production)
const allocations = new Map<string, YieldAllocation>();

// Genesis Date for Beta Simulation: Jan 1, 2025
const GENESIS_DATE = new Date("2025-01-01T00:00:00Z");

// In-memory cache for yield data to prevent RPC rate limits
interface CachedYield {
  data: YieldInfo;
  timestamp: number;
}
const yieldCache = new Map<string, CachedYield>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function calculateImpliedExchangeRate(apy: number): number {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceGenesis = (now.getTime() - GENESIS_DATE.getTime()) / msPerDay;
  
  // Compound interest formula: A = P(1 + r)^t
  // Rate = (1 + APY)^(years)
  const rate = Math.pow(1 + apy / 100, daysSinceGenesis / 365);
  return rate;
}

/**
 * Calculate yield metrics for a wallet
 */
export async function getYieldInfo(walletAddress: string): Promise<YieldInfo> {
  // Check cache first
  const cached = yieldCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Yield Service] Cache hit for ${walletAddress}`);
    return cached.data;
  }

  console.log(`[Yield Service] Cache miss for ${walletAddress}. Fetching from RPC...`);
  
  try {
    // Fetch token balances
    const [usdvData, susdvData] = await Promise.all([
      getTokenBalance(walletAddress, TOKEN_MINTS.USDV),
      getTokenBalance(walletAddress, TOKEN_MINTS.sUSDV),
    ]);

    let usdvBalance = parseFloat(usdvData.uiAmount);
    let susdvBalance = parseFloat(susdvData.uiAmount);

    // [BETA TESTING ONLY] Faucet Mode
    // If user has 0 balance, simulate 1000 sUSDV so they can test features
    if (susdvBalance === 0) {
      susdvBalance = 1000;
      console.log(`[BETA] Simulating 1000 sUSDV for empty wallet: ${walletAddress}`);
    }

    // Calculate yield estimates
    const apy = CURRENT_APY;
    const dailyRate = Math.pow(1 + apy / 100, 1 / 365) - 1;

    const estimatedDailyYield = susdvBalance * dailyRate;
    const estimatedMonthlyYield = susdvBalance * dailyRate * 30;
    const estimatedAnnualYield = susdvBalance * (apy / 100);

    // SIMULATION FOR BETA: Calculate yield based on time since genesis
    // In production, this would fetch from the staking contract
    const exchangeRate = calculateImpliedExchangeRate(apy);
    
    // Implied value of sUSDV in USDV terms
    const currentValueInUSDV = susdvBalance * exchangeRate;
    
    // Yield is the appreciation above the principal (assuming principal = raw token amount for simulation)
    // Note: In reality, principal would be tracked per deposit. For beta, we assume all sUSDV was deposited at parity.
    const totalYieldValue = Math.max(0, currentValueInUSDV - susdvBalance);
    
    // Split for realism (90% pending, 10% claimable - or just 100% claimable for beta UX)
    const pendingYield = 0; 
    const claimableYield = totalYieldValue; 

    const result: YieldInfo = {
      walletAddress,
      usdvBalance,
      susdvBalance,
      stakedAmount: susdvBalance,
      pendingYield,
      claimableYield,
      estimatedDailyYield,
      estimatedMonthlyYield,
      estimatedAnnualYield,
      apy,
      lastUpdated: new Date(),
    };

    // Update cache
    yieldCache.set(walletAddress, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("Failed to get yield info:", error);
    return {
      walletAddress,
      usdvBalance: 0,
      susdvBalance: 0,
      stakedAmount: 0,
      pendingYield: 0,
      claimableYield: 0,
      estimatedDailyYield: 0,
      estimatedMonthlyYield: 0,
      estimatedAnnualYield: 0,
      apy: CURRENT_APY,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Get total spendable yield (claimable + pending - already allocated)
 */
export async function getSpendableYield(
  walletAddress: string
): Promise<number> {
  const yieldInfo = await getYieldInfo(walletAddress);

  // Calculate already allocated amount
  let allocatedAmount = 0;
  for (const allocation of allocations.values()) {
    if (
      allocation.walletAddress === walletAddress &&
      (allocation.status === "pending" || allocation.status === "allocated")
    ) {
      allocatedAmount += allocation.amount;
    }
  }

  const totalYield = yieldInfo.claimableYield + yieldInfo.pendingYield;
  return Math.max(0, totalYield - allocatedAmount);
}

/**
 * Allocate yield for spending
 */
export async function allocateYield(
  walletAddress: string,
  amount: number,
  service: string,
  expiryMinutes: number = 5
): Promise<YieldAllocation | null> {
  const spendable = await getSpendableYield(walletAddress);

  if (spendable < amount) {
    return null;
  }

  const allocation: YieldAllocation = {
    id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    walletAddress,
    amount,
    service,
    status: "pending",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
  };

  allocations.set(allocation.id, allocation);
  return allocation;
}

/**
 * Mark allocation as spent
 */
export function markAllocationSpent(allocationId: string): boolean {
  const allocation = allocations.get(allocationId);
  if (!allocation || allocation.status !== "allocated") {
    return false;
  }

  allocation.status = "spent";
  return true;
}

/**
 * Return unused allocation
 */
export function returnAllocation(allocationId: string): boolean {
  const allocation = allocations.get(allocationId);
  if (!allocation || allocation.status === "spent") {
    return false;
  }

  allocation.status = "returned";
  return true;
}

/**
 * Clean up expired allocations
 */
export function cleanupExpiredAllocations(): number {
  let cleaned = 0;
  const now = new Date();

  for (const [, allocation] of allocations.entries()) {
    if (allocation.expiresAt < now && allocation.status === "pending") {
      allocation.status = "returned";
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get current APY from Solomon Labs
 */
export async function fetchCurrentAPY(): Promise<number> {
  try {
    // Try to fetch from Solomon Labs API
    const response = await fetch("https://api.solomonlabs.org/v1/yield/susdv", {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = (await response.json()) as { apy?: number };
      return data.apy || CURRENT_APY;
    }

    return CURRENT_APY;
  } catch {
    return CURRENT_APY;
  }
}
