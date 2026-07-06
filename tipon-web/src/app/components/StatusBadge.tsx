import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import type {
  AttendanceStatus,
  EventStatus,
  RegistrationStatus,
} from "../data/mockData";

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    cancelled: { label: "Cancelled", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const cfg = map[status] ?? { label: "Unknown", className: "bg-muted text-muted-foreground border-border" };
  return <Badge variant="outline" className={cn(cfg.className)}>{cfg.label}</Badge>;
}

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, { label: string; className: string }> = {
    registered: {
      label: "Registered",
      className: "border-emerald-300/50 bg-emerald-500 text-emerald-950 shadow-lg shadow-black/30 ring-1 ring-black/15",
    },
    cancelled: {
      label: "Cancelled",
      className: "border-red-200/60 bg-red-500 text-white shadow-lg shadow-black/30 ring-1 ring-black/15",
    },
  };
  const cfg = map[status];
  return <Badge variant="outline" className={cn("font-semibold", cfg.className)}>{cfg.label}</Badge>;
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; className: string }> = {
    present: { label: "Present", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    absent: { label: "Absent", className: "bg-red-500/15 text-red-400 border-red-500/30" },
    pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
  };
  const cfg = map[status];
  return <Badge variant="outline" className={cn(cfg.className)}>{cfg.label}</Badge>;
}
