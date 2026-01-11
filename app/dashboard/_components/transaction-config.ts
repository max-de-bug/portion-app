import { Activity, Clock, Shield, CheckCircle, XCircle } from "lucide-react";
import { Transaction } from "@/app/hooks/useTransactionActivity";

export const STATUS_CONFIG = {
  Processing: {
    icon: Clock,
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-500",
    dotColor: "bg-amber-500",
    animate: true,
  },
  Validated: {
    icon: Shield,
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-500",
    dotColor: "bg-blue-500",
    animate: true,
  },
  Settled: {
    icon: CheckCircle,
    bgColor: "bg-success/20",
    textColor: "text-success",
    dotColor: "bg-success",
    animate: false,
  },
  Failed: {
    icon: XCircle,
    bgColor: "bg-destructive/20",
    textColor: "text-destructive",
    dotColor: "bg-destructive",
    animate: false,
  },
} as const;

export const TYPE_COLORS: Record<Transaction["type"], string> = {
  API: "bg-purple-100 text-purple-700",
  SaaS: "bg-blue-100 text-blue-700",
  Cloud: "bg-cyan-100 text-cyan-700",
  Content: "bg-pink-100 text-pink-700",
  Other: "bg-gray-100 text-gray-700",
};
