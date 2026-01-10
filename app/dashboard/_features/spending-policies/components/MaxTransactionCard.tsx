"use client";

import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolicyCardBase, PolicyCardHeader } from "./PolicyCardBase";
import type { MaxTransactionCardProps, EditMaxTxFormProps } from "../types";
import { useState } from "react";

interface Props extends Omit<MaxTransactionCardProps, "onEditMaxTx"> {
  onUpdateMaxTx: (value: number) => void;
}

/**
 * Max Transaction Size Policy Card.
 * Limits the maximum amount per transaction.
 */
export function MaxTransactionCard({
  policy,
  onToggle,
  value,
  maxValue,
  onUpdateMaxTx,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onUpdateMaxTx(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  return (
    <PolicyCardBase policy={policy} onToggle={onToggle} animationDelay={0.2}>
      <PolicyCardHeader
        name="Max Transaction Size"
        enabled={policy.enabled}
        status={policy.status}
        onToggle={() => onToggle(policy.id, "Max Transaction Size")}
      />

      {isEditing ? (
        <EditMaxTxForm
          value={tempValue}
          min={10}
          max={maxValue}
          step={10}
          onChange={setTempValue}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Limit:{" "}
            <span className="text-primary font-mono font-bold">
              ${value.toFixed(2)}
            </span>{" "}
            per transaction
          </p>
          {policy.enabled && (
            <button
              onClick={() => {
                setTempValue(value);
                setIsEditing(true);
              }}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
      )}
    </PolicyCardBase>
  );
}

/**
 * Edit form for max transaction value.
 */
function EditMaxTxForm({
  value,
  min,
  max,
  step,
  onChange,
  onSave,
  onCancel,
}: EditMaxTxFormProps) {
  const handleChange = (newValue: number) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    onChange(clamped);
  };

  return (
    <div className="space-y-2 mt-3">
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
        <span className="text-xs font-medium text-muted-foreground w-16">
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
