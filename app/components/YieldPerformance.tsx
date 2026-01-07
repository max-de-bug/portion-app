import { TrendingUp } from "lucide-react";

export const YieldPerformance = () => {
  // Mock chart data points for visual representation
  const chartData = [35, 45, 42, 55, 48, 62, 58, 72, 68, 78, 75, 85];

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Yield Performance (Detected)</h3>
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-accent text-primary rounded-full">
            <TrendingUp className="w-3 h-3" />
            +24.5%
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

      {/* Simple Chart Visualization */}
      <div className="relative h-32 flex items-end justify-between gap-1 mt-6">
        {chartData.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t transition-all duration-300 hover:from-primary/80 hover:to-success"
            style={{ height: `${value}%` }}
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
