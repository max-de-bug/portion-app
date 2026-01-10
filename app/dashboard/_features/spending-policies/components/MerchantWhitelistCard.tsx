"use client";

import { Plus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PolicyCardBase, PolicyCardHeader } from "./PolicyCardBase";
import type { MerchantWhitelistCardProps } from "../types";
import { useState } from "react";

/**
 * Merchant Whitelist Policy Card.
 * Manages a list of approved merchants for spending.
 */
export function MerchantWhitelistCard({
  policy,
  onToggle,
  merchants,
  onAddMerchant,
  onRemoveMerchant,
  maxMerchants = 20,
}: MerchantWhitelistCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMerchant, setNewMerchant] = useState("");

  const handleAdd = () => {
    const trimmed = newMerchant.trim();
    if (trimmed) {
      onAddMerchant(trimmed);
      setNewMerchant("");
      setShowAddForm(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      setShowAddForm(false);
      setNewMerchant("");
    }
  };

  return (
    <PolicyCardBase policy={policy} onToggle={onToggle} animationDelay={0.1}>
      <PolicyCardHeader
        name="Merchant Whitelist"
        enabled={policy.enabled}
        subtitle={`${merchants.length} merchant${merchants.length !== 1 ? "s" : ""} allowed`}
        onToggle={() => onToggle(policy.id, "Merchant Whitelist")}
      />

      {policy.enabled && (
        <div className="space-y-3">
          {/* Merchant Tags */}
          <MerchantTagList
            merchants={merchants}
            onRemove={onRemoveMerchant}
          />

          {/* Add Form or Button */}
          {showAddForm ? (
            <AddMerchantForm
              value={newMerchant}
              onChange={setNewMerchant}
              onAdd={handleAdd}
              onCancel={() => {
                setShowAddForm(false);
                setNewMerchant("");
              }}
              onKeyDown={handleKeyDown}
              disabled={merchants.length >= maxMerchants}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={merchants.length >= maxMerchants}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors w-full justify-center py-2 border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              Add merchant
            </button>
          )}
        </div>
      )}
    </PolicyCardBase>
  );
}

interface MerchantTagListProps {
  merchants: string[];
  onRemove: (merchant: string) => void;
}

/**
 * List of merchant tags with remove functionality.
 */
function MerchantTagList({ merchants, onRemove }: MerchantTagListProps) {
  if (merchants.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No merchants added yet
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {merchants.map((merchant) => (
        <MerchantTag key={merchant} name={merchant} onRemove={() => onRemove(merchant)} />
      ))}
    </div>
  );
}

interface MerchantTagProps {
  name: string;
  onRemove: () => void;
}

/**
 * Individual merchant tag with remove button.
 */
function MerchantTag({ name, onRemove }: MerchantTagProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1.5"
    >
      {name}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
        aria-label={`Remove ${name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

interface AddMerchantFormProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}

/**
 * Form for adding a new merchant.
 */
function AddMerchantForm({
  value,
  onChange,
  onAdd,
  onCancel,
  onKeyDown,
  disabled,
}: AddMerchantFormProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter merchant name"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyDown={onKeyDown}
          autoFocus
          disabled={disabled}
        />
        <Button onClick={onAdd} size="sm" variant="success" disabled={disabled || !value.trim()}>
          <Check className="w-3 h-3" />
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          <X className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Press Enter to add, Esc to cancel
      </p>
    </div>
  );
}
