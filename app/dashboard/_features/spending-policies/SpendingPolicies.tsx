"use client";

import { Shield, HelpCircle } from "lucide-react";
import { useSpendingPolicies } from "@/app/hooks/useSpendingPolicies";
import { ToastContainer, showToast } from "@/components/ui/toast";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/dialog";
import {
  DailyLimitCard,
  MerchantWhitelistCard,
  MaxTransactionCard,
} from "./components";

/**
 * SpendingPolicies - Main container component for spending policy management.
 *
 * Uses composition pattern with extracted sub-components for:
 * - DailyLimitCard: Daily spending limit with progress visualization
 * - MerchantWhitelistCard: Approved merchants management
 * - MaxTransactionCard: Per-transaction limit settings
 *
 * Total lines: ~200 (reduced from 799)
 */
export function SpendingPolicies() {
  const {
    policies,
    dailySpent,
    dailyLimit,
    dailyUsagePercent,
    isLoading,
    updatePolicy,
    togglePolicy,
    addMerchant,
    removeMerchant,
  } = useSpendingPolicies();

  const { confirm, cancel, dialogProps } = useConfirmDialog();

  // Policy lookup helpers
  const dailyLimitPolicy = policies.find((p) => p.id === "daily_limit");
  const merchantPolicy = policies.find((p) => p.id === "merchant_whitelist");
  const maxTxPolicy = policies.find((p) => p.id === "max_transaction");
  const merchants = Array.isArray(merchantPolicy?.value)
    ? merchantPolicy.value
    : [];
  const remainingDaily = Math.max(0, dailyLimit - dailySpent);

  // Event Handlers
  const handleTogglePolicy = async (id: string, policyName: string) => {
    const policy = policies.find((p) => p.id === id);
    const willEnable = !policy?.enabled;

    if (id === "daily_limit" && willEnable && dailySpent > 0) {
      await confirm({
        title: "Enable Daily Limit?",
        message: `You've already spent $${dailySpent.toFixed(2)} today. Enabling this policy will enforce the limit immediately.`,
        onConfirm: () => {
          togglePolicy(id);
          showToast(
            `${policyName} ${willEnable ? "enabled" : "disabled"}`,
            "success"
          );
        },
      });
      return;
    }

    togglePolicy(id);
    showToast(`${policyName} ${willEnable ? "enabled" : "disabled"}`, "success");
  };

  const handleUpdateLimit = async (newLimit: number) => {
    if (newLimit < 50 || newLimit > 1000) {
      showToast("Daily limit must be between $50 and $1,000", "error");
      return;
    }

    if (newLimit < dailySpent) {
      await confirm({
        title: "Limit Below Current Spending",
        message: `Your current daily spending is $${dailySpent.toFixed(2)}. Setting the limit to $${newLimit} will immediately restrict new transactions. Continue?`,
        onConfirm: () => {
          updatePolicy("daily_limit", { value: newLimit });
          showToast(`Daily limit updated to $${newLimit}`, "success");
        },
      });
      return;
    }

    updatePolicy("daily_limit", { value: newLimit });
    showToast(`Daily limit updated to $${newLimit}`, "success");
  };

  const handleUpdateMaxTx = (newValue: number) => {
    const maxValue = maxTxPolicy?.maxValue ?? 500;
    if (newValue < 10 || newValue > maxValue) {
      showToast(`Max transaction must be between $10 and $${maxValue}`, "error");
      return;
    }
    updatePolicy("max_transaction", { value: newValue });
    showToast(`Max transaction size updated to $${newValue}`, "success");
  };

  const handleAddMerchant = (merchant: string) => {
    if (!merchant.trim()) {
      showToast("Please enter a merchant name", "error");
      return;
    }

    if (merchants.includes(merchant)) {
      showToast("Merchant already in whitelist", "error");
      return;
    }

    if (merchants.length >= 20) {
      showToast("Maximum 20 merchants allowed in whitelist", "error");
      return;
    }

    addMerchant(merchant);
    showToast(`${merchant} added to whitelist`, "success");
  };

  const handleRemoveMerchant = async (merchant: string) => {
    await confirm({
      title: "Remove Merchant?",
      message: `Remove "${merchant}" from the whitelist? This will prevent future transactions with this merchant.`,
      variant: "destructive",
      onConfirm: () => {
        removeMerchant(merchant);
        showToast(`${merchant} removed from whitelist`, "success");
      },
    });
  };

  // Loading State
  if (isLoading) {
    return <SpendingPoliciesSkeleton />;
  }

  return (
    <>
      <ToastContainer />
      <ConfirmDialog {...dialogProps} onCancel={cancel} />

      <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <SpendingPoliciesHeader activePolicies={policies.filter((p) => p.enabled).length} />

          {/* Policy Cards */}
          <div className="space-y-4">
            {dailyLimitPolicy && (
              <DailyLimitCard
                policy={dailyLimitPolicy}
                onToggle={handleTogglePolicy}
                dailySpent={dailySpent}
                dailyLimit={dailyLimit}
                dailyUsagePercent={dailyUsagePercent}
                remainingDaily={remainingDaily}
                onUpdateLimit={handleUpdateLimit}
              />
            )}

            {merchantPolicy && (
              <MerchantWhitelistCard
                policy={merchantPolicy}
                onToggle={handleTogglePolicy}
                merchants={merchants}
                onAddMerchant={handleAddMerchant}
                onRemoveMerchant={handleRemoveMerchant}
              />
            )}

            {maxTxPolicy && (
              <MaxTransactionCard
                policy={maxTxPolicy}
                onToggle={handleTogglePolicy}
                value={typeof maxTxPolicy.value === "number" ? maxTxPolicy.value : 100}
                maxValue={maxTxPolicy.maxValue ?? 500}
                onUpdateMaxTx={handleUpdateMaxTx}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

interface HeaderProps {
  activePolicies: number;
}

function SpendingPoliciesHeader({ activePolicies }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground truncate flex-1 min-w-0">
          Spending Policies
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-primary whitespace-nowrap flex-shrink-0">
          {activePolicies} Active
        </span>
        <HelpTooltip />
      </div>
    </div>
  );
}

function HelpTooltip() {
  return (
    <div className="group relative">
      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-muted-foreground">
        Policies control how your yield can be spent. Only enabled policies are
        enforced.
      </div>
    </div>
  );
}

function SpendingPoliciesSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
