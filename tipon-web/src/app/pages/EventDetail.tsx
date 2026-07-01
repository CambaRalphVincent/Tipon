import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { TriggerButton } from "../components/TriggerButton";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
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
import { CapacityBar } from "../components/CapacityBar";
import { EventStatusBadge } from "../components/StatusBadge";
import { formatEventDate, formatEventTime, isPast } from "../lib/format";
import { useAppStore } from "../store/AppStore";

export function EventDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { eventById, confirmedCountFor, isFull, registrationFor, register, cancelRegistration, userById } =
    useAppStore();

  const event = eventById(id);

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="font-medium">Event not found</p>
        <Button variant="link" asChild>
          <Link to="/events">Back to events</Link>
        </Button>
      </div>
    );
  }

  const filled = confirmedCountFor(event.id);
  const full = isFull(event.id);
  const registered = !!registrationFor(event.id);
  const cancelled = event.status === "cancelled";
  const past = isPast(event.eventDate);
  const organizer = userById(event.organizerId);

  const canRegister = !registered && !full && !cancelled && !past;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="overflow-hidden rounded-xl border">
        <div className="relative aspect-[21/9] bg-muted">
          <ImageWithFallback src={event.cover_image_path} alt={event.title} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 space-y-2 p-6">
            <div className="flex flex-wrap items-center gap-2">
              {cancelled && <EventStatusBadge status="cancelled" />}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-2 font-medium">About this event</h2>
            <p className="leading-relaxed text-muted-foreground">{event.description}</p>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CalendarDays className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{formatEventDate(event.eventDate)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">{formatEventTime(event.eventDate)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <MapPin className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="text-sm font-medium">{event.venue}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Organizer</p>
                  <p className="text-sm font-medium">{organizer?.name ?? "—"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-20">
            <CardContent className="space-y-4 p-5">
              {!cancelled && <CapacityBar filled={filled} capacity={event.capacity} />}

              {registered ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    You're registered
                  </div>
                  {!past && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <TriggerButton variant="outline" className="w-full">
                          Cancel registration
                        </TriggerButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This frees your slot for "{event.title}". You can register again later
                            if space is available.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep registration</AlertDialogCancel>
                          <AlertDialogAction onClick={() => cancelRegistration(event.id)}>
                            Cancel registration
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ) : cancelled ? (
                <Button disabled className="w-full">
                  Event cancelled
                </Button>
              ) : past ? (
                <Button disabled className="w-full">
                  Event has ended
                </Button>
              ) : full ? (
                <div className="space-y-2">
                  <Button disabled className="w-full">
                    Registration closed — full
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    This event has reached maximum capacity.
                  </p>
                </div>
              ) : (
                <Button className="w-full" onClick={() => register(event.id)} disabled={!canRegister}>
                  Register now
                </Button>
              )}

              <p className="text-center text-xs text-muted-foreground">
                {event.capacity} max capacity · {filled} registered
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
