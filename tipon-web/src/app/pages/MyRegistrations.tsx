import { useMemo, useState } from "react";
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
import { compareEventDateTimes, formatEventDate, formatEventTime } from "../lib/format";
import { LIVEWIRE_BASE_URL } from "../lib/api";
import {
  getRegistrationTabSummary,
  getRegistrationTabItems,
  type RegistrationTab,
} from "../lib/myRegistrations";
import { useAppStore } from "../store/AppStore";
import type { EventItem, Registration } from "../data/mockData";

interface RegItem {
  reg: Registration;
  event: EventItem;
}

export function MyRegistrations() {
  const { currentUser, registrations, eventById, cancelRegistration, confirmedCountFor } = useAppStore();
  const currentUserId = currentUser?.id ?? "";
  const [activeTab, setActiveTab] = useState<RegistrationTab>("upcoming");

  const mine = useMemo(
    () =>
      registrations
        .filter((r) => r.userId === currentUserId)
        .map((r) => ({ reg: r, event: eventById(r.eventId) }))
        .filter((x): x is RegItem => Boolean(x.event))
        .sort((a, b) => compareEventDateTimes(b.event.eventDate, a.event.eventDate)),
    [registrations, currentUserId, eventById],
  );

  const tabItems = getRegistrationTabItems(mine);
  const upcoming = tabItems.upcoming;
  const past = tabItems.past;
  const cancelled = tabItems.cancelled;
  const totalActive = upcoming.length;
  const tabSummary = getRegistrationTabSummary(activeTab, {
    upcoming: upcoming.length,
    past: past.length,
    cancelled: cancelled.length,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <div className="mb-1">
          <h1 className="text-[1.75rem] font-extrabold leading-none tracking-tight">My Registrations</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your confirmed events, attendance history, and recent cancellations in one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RegistrationTab)}>
        <TabsList className="h-auto flex-wrap gap-1 bg-foreground/[0.03] p-1">
          <TabsTrigger value="upcoming" className="rounded-lg px-3 py-1.5">
            Upcoming Events ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg px-3 py-1.5">
            Past Events ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-lg px-3 py-1.5">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        {mine.length > 0 && (
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <p>
              {tabSummary}{" "}
              <span className="font-semibold text-foreground">{totalActive}</span> active upcoming events.
            </p>
            {activeTab === "cancelled" && (
              <p>
                Recent cancellations are shown for 24 hours. Registering again removes that event from this tab.
              </p>
            )}
          </div>
        )}

        <TabsContent value="upcoming" className="mt-4">
          {activeTab === "upcoming" && (
            <RegistrationList
              items={upcoming}
              confirmedCountFor={confirmedCountFor}
              onCancel={cancelRegistration}
              cancellable
              emptyTitle="No upcoming events"
              emptyDescription="Events you register for will appear here with date, venue, capacity, and cancellation options."
              showBrowseAction
            />
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {activeTab === "past" && (
            <RegistrationList
              items={past}
              confirmedCountFor={confirmedCountFor}
              showAttendance
              emptyTitle="No completed events yet"
              emptyDescription="After you attend an event, it will move here with your attendance status."
            />
          )}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4">
          {activeTab === "cancelled" && (
            <RegistrationList
              items={cancelled}
              confirmedCountFor={confirmedCountFor}
              emptyTitle="No recent cancellations"
              emptyDescription="Cancelled registrations appear here for 24 hours unless you register for the event again."
            />
          )}
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
  emptyTitle = "No registrations yet",
  emptyDescription = "Browse available events and register for one to start tracking it here.",
  showBrowseAction = false,
}: {
  items: RegItem[];
  confirmedCountFor: (eventId: string) => number;
  onCancel?: (eventId: string) => void;
  cancellable?: boolean;
  showAttendance?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showBrowseAction?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-primary/20 bg-card">
        <div className="flex min-h-[18rem] flex-col items-center justify-center px-6 py-14 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Ticket className="size-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">{emptyTitle}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
          {showBrowseAction && (
            <Button className="mt-6 rounded-xl" asChild>
              <a href={`${LIVEWIRE_BASE_URL}/events`}>
                <CalendarDays className="size-4" /> Browse events
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ reg, event }, index) => (
        <RegistrationCard
          key={reg.id}
          reg={reg}
          event={event}
          priority={index < 3}
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
  priority,
  filled,
  cancellable,
  showAttendance,
  onCancel,
}: {
  reg: Registration;
  event: EventItem;
  priority: boolean;
  filled: number;
  cancellable: boolean;
  showAttendance: boolean;
  onCancel?: (eventId: string) => void;
}) {
  const cancelled = reg.status === "cancelled" || event.status === "cancelled";
  const full = filled >= event.capacity;
  const nearlyFull = event.capacity > 0 && Math.round((filled / event.capacity) * 100) >= 80 && !full;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card transition-all duration-200 [contain-intrinsic-size:24rem] [content-visibility:auto] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl">
      <a href={`${LIVEWIRE_BASE_URL}/events/${event.id}`} className="relative aspect-video overflow-hidden bg-muted">
        <ImageWithFallback
          src={event.cover_image_path}
          alt={event.title}
          width={960}
          height={540}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 via-black/20 to-transparent" />
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
