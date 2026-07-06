import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "./ui/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: string; // tailwind text color class for the icon
}

export function StatCard({ label, value, icon: Icon, hint, accent = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3.5">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted", accent)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight tracking-tight">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
