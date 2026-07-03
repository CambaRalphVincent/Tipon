import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ListChecks, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";
import { TriggerButton } from "../components/TriggerButton";
import { Card } from "../components/ui/card";
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
import { formatEventDate } from "../lib/format";
import { useAppStore } from "../store/AppStore";
import type { EventItem } from "../data/mockData";

export function ManageEvents() {
  const navigate = useNavigate();
  const { currentUser, events, confirmedCountFor, cancelEvent } = useAppStore();
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<EventItem | null>(null);
  const organizerId = currentUser?.id;

  const myEvents = useMemo(
    () =>
      events
        .filter((e) => e.organizerId === organizerId)
        .sort((a, b) => +new Date(b.eventDate) - +new Date(a.eventDate)),
    [events, organizerId],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Events</h1>
          <p className="text-muted-foreground">Create, edit and monitor your events.</p>
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
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="hidden w-40 md:table-cell">Date</TableHead>
                <TableHead className="hidden w-56 lg:table-cell">Capacity</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {myEvents.map((e) => {
                const filled = confirmedCountFor(e.id);
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/organizer/events/${e.id}`)}
                  >
                    <TableCell className="min-w-0 pr-6">
                      <div className="max-w-full truncate font-medium leading-snug" title={e.title}>
                        {e.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={e.venue}>
                        {e.venue}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                      {formatEventDate(e.eventDate)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <CapacityBar filled={filled} capacity={e.capacity} />
                    </TableCell>
                    <TableCell>
                      <EventStatusBadge status={e.status} />
                    </TableCell>
                    <TableCell onClick={(ev) => ev.stopPropagation()}>
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
                          <DropdownMenuItem onClick={() => setEditing(e)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={e.status === "cancelled"}
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
