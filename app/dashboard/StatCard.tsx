import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
  badge?: string;
}

export const StatCard = ({
  icon: Icon,
  value,
  label,
  trend,
  trendUp = true,
  badge,
}: StatCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trendUp
                ? "text-primary bg-accent"
                : "text-destructive bg-destructive/10"
            }`}
          >
            {trend}
          </span>
        )}
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};
