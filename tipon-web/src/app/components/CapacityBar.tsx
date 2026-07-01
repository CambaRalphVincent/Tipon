import { cn } from "./ui/utils";

interface CapacityBarProps {
  filled: number;
  capacity: number;
  className?: string;
  showLabel?: boolean;
}

export function CapacityBar({ filled, capacity, className, showLabel = true }: CapacityBarProps) {
  const pct = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;
  const full = filled >= capacity;
  const nearlyFull = pct >= 80 && !full;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filled} / {capacity} registered
          </span>
          <span className={cn(full && "text-red-400", nearlyFull && "text-amber-400")}>
            {full ? "Full" : `${capacity - filled} left`}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            full ? "bg-red-500" : nearlyFull ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
