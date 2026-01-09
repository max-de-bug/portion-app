import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Solomon Labs Yield API
 *
 * How yield works with YASS (Yield as a Stablecoin Strategy):
 * 1. User deposits USDV (stablecoin)
 * 2. User stakes USDV → receives sUSDV (staked USDV)
 * 3. sUSDV appreciates over time via exchange rate increase
 * 4. Exchange rate grows at ~10.3% APY
 * 5. Yield = (sUSDV * exchangeRate) - originalDeposit
 *
 * The yield (appreciation) can be spent via x402 while principal stays protected.
 */

// Solomon Labs token mints on Solana
// Set these in environment variables when you have real addresses
const SUSDV_MINT = process.env.SUSDV_MINT || null;
const USDV_MINT = process.env.USDV_MINT || null;

// Current APY from Solomon Labs (fetch dynamically in production)
const CURRENT_APY = 10.3;

// Demo mode: simulate yield for testing when tokens aren't configured
const DEMO_MODE = !SUSDV_MINT && !USDV_MINT;

// RPC endpoints
const RPC_ENDPOINTS = [
  "https://solana-mainnet.rpc.extrnode.com",
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
];

interface YieldResponse {
  wallet: string;
  network: string;

  // Balances
  usdvBalance: number;
  susdvBalance: number;

  // Yield data
  exchangeRate: number; // sUSDV → USDV exchange rate
  principalValue: number; // Original deposit value in USDV
  currentValue: number; // Current value if converted to USDV
  spendableYield: number; // Yield available to spend via x402

  // Projections
  apy: number;
  dailyYield: number;
  monthlyYield: number;
  yearlyYield: number;

  // Status
  isDemo: boolean;
  timestamp: string;
}

async function getConnection(): Promise<Connection> {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 15000,
      });
      await connection.getLatestBlockhash();
      return connection;
    } catch {
      continue;
    }
  }
  throw new Error("Unable to connect to Solana network");
}

async function fetchTokenBalance(
  connection: Connection,
  walletAddress: string,
  mintAddress: string | null
): Promise<number> {
  if (!mintAddress) return 0;

  try {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);

    const accounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      mint,
    });

    if (accounts.value.length === 0) return 0;

    const balance = accounts.value[0].account.data.parsed?.info?.tokenAmount;
    return parseFloat(balance?.uiAmountString || "0");
  } catch {
    return 0;
  }
}

/**
 * Get sUSDV to USDV exchange rate
 * In production, this would query the Solomon Labs staking contract
 */
async function getExchangeRate(): Promise<number> {
  // TODO: Query Solomon Labs contract for actual exchange rate
  // For now, simulate based on time since a reference date

  // Assume launch date was 6 months ago
  // APY of 10.3% means daily rate = (1.103)^(1/365) - 1 ≈ 0.000269
  const launchDate = new Date("2025-07-01");
  const now = new Date();
  const daysSinceLaunch = Math.floor(
    (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate compound growth
  const dailyRate = Math.pow(1 + CURRENT_APY / 100, 1 / 365) - 1;
  const exchangeRate = Math.pow(1 + dailyRate, Math.max(0, daysSinceLaunch));

  return Math.round(exchangeRate * 10000) / 10000; // 4 decimal precision
}

/**
 * Calculate yield projections
 */
function calculateProjections(susdvBalance: number, exchangeRate: number) {
  const currentValue = susdvBalance * exchangeRate;
  const dailyRate = Math.pow(1 + CURRENT_APY / 100, 1 / 365) - 1;

  return {
    dailyYield: currentValue * dailyRate,
    monthlyYield: currentValue * dailyRate * 30,
    yearlyYield: currentValue * (CURRENT_APY / 100),
  };
}

/**
 * Generate demo data for testing
 */
function generateDemoData(wallet: string): YieldResponse {
  // Use wallet hash to generate consistent demo values
  const hash = wallet.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const demoBalance = (hash % 1000) + 100; // 100-1100 sUSDV
  const exchangeRate = 1.052; // 5.2% growth so far
  const principalValue = demoBalance / exchangeRate;
  const currentValue = demoBalance;
  const spendableYield = currentValue - principalValue;

  const projections = calculateProjections(demoBalance, exchangeRate);

  return {
    wallet,
    network: "demo",
    usdvBalance: Math.round(principalValue * 0.1 * 100) / 100, // Some unstaked USDV
    susdvBalance: demoBalance,
    exchangeRate,
    principalValue: Math.round(principalValue * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
    spendableYield: Math.round(spendableYield * 100) / 100,
    apy: CURRENT_APY,
    dailyYield: Math.round(projections.dailyYield * 100) / 100,
    monthlyYield: Math.round(projections.monthlyYield * 100) / 100,
    yearlyYield: Math.round(projections.yearlyYield * 100) / 100,
    isDemo: true,
    timestamp: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const demo = searchParams.get("demo") === "true";

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  // Validate address
  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  // Demo mode - return simulated data
  if (DEMO_MODE || demo) {
    return NextResponse.json(generateDemoData(wallet));
  }

  try {
    const connection = await getConnection();
    const exchangeRate = await getExchangeRate();

    // Fetch token balances
    const [usdvBalance, susdvBalance] = await Promise.all([
      fetchTokenBalance(connection, wallet, USDV_MINT),
      fetchTokenBalance(connection, wallet, SUSDV_MINT),
    ]);

    // Calculate yield
    // Principal = what user originally deposited (before appreciation)
    // Current value = sUSDV * exchange rate
    // Spendable yield = current value - principal
    const principalValue = susdvBalance / exchangeRate; // Reverse calculate original deposit
    const currentValue = susdvBalance; // sUSDV is 1:1 with its value
    const spendableYield = susdvBalance * exchangeRate - susdvBalance;

    const projections = calculateProjections(susdvBalance, exchangeRate);

    const response: YieldResponse = {
      wallet,
      network: "mainnet-beta",
      usdvBalance,
      susdvBalance,
      exchangeRate,
      principalValue: Math.round(principalValue * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      spendableYield: Math.max(0, Math.round(spendableYield * 100) / 100),
      apy: CURRENT_APY,
      dailyYield: Math.round(projections.dailyYield * 100) / 100,
      monthlyYield: Math.round(projections.monthlyYield * 100) / 100,
      yearlyYield: Math.round(projections.yearlyYield * 100) / 100,
      isDemo: false,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Yield fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch yield data",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
