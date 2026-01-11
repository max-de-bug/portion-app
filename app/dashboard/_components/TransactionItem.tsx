import { cn } from "@/lib/utils";
import { Transaction } from "@/app/hooks/useTransactionActivity";
import { STATUS_CONFIG, TYPE_COLORS } from "./transaction-config";

interface TransactionItemProps {
  tx: Transaction;
  isFirst: boolean;
}

export function TransactionItem({ tx, isFirst }: TransactionItemProps) {
  const config = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 p-3 rounded-xl transition-all duration-500 border overflow-hidden",
        isFirst
          ? "bg-accent/60 border-primary/20 scale-[1.01] shadow-lg"
          : "bg-background/60 border-border/30 opacity-90"
      )}
      style={{
        animation: isFirst ? "slideDown 0.4s ease-out" : "none",
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            config.bgColor,
            config.textColor
          )}
        >
          <Icon className={cn("w-4 h-4", config.animate && "animate-spin")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate">{tx.service}</p>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0",
                TYPE_COLORS[tx.type]
              )}
            >
              {tx.type}
            </span>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                config.dotColor,
                config.animate && "animate-pulse"
              )}
            />
            <span className="truncate">{tx.status} • {tx.time}</span>
          </p>
        </div>
      </div>
      <span className="text-sm font-mono font-bold text-primary flex-shrink-0">{tx.amount}</span>
    </div>
  );
}
