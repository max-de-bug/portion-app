"use client";

import { Settings, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PolicyCardBase, PolicyCardHeader } from "./PolicyCardBase";
import type { DailyLimitCardProps, EditLimitFormProps } from "../types";
import { useState } from "react";

interface Props extends Omit<DailyLimitCardProps, "onEditLimit"> {
  onUpdateLimit: (value: number) => void;
}

/**
 * Daily Spending Limit Policy Card.
 * Manages daily spending limits with visual progress bar and inline editing.
 */
export function DailyLimitCard({
  policy,
  onToggle,
  dailySpent,
  dailyLimit,
  dailyUsagePercent,
  remainingDaily,
  onUpdateLimit,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLimit, setTempLimit] = useState(dailyLimit);

  const handleSave = () => {
    onUpdateLimit(tempLimit);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempLimit(dailyLimit);
    setIsEditing(false);
  };

  return (
    <PolicyCardBase policy={policy} onToggle={onToggle}>
      <PolicyCardHeader
        name="Daily Spending Limit"
        enabled={policy.enabled}
        subtitle={`$${remainingDaily.toFixed(2)} remaining today`}
        onToggle={() => onToggle(policy.id, "Daily Spending Limit")}
      />

      {policy.enabled && (
        <>
          {/* Progress Display */}
          <ProgressBar
            spent={dailySpent}
            limit={dailyLimit}
            usagePercent={dailyUsagePercent}
          />

          {/* Edit Form or Edit Button */}
          {isEditing ? (
            <EditLimitForm
              value={tempLimit}
              min={50}
              max={1000}
              step={50}
              onChange={setTempLimit}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <button
              onClick={() => {
                setTempLimit(dailyLimit);
                setIsEditing(true);
              }}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" />
              Adjust limit
            </button>
          )}
        </>
      )}
    </PolicyCardBase>
  );
}

interface ProgressBarProps {
  spent: number;
  limit: number;
  usagePercent: number;
}

/**
 * Visual progress bar showing daily spending progress.
 */
function ProgressBar({ spent, limit, usagePercent }: ProgressBarProps) {
  const barColor =
    usagePercent >= 90
      ? "bg-gradient-to-r from-red-500 to-orange-500"
      : usagePercent >= 70
      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
      : "bg-gradient-to-r from-primary to-emerald-400";

  return (
    <>
      <div className="flex justify-between text-xs mb-2 font-medium">
        <span className="text-muted-foreground">$0</span>
        <span className="text-primary font-bold">
          ${spent.toFixed(2)} / ${limit}
        </span>
      </div>
      <div className="h-2.5 w-full bg-background/50 rounded-full overflow-hidden mb-3 relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 relative",
            barColor
          )}
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ width: "50%" }}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Inline edit form for daily limit.
 */
function EditLimitForm({
  value,
  min,
  max,
  step,
  onChange,
  onSave,
  onCancel,
}: EditLimitFormProps) {
  const handleChange = (newValue: number) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    onChange(clamped);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
        />
        <span className="text-xs font-medium text-muted-foreground w-12">
          ${value}
        </span>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} size="sm" className="flex-1">
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Range: ${min} - ${max} (increments of ${step})
      </p>
    </div>
  );
}
