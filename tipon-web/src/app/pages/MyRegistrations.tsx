import { useMemo } from "react";
import { CalendarDays, ChevronRight, MapPin, Ticket } from "lucide-react";
import { Button } from "../components/ui/button";
import { TriggerButton } from "../components/TriggerButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AttendanceBadge, RegistrationStatusBadge } from "../components/StatusBadge";
import { CapacityBar } from "../components/CapacityBar";
import { cn } from "../components/ui/utils";
import { formatEventDate, formatEventTime, isPast } from "../lib/format";
import { LIVEWIRE_BASE_URL } from "../lib/api";
import { useAppStore } from "../store/AppStore";
import type { EventItem, Registration } from "../data/mockData";

interface RegItem {
  reg: Registration;
  event: EventItem;
}

export function MyRegistrations() {
  const { currentUser, registrations, eventById, cancelRegistration, confirmedCountFor } = useAppStore();
  const currentUserId = currentUser?.id ?? "";

  const mine = useMemo(
    () =>
      registrations
        .filter((r) => r.userId === currentUserId)
        .map((r) => ({ reg: r, event: eventById(r.eventId) }))
        .filter((x): x is RegItem => Boolean(x.event))
        .sort((a, b) => +new Date(b.event.eventDate) - +new Date(a.event.eventDate)),
    [registrations, currentUserId, eventById],
  );

  const upcoming = mine.filter(
    (x) => x.reg.status === "registered" && x.event.status === "open" && !isPast(x.event.eventDate),
  );
  const past = mine.filter(
    (x) => x.reg.status === "registered" && (x.event.status === "completed" || isPast(x.event.eventDate)),
  );
  const cancelled = mine.filter((x) => x.reg.status === "cancelled");
  const totalActive = upcoming.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <div className="mb-1">
          <h1 className="text-[1.75rem] font-extrabold leading-none tracking-tight">My Registrations</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your confirmed, attended, and cancelled event registrations in one place.
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="h-auto flex-wrap gap-1 bg-foreground/[0.03] p-1">
          <TabsTrigger value="upcoming" className="rounded-lg px-3 py-1.5">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg px-3 py-1.5">
            Past ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-lg px-3 py-1.5">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        {mine.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{mine.length}</span> registration
            {mine.length === 1 ? "" : "s"} with{" "}
            <span className="font-semibold text-foreground">{totalActive}</span> upcoming.
          </p>
        )}

        <TabsContent value="upcoming" className="mt-4">
          <RegistrationList
            items={upcoming}
            confirmedCountFor={confirmedCountFor}
            onCancel={cancelRegistration}
            cancellable
          />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <RegistrationList items={past} confirmedCountFor={confirmedCountFor} showAttendance />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4">
          <RegistrationList items={cancelled} confirmedCountFor={confirmedCountFor} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RegistrationList({
  items,
  confirmedCountFor,
  onCancel,
  cancellable = false,
  showAttendance = false,
}: {
  items: RegItem[];
  confirmedCountFor: (eventId: string) => number;
  onCancel?: (eventId: string) => void;
  cancellable?: boolean;
  showAttendance?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
        <Ticket className="size-9 text-muted-foreground" />
        <p className="font-medium">Nothing here yet</p>
        <Button variant="link" className="h-auto p-0" asChild>
          <a href={`${LIVEWIRE_BASE_URL}/events`}>Browse events</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ reg, event }) => (
        <RegistrationCard
          key={reg.id}
          reg={reg}
          event={event}
          filled={confirmedCountFor(event.id)}
          cancellable={cancellable}
          showAttendance={showAttendance}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}

function RegistrationCard({
  reg,
  event,
  filled,
  cancellable,
  showAttendance,
  onCancel,
}: {
  reg: Registration;
  event: EventItem;
  filled: number;
  cancellable: boolean;
  showAttendance: boolean;
  onCancel?: (eventId: string) => void;
}) {
  const cancelled = reg.status === "cancelled" || event.status === "cancelled";
  const full = filled >= event.capacity;
  const nearlyFull = event.capacity > 0 && Math.round((filled / event.capacity) * 100) >= 80 && !full;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl">
      <a href={`${LIVEWIRE_BASE_URL}/events/${event.id}`} className="relative aspect-video overflow-hidden bg-muted">
        <ImageWithFallback
          src={event.cover_image_path}
          alt={event.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
          <RegistrationStatusBadge status={reg.status} />
          {showAttendance && <AttendanceBadge status={reg.attendance} />}
        </div>
      </a>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="mb-1 line-clamp-1 font-bold leading-tight tracking-tight">
            <a href={`${LIVEWIRE_BASE_URL}/events/${event.id}`} className="hover:text-primary">
              {event.title}
            </a>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-primary" />
            <span>
              {formatEventDate(event.eventDate)} at {formatEventTime(event.eventDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {!cancelled && <CapacityBar filled={filled} capacity={event.capacity} className="[&_>div:last-child]:h-1" />}

          <div className="flex gap-2">
            <a
              href={`${LIVEWIRE_BASE_URL}/events/${event.id}`}
              className={cn(
                "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                cancelled && "border-border bg-muted text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
              )}
            >
              View details
              <ChevronRight className="size-3.5 shrink-0" />
            </a>

            {cancellable && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <TriggerButton
                    variant="outline"
                    size="sm"
                    className="min-h-10 rounded-xl border-red-500/20 px-3 text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/30 active:bg-red-500/15"
                  >
                    Cancel
                  </TriggerButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                    <AlertDialogDescription>This frees your slot for "{event.title}".</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCancel(event.id)}>Cancel registration</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {nearlyFull && !cancelled && <p className="text-xs font-medium text-amber-400">Limited slots remaining</p>}
        </div>
      </div>
    </article>
  );
}
