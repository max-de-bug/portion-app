"use client";

/**
 * Pool Dashboard Component - Stat Card
 * 
 * Premium glassmorphism stat card for Pool metrics
 */

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PoolStatCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

export const PoolStatCard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  gradient = "from-emerald-500 to-teal-500",
  delay = 0,
}: PoolStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      {/* Glassmorphism Card */}
      <div className="relative p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Gradient Glow Effect */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradient} opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity duration-500`} />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-bold ${trend.isPositive ? "text-emerald-500" : "text-red-500"}`}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-1">
            <span className="text-3xl font-black tracking-tight text-foreground">
              {prefix}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: delay + 0.2 }}
              >
                {typeof value === "number" ? value.toLocaleString() : value}
              </motion.span>
              {suffix}
            </span>
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
      </div>
    </motion.div>
  );
};
