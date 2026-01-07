import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { StatCard } from "../components/StatCard";
import { StreamingValue } from "../components/StreamingValue";
import { ActiveStreams } from "../components/ActiveStreams";
import { YieldPerformance } from "../components/YieldPerformance";
import { Zap, DollarSign, Activity, Shield } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-[220px]">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={Zap}
              value="12.4%"
              label="Spendable APY"
              trend="+0.5%"
              trendUp={true}
            />
            <StatCard
              icon={DollarSign}
              value="$8,432.50"
              label="Total Yield"
              trend="+24.5%"
              trendUp={true}
            />
            <StatCard
              icon={Activity}
              value="14"
              label="Yield Detected"
              badge="+3"
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

          {/* Yield Performance */}
          <YieldPerformance />
        </main>
      </div>
    </div>
  );
}
