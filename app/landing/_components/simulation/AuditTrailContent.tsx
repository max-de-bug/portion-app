"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  detail: string;
  time: string;
  status: "success" | "error";
}

interface AuditTrailContentProps {
  auditLogs: AuditLog[];
  isAuditSimulating: boolean;
  onReset: () => void;
}

/**
 * AuditTrailContent - Extracted and memoized for performance.
 * Displays audit trail simulation with real-time log entries.
 */
export const AuditTrailContent = memo(function AuditTrailContent({
  auditLogs,
  isAuditSimulating,
  onReset,
}: AuditTrailContentProps) {
  return (
    <div className="space-y-6 animate-tabContent">
      <div className="flex items-center justify-between mb-4 animate-stagger1">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Review Audit Trail</h3>
          {isAuditSimulating && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 uppercase animate-pulse">
              Recording
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="font-bold hover:scale-105 transition-transform"
        >
          Clear
        </Button>
      </div>

      <div className="space-y-2">
        {auditLogs.length === 0 && (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl opacity-50 animate-stagger2">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Activity will be logged here...
            </p>
          </div>
        )}
        {auditLogs.map((log, idx) => (
          <AuditLogRow key={log.id} log={log} isLatest={idx === 0} />
        ))}
      </div>
    </div>
  );
});

// Memoized audit log row
const AuditLogRow = memo(function AuditLogRow({
  log,
  isLatest,
}: {
  log: AuditLog;
  isLatest: boolean;
}) {
  return (
    <motion.div
      initial={isLatest ? { opacity: 0, x: -20 } : false}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl border transition-all",
        isLatest ? "bg-primary/5 border-primary/20" : "bg-background/50 border-border/30"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          log.status === "success" ? "bg-success/20 text-success" : "bg-red-500/20 text-red-500"
        )}
      >
        {log.status === "success" ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{log.action}</p>
        <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
        {log.time}
      </span>
    </motion.div>
  );
});

export type { AuditLog };
