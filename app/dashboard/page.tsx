import { StatCard } from "./StatCard";
import { StreamingValue } from "./StreamingValue";
import { ActiveStreams } from "./ActiveStreams";
import { Zap, DollarSign, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="p-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Zap}
          value="0.0%"
          label="Spendable APY"
          trend="0.0%"
          trendUp={true}
        />
        <StatCard
          icon={DollarSign}
          value="$0.00"
          label="Total Yield"
          trend="0.0%"
          trendUp={true}
        />
        <StatCard
          icon={Activity}
          value="0"
          label="Yield Detected"
          badge="+0"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Spendable Value - Takes 2 columns */}
        <div className="col-span-2">
          <StreamingValue />
        </div>

        {/* Active Streams */}
        <div className="col-span-1">
          <ActiveStreams />
        </div>
      </div>
    </main>
  );
}
