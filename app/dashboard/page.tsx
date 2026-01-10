"use client";

import { StatCard } from "./StatCard";
import { StreamingValue } from "./StreamingValue";
import { ActiveStreams } from "./ActiveStreams";
import { SpendingPolicies } from "./_features/spending-policies";
import { TransactionActivity } from "./TransactionActivity";
import { YieldCapacity } from "./YieldCapacity";
import { AuditTrail } from "./AuditTrail";
import { Zap, DollarSign, Activity } from "lucide-react";
import { useSolomonAPY } from "@/app/hooks/useSolomonYield";
import { usePrivy } from "@privy-io/react-auth";

export default function Dashboard() {
  const { user } = usePrivy();
  const { data: apyData, isLoading: apyLoading } = useSolomonAPY();
  const apy = apyData?.apy ?? 0;

  // Find specifically the Solana wallet address from linked accounts
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === "wallet" && account.chainType === "solana"
  ) as { address: string } | undefined;

  const walletAddress = solanaWallet?.address || user?.wallet?.address || "";

  return (
    <main className="p-6 space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Zap}
          value={apyLoading ? "..." : `${apy.toFixed(1)}%`}
          label="Spendable APY"
          trend={`${apy > 0 ? "+" : ""}${apy.toFixed(1)}%`}
          trendUp={apy > 0}
        />
        <StatCard
          icon={DollarSign}
          value="$0.00"
          label="Total Yield"
          trend="0.0%"
          trendUp={true}
        />
        <StatCard
          icon={Activity}
          value="0"
          label="Yield Detected"
          badge="+0"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Spendable Value - Takes 2 columns */}
        <div className="col-span-2">
          <StreamingValue walletAddress={walletAddress} />
        </div>

        {/* Yield Capacity */}
        <div className="col-span-1">
          <YieldCapacity walletAddress={walletAddress} />
        </div>
      </div>

      {/* Spending Management Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Spending Policies */}
        <SpendingPolicies />

        {/* Transaction Activity */}
        <TransactionActivity />
      </div>

      {/* Activity & Compliance Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Active Streams */}
        <ActiveStreams />

        {/* Audit Trail */}
        <AuditTrail />
      </div>
    </main>
  );
}
