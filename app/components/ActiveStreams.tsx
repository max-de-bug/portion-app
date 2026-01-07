import { ArrowRight, Shield, Coins, FileText, Zap, Activity } from "lucide-react";

const yields = [
  {
    type: "sUSDv Staking Pool",
    icon: Coins,
    rate: "$8.17/hr",
    amount: "$2,450.00",
    status: "Active",
    isPrivate: true,
    destination: "sUSDv Vault",
  },
  {
    type: "YaaS (Liquid Yield)",
    icon: Zap,
    rate: "$4.12/hr",
    amount: "$1,234.50",
    status: "Active",
    isPrivate: true,
    destination: "Direct Wallet",
  },
  {
    type: "$SOLO Native Staking",
    icon: Shield,
    rate: "$6.94/hr",
    amount: "5,000.00 SOLO",
    status: "Active",
    isPrivate: true,
    destination: "Staking Hub",
  },
  {
    type: "USDV/SOL LP Rewards",
    icon: Activity,
    rate: "$2.45/hr",
    amount: "$840.00",
    status: "Active",
    isPrivate: false,
    destination: "Solv Vault",
  },
];

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
          style={{ width: "75%" }}
        />
      </div>

      {/* Yield List */}
      <div className="space-y-3">
        {yields.map((yieldItem, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-muted border border-border hover:border-primary/20 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <yieldItem.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {yieldItem.type}
                    </p>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {yieldItem.destination}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      ◎ {yieldItem.rate}
                    </span>
                    {yieldItem.isPrivate && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Shield className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {yieldItem.amount}
                </p>
                <p
                  className={`text-xs font-medium ${
                    yieldItem.status === "Active" ? "text-primary" : "text-warning"
                  }`}
                >
                  {yieldItem.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
