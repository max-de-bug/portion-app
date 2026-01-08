import { TrendingUp } from "lucide-react";

export const YieldPerformance = () => {
  // Empty chart data for now
  const chartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Yield Performance (Detected)</h3>
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            <TrendingUp className="w-3 h-3" />
            0.0%
          </span>
        </div>
        <div className="flex items-center gap-2">
          {["1D", "1W", "1M", "1Y"].map((period, index) => (
            <button
              key={period}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                index === 2
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Simple Chart Visualization - Empty State */}
      <div className="relative h-32 flex items-end justify-between gap-1 mt-6 opacity-30">
        {chartData.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-muted rounded-t transition-all duration-300"
            style={{ height: `10%` }} 
          />
        ))}
      </div>

      {/* Chart Labels */}
      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
};
