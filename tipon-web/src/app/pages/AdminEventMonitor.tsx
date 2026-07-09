import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clock,
  ListChecks,
  MapPin,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { CapacityBar } from "../components/CapacityBar";
import { EventStatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import { eventsApi, type ApiEvent } from "../lib/api";
import { compareEventDateTimes, formatEventDate, formatEventTime } from "../lib/format";
import { cn } from "../components/ui/utils";
import type { EventStatus } from "../data/mockData";

type StatusFilter = "all" | EventStatus;

const FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function AdminEventMonitor() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  useEffect(() => {
    eventsApi
      .all()
      .then((res) => setEvents(res.data))
      .catch(() => toast.error("Failed to load events."))
      .finally(() => setLoading(false));
  }, []);

  const visibleEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return events
      .filter((event) => statusFilter === "all" || event.status === statusFilter)
      .filter((event) => {
        if (!normalized) return true;
        return `${event.title} ${event.venue} ${event.organizer?.name ?? ""}`
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => compareEventDateTimes(a.event_date, b.event_date));
  }, [events, query, statusFilter]);

  const openCount = events.filter((event) => event.status === "open").length;
  const completedCount = events.filter((event) => event.status === "completed").length;
  const cancelledCount = events.filter((event) => event.status === "cancelled").length;
  const fullCount = events.filter((event) => (event.registered_count ?? 0) >= event.capacity).length;
  const filterCounts: Record<StatusFilter, number> = {
    all: events.length,
    open: openCount,
    completed: completedCount,
    cancelled: cancelledCount,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Event Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Review event status, organizer ownership, and capacity usage across Tipon.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, venues, organizers..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={events.length} icon={CalendarDays} accent="text-primary" />
        <StatCard label="Open events" value={openCount} icon={ListChecks} accent="text-emerald-400" />
        <StatCard label="Full events" value={fullCount} icon={Users} accent="text-amber-400" />
        <StatCard label="Cancelled" value={cancelledCount} icon={ShieldAlert} accent="text-red-400" />
      </div>

      <Card className="overflow-hidden py-0">
        <div className="flex flex-col justify-between gap-3 border-b px-4 py-2.5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold">Event Inventory</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading events..." : `${visibleEvents.length} of ${events.length} events shown`}
            </p>
          </div>
          <div className="flex w-full rounded-lg border bg-background/30 p-1 sm:w-auto">
            {FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`${filter.label} events (${filterCounts[filter.value]})`}
                className={cn(
                  "h-8 flex-1 rounded-md px-3 text-xs sm:flex-none",
                  statusFilter === filter.value && "bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary",
                )}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
                <span className="ml-1.5 rounded bg-background/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {filterCounts[filter.value]}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Table className="table-fixed">
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 px-3 text-xs uppercase tracking-normal text-muted-foreground">
                Event
              </TableHead>
              <TableHead className="hidden h-8 w-56 px-3 text-xs uppercase tracking-normal text-muted-foreground md:table-cell">
                Organizer
              </TableHead>
              <TableHead className="hidden h-8 w-48 px-3 text-xs uppercase tracking-normal text-muted-foreground lg:table-cell">
                Schedule
              </TableHead>
              <TableHead className="hidden h-8 w-56 px-3 text-xs uppercase tracking-normal text-muted-foreground xl:table-cell">
                Capacity
              </TableHead>
              <TableHead className="h-8 w-28 px-3 text-xs uppercase tracking-normal text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Loading events...
                </TableCell>
              </TableRow>
            ) : visibleEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No events match this view.
                </TableCell>
              </TableRow>
            ) : (
              visibleEvents.map((event) => {
                const filled = event.registered_count ?? 0;
                return (
                  <TableRow
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${event.title}`}
                    className="cursor-pointer hover:bg-accent/30 focus-visible:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedEvent(event)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                        keyboardEvent.preventDefault();
                        setSelectedEvent(event);
                      }
                    }}
                  >
                    <TableCell className="min-w-0 px-3 py-2.5 pr-6">
                      <div className="max-w-full truncate font-medium leading-snug" title={event.title}>
                        {event.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={event.venue}>
                        {event.venue}
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 md:table-cell">
                      {event.organizer ? (
                        <div className="truncate text-sm" title={event.organizer.name}>
                          {event.organizer.name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap px-3 py-2.5 text-sm lg:table-cell">
                      <div className="font-medium">{formatEventDate(event.event_date)}</div>
                      <div className="text-xs text-muted-foreground">{formatEventTime(event.event_date)}</div>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 xl:table-cell">
                      <CapacityBar filled={filled} capacity={event.capacity} />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex flex-col items-start gap-1.5">
                        <EventStatusBadge status={event.status} />
                        {filled >= event.capacity && event.status === "open" && (
                          <Badge variant="secondary" className="text-[11px]">
                            Full
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {!loading && visibleEvents.length === 0 && events.length > 0 && (
          <CardContent className="border-t px-4 py-3 text-sm text-muted-foreground">
            Try a different status filter or search term.
          </CardContent>
        )}
      </Card>

      <AdminEventDetailsDrawer
        event={selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}

function AdminEventDetailsDrawer({
  event,
  onOpenChange,
}: {
  event: ApiEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const filled = event?.registered_count ?? 0;
  const capacity = event?.capacity ?? 0;
  const remaining = Math.max(0, capacity - filled);
  const fillPercent = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;

  return (
    <Sheet open={!!event} onOpenChange={onOpenChange}>
      {event && (
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-5 py-4">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="min-w-0">
                <SheetTitle className="truncate text-xl" title={event.title}>
                  {event.title}
                </SheetTitle>
                <SheetDescription>
                  Admin event details and capacity summary.
                </SheetDescription>
              </div>
              <EventStatusBadge status={event.status} />
            </div>
          </SheetHeader>

          <div className="space-y-5 px-5 py-4">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Event Overview</h3>
              <div className="grid gap-3">
                <DetailRow icon={MapPin} label="Venue" value={event.venue} />
                <DetailRow icon={UserRound} label="Organizer" value={event.organizer?.name ?? "Unknown"} />
                <DetailRow
                  icon={Clock}
                  label="Schedule"
                  value={`${formatEventDate(event.event_date)} at ${formatEventTime(event.event_date)}`}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Capacity</h3>
              <div className="rounded-lg border bg-muted/15 p-3">
                <CapacityBar filled={filled} capacity={capacity} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Registered" value={filled} />
                  <Metric label="Capacity" value={capacity} />
                  <Metric label="Remaining" value={remaining} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Operational Snapshot</h3>
              <div className="grid gap-2 rounded-lg border bg-muted/15 p-3 text-sm">
                <SnapshotRow label="Fill rate" value={`${fillPercent}%`} />
                <SnapshotRow label="Status" value={<EventStatusBadge status={event.status} />} />
                <SnapshotRow label="Event ID" value={`#${event.id}`} />
              </div>
            </section>

            {event.description && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Description</h3>
                <p className="rounded-lg border bg-muted/15 p-3 text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </section>
            )}
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/15 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-normal text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background/40 px-2 py-2">
      <p className="text-lg font-semibold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
