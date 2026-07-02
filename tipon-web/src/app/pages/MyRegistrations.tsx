import { useMemo } from "react";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { Button } from "../components/ui/button";
import { TriggerButton } from "../components/TriggerButton";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
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
import {
  AttendanceBadge,
  RegistrationStatusBadge,
} from "../components/StatusBadge";
import { formatEventDate, formatEventTime, isPast } from "../lib/format";
import { LIVEWIRE_BASE_URL } from "../lib/api";
import { useAppStore } from "../store/AppStore";
import type { Registration } from "../data/mockData";

export function MyRegistrations() {
  const { currentUser, registrations, eventById, cancelRegistration } = useAppStore();

  const mine = useMemo(
    () =>
      registrations
        .filter((r) => r.userId === currentUser.id)
        .map((r) => ({ reg: r, event: eventById(r.eventId)! }))
        .filter((x) => x.event)
        .sort((a, b) => +new Date(b.event.eventDate) - +new Date(a.event.eventDate)),
    [registrations, currentUser.id, eventById],
  );

  const upcoming = mine.filter((x) => x.reg.status === "registered" && !isPast(x.event.eventDate));
  const past = mine.filter((x) => isPast(x.event.eventDate) && x.reg.status === "registered");
  const cancelled = mine.filter((x) => x.reg.status === "cancelled");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Registrations</h1>
        <p className="text-muted-foreground">Track the events you've signed up for.</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <RegistrationList items={upcoming} onCancel={cancelRegistration} cancellable />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <RegistrationList items={past} showAttendance />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4">
          <RegistrationList items={cancelled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RegItem {
  reg: Registration;
  event: ReturnType<ReturnType<typeof useAppStore>["eventById"]>;
}

function RegistrationList({
  items,
  onCancel,
  cancellable = false,
  showAttendance = false,
}: {
  items: { reg: Registration; event: NonNullable<RegItem["event"]> }[];
  onCancel?: (eventId: string) => void;
  cancellable?: boolean;
  showAttendance?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <Ticket className="size-9 text-muted-foreground" />
        <p className="font-medium">Nothing here yet</p>
        <Button variant="link" asChild>
          <a href={`${LIVEWIRE_BASE_URL}/events`}>Browse events</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ reg, event }) => (
        <Card key={reg.id} className="overflow-hidden py-0">
          <CardContent className="flex flex-col gap-4 p-0 sm:flex-row">
            <div className="h-32 w-full shrink-0 bg-muted sm:h-auto sm:w-44">
              <ImageWithFallback src={event.cover_image_path} alt={event.title} className="size-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-3 p-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`${LIVEWIRE_BASE_URL}/events/${event.id}`} className="font-medium hover:underline">
                    {event.title}
                  </a>
                  <RegistrationStatusBadge status={reg.status} />
                  {showAttendance && <AttendanceBadge status={reg.attendance} />}
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {formatEventDate(event.eventDate)} · {formatEventTime(event.eventDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {event.venue}
                  </span>
                </div>
              </div>
              {cancellable && onCancel && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`${LIVEWIRE_BASE_URL}/events/${event.id}`}>View</a>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <TriggerButton variant="ghost" size="sm">
                        Cancel
                      </TriggerButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This frees your slot for "{event.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onCancel(event.id)}>
                          Cancel registration
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
