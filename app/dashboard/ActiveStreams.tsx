import { ArrowRight, Shield, Coins, FileText, Zap, Activity } from "lucide-react";

// Mock data removed. Initialize with empty array for production readiness.
const yields: any[] = [];

export const ActiveStreams = () => {
  const liveCount = yields.filter((s) => s.status === "Active").length;

  return (
    <div className="glass-card rounded-2xl p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Spendable Yield</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-accent text-primary rounded-full">
            {liveCount} Detected
          </span>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-1000"
          style={{ width: "0%" }}
        />
      </div>

      {/* Yield List - Empty State */}
      <div className="flex flex-col items-center justify-center h-[200px] text-center space-y-3 opacity-60">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Zap className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
            <p className="font-medium text-foreground">No active streams</p>
            <p className="text-sm text-muted-foreground">Connect wallet to detect yield sources</p>
        </div>
      </div>
    </div>
  );
};
