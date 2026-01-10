"use client";

import { FileText, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuditTrail, type AuditEvent } from "@/app/hooks/useAuditTrail";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-success/20",
    textColor: "text-success",
    dotColor: "bg-success",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-destructive/20",
    textColor: "text-destructive",
    dotColor: "bg-destructive",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-500",
    dotColor: "bg-blue-500",
  },
};

const CATEGORY_LABELS: Record<AuditEvent["category"], string> = {
  policy: "Policy",
  transaction: "Transaction",
  wallet: "Wallet",
  merchant: "Merchant",
  system: "System",
};

function AuditEventItem({ event, isFirst }: { event: AuditEvent; isFirst: boolean }) {
  const config = STATUS_CONFIG[event.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-xl transition-all duration-500 border",
        isFirst
          ? "bg-accent/60 border-primary/20 scale-[1.01] shadow-lg"
          : "bg-background/60 border-border/30 opacity-90"
      )}
      style={{
        animation: isFirst ? "slideDown 0.4s ease-out" : "none",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            config.bgColor,
            config.textColor
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{event.action}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground uppercase">
              {CATEGORY_LABELS[event.category]}
            </span>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                config.dotColor,
                event.status === "error" && "animate-pulse"
              )}
            />
            {event.detail} • {event.time}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuditTrail() {
  const { isLoading, clearEvents, getRecentEvents, getEventStats } = useAuditTrail();

  const recentEvents = getRecentEvents(6);
  const stats = getEventStats();
  const hasEvents = recentEvents.length > 0;

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Audit Trail</h3>
            {stats.today > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary uppercase">
                {stats.today} Today
              </span>
            )}
          </div>
          {hasEvents && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEvents}
              className="text-xs h-7"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Event List */}
        <div className="space-y-2">
          {!hasEvents ? (
            <div className="py-12 text-center border border-dashed border-border rounded-xl opacity-60">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No audit events</p>
              <p className="text-xs text-muted-foreground mt-1">
                Events will appear when you make changes
              </p>
            </div>
          ) : (
            recentEvents.map((event, idx) => (
              <AuditEventItem key={event.id} event={event} isFirst={idx === 0} />
            ))
          )}
        </div>

        {/* Stats Footer */}
        {hasEvents && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                <span className="font-bold text-success">{stats.success}</span> success
              </span>
              {stats.error > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-bold text-destructive">{stats.error}</span> errors
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Last 7 days • {stats.total} total
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
