"use client";

import { StatCard } from "./StatCard";
import { StreamingValue } from "./StreamingValue";
import { ActiveStreams } from "./ActiveStreams";
import { SpendingPolicies } from "./_features/spending-policies";
import { TransactionActivity } from "./TransactionActivity";
import { YieldCapacity } from "./YieldCapacity";
import { AuditTrail } from "./AuditTrail";
import { Zap, DollarSign, Activity } from "lucide-react";
import { useSolomonAPY, useSolomonYieldSync, useRealtimeYield } from "@/app/hooks/useSolomonYield";
import { usePrivy } from "@privy-io/react-auth";

import { ReceiveModal, WithdrawModal } from "./ActionModals";
import { useState } from "react";
import { useSpendableYield } from "@/app/hooks/useSolomonYield";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user } = usePrivy();
  const router = useRouter();
  const { data: apyData, isLoading: apyLoading } = useSolomonAPY();
  
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Find specifically the Solana wallet address from linked accounts
  const solanaWallet = user?.linkedAccounts?.find(
    (account) => account.type === "wallet" && account.chainType === "solana"
  ) as { address: string } | undefined;

  const walletAddress = solanaWallet?.address || user?.wallet?.address || "";

  const { totalYield, yieldDetected, isLoading: yieldLoading } = useRealtimeYield(walletAddress || undefined);
  const { spendableYield } = useSpendableYield(walletAddress || undefined);
  const apy = apyData?.apy ?? 0;

  return (
    <main className="p-6 space-y-6 relative">
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
          value={yieldLoading ? "..." : `$${totalYield.toFixed(2)}`}
          label="Total Yield"
          trend={`${totalYield > 0 ? "+" : ""}0.0%`}
          trendUp={totalYield >= 0}
        />
        <StatCard
          icon={Activity}
          value={yieldLoading ? "..." : yieldDetected.toString()}
          label="Yield Sources"
          badge={yieldDetected > 0 ? "Active" : "None"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Spendable Value - Takes 2 columns */}
        <div className="col-span-2">
          <StreamingValue 
            walletAddress={walletAddress} 
            onSpend={() => router.push("/dashboard/ai")}
            onReceive={() => setIsReceiveOpen(true)}
            onWithdraw={() => setIsWithdrawOpen(true)}
          />
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

      {/* Modals - Rendered at root for best stacking context */}
      <ReceiveModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        walletAddress={walletAddress || ""}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableYield={spendableYield}
        walletAddress={walletAddress || ""}
      />
    </main>
  );
}
