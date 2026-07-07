import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { TriggerButton } from "../components/TriggerButton";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { EventStatusBadge } from "../components/StatusBadge";
import { CapacityBar } from "../components/CapacityBar";
import { EventFormDialog } from "../components/EventFormDialog";
import { compareEventDateTimes, formatEventDate, formatEventTime } from "../lib/format";
import { useAppStore } from "../store/AppStore";
import { cn } from "../components/ui/utils";
import type { EventItem, EventStatus } from "../data/mockData";

type StatusFilter = "all" | EventStatus;

const FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const statusRank: Record<EventStatus, number> = {
  open: 0,
  completed: 1,
  cancelled: 2,
};

export function ManageEvents() {
  const navigate = useNavigate();
  const { currentUser, events, confirmedCountFor, cancelEvent } = useAppStore();
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<EventItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const organizerId = currentUser?.id;

  const myEvents = useMemo(
    () =>
      events
        .filter((e) => e.organizerId === organizerId)
        .sort((a, b) => {
          const rank = statusRank[a.status] - statusRank[b.status];
          if (rank !== 0) return rank;
          return compareEventDateTimes(a.eventDate, b.eventDate);
        }),
    [events, organizerId],
  );
  const visibleEvents = useMemo(
    () => myEvents.filter((e) => statusFilter === "all" || e.status === statusFilter),
    [myEvents, statusFilter],
  );
  const openCount = myEvents.filter((e) => e.status === "open").length;
  const completedCount = myEvents.filter((e) => e.status === "completed").length;
  const cancelledCount = myEvents.filter((e) => e.status === "cancelled").length;
  const filterCounts: Record<StatusFilter, number> = {
    all: myEvents.length,
    open: openCount,
    completed: completedCount,
    cancelled: cancelledCount,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Events</h1>
          <p className="text-sm text-muted-foreground">Create, edit and monitor your events.</p>
        </div>
        <EventFormDialog
          trigger={
            <TriggerButton>
              <Plus className="size-4" /> Create event
            </TriggerButton>
          }
        />
      </div>

      {myEvents.length === 0 ? (
        <Card className="border-dashed border-primary/15">
          <div className="flex min-h-[22rem] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <ListChecks className="size-6" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold tracking-tight">No events yet</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Use Create event to publish your first event and start accepting registrations.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="flex flex-col justify-between gap-3 border-b px-4 py-2.5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold">Event inventory</h2>
              <p className="text-xs text-muted-foreground">
                {visibleEvents.length} of {myEvents.length} events shown
              </p>
            </div>
            <div className="flex w-full rounded-lg border bg-background/30 p-1 sm:w-auto">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  variant="ghost"
                  size="sm"
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
                <TableHead className="h-7 px-3 text-xs uppercase tracking-normal text-muted-foreground">
                  Event
                </TableHead>
                <TableHead className="hidden h-7 w-48 px-3 text-xs uppercase tracking-normal text-muted-foreground md:table-cell">
                  Schedule
                </TableHead>
                <TableHead className="hidden h-7 w-56 px-3 text-xs uppercase tracking-normal text-muted-foreground lg:table-cell">
                  Capacity
                </TableHead>
                <TableHead className="h-7 w-28 px-3 text-xs uppercase tracking-normal text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="h-7 w-12 px-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEvents.map((e) => {
                const filled = confirmedCountFor(e.id);
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-accent/30"
                    onClick={() => navigate(`/organizer/events/${e.id}`)}
                  >
                    <TableCell className="min-w-0 px-3 py-2.5 pr-6">
                      <div className="max-w-full truncate font-medium leading-snug" title={e.title}>
                        {e.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={e.venue}>
                        {e.venue}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap px-3 py-2.5 text-sm md:table-cell">
                      <div className="font-medium">{formatEventDate(e.eventDate)}</div>
                      <div className="text-xs text-muted-foreground">{formatEventTime(e.eventDate)}</div>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2.5 lg:table-cell">
                      <CapacityBar filled={filled} capacity={e.capacity} />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <EventStatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="px-3 py-2.5" onClick={(ev) => ev.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <TriggerButton variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </TriggerButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/organizer/events/${e.id}`)}>
                            <Users className="size-4" /> View registrants
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={e.status === "completed"} onClick={() => setEditing(e)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={e.status !== "open"}
                            onClick={() => setConfirmCancel(e)}
                          >
                            <Trash2 className="size-4" /> Cancel event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {visibleEvents.length === 0 && (
            <CardContent className="flex min-h-40 items-center justify-center border-t text-sm text-muted-foreground">
              No events match this filter.
            </CardContent>
          )}
        </Card>
      )}

      {/* Edit dialog (controlled, opened from the dropdown) */}
      {editing && (
        <EventFormDialog
          event={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmCancel?.title}" will be marked cancelled and all registered participants
              will be notified. This cannot be undone in the prototype.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep event</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancel) cancelEvent(confirmCancel.id);
                setConfirmCancel(null);
              }}
            >
              Cancel event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
