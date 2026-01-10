import type { SpendingPolicy } from "@/app/hooks/useSpendingPolicies";

export interface PolicyCardProps {
  policy: SpendingPolicy;
  onToggle: (id: string, name: string) => void;
  children?: React.ReactNode;
}

export interface DailyLimitCardProps extends PolicyCardProps {
  dailySpent: number;
  dailyLimit: number;
  dailyUsagePercent: number;
  remainingDaily: number;
  onEditLimit: () => void;
}

export interface EditLimitFormProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface MerchantWhitelistCardProps extends PolicyCardProps {
  merchants: string[];
  onAddMerchant: (name: string) => void;
  onRemoveMerchant: (name: string) => void;
  maxMerchants?: number;
}

export interface MaxTransactionCardProps extends PolicyCardProps {
  value: number;
  maxValue: number;
  onEditMaxTx: () => void;
}

export interface EditMaxTxFormProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onSave: () => void;
  onCancel: () => void;
}
