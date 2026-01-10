"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { PolicyCardProps } from "../types";

interface PolicyCardBaseProps extends PolicyCardProps {
  animationDelay?: number;
}

/**
 * Base card wrapper for policy cards.
 * Provides consistent styling, animation, and toggle behavior.
 */
export function PolicyCardBase({
  policy,
  onToggle,
  children,
  animationDelay = 0,
}: PolicyCardBaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-300 hover:shadow-md overflow-hidden",
        policy.enabled
          ? "bg-background/60 border-border/30 hover:border-primary/40"
          : "bg-muted/30 border-border/20 opacity-60"
      )}
    >
      {children}
    </motion.div>
  );
}

interface PolicyCardHeaderProps {
  name: string;
  enabled: boolean;
  status?: string;
  subtitle?: string;
  onToggle: () => void;
}

/**
 * Reusable header for policy cards with status indicator and toggle button.
 */
export function PolicyCardHeader({
  name,
  enabled,
  status,
  subtitle,
  onToggle,
}: PolicyCardHeaderProps) {
  const displayStatus = enabled ? "Active" : status === "pending" ? "Pending" : "Disabled";
  
  const statusStyles = cn(
    "text-[10px] font-bold px-2 py-1 rounded-full uppercase transition-colors whitespace-nowrap flex-shrink-0",
    enabled
      ? "bg-success/20 text-success hover:bg-success/30"
      : status === "pending"
      ? "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30"
      : "bg-muted text-muted-foreground hover:bg-muted/80"
  );

  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <StatusIndicator enabled={enabled} pending={status === "pending"} />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground truncate block">
            {name}
          </span>
          {enabled && subtitle && (
            <span className="text-[10px] text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>
      <button onClick={onToggle} className={statusStyles}>
        {displayStatus}
      </button>
    </div>
  );
}

interface StatusIndicatorProps {
  enabled: boolean;
  pending?: boolean;
}

/**
 * Visual status indicator dot.
 */
function StatusIndicator({ enabled, pending }: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full transition-colors flex-shrink-0",
        enabled
          ? "bg-success animate-pulse"
          : pending
          ? "bg-amber-500 animate-pulse"
          : "bg-muted-foreground"
      )}
    />
  );
}
