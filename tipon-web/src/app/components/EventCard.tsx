import { useNavigate } from "react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CapacityBar } from "./CapacityBar";
import { EventStatusBadge } from "./StatusBadge";
import { formatEventDate, formatEventTime } from "../lib/format";
import { useAppStore } from "../store/AppStore";
import type { EventItem } from "../data/mockData";

export function EventCard({
  event,
  loading = "eager",
}: {
  event: EventItem;
  loading?: "eager" | "lazy";
}) {
  const navigate = useNavigate();
  const { confirmedCountFor, isFull, registrationFor } = useAppStore();

  const filled = confirmedCountFor(event.id);
  const full = isFull(event.id);
  const registered = !!registrationFor(event.id);
  const cancelled = event.status === "cancelled";
  const completed = event.status === "completed";

  return (
    <Card className="group overflow-hidden pt-0 transition-colors hover:border-primary/40">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <ImageWithFallback
          src={event.cover_image_path}
          alt={event.title}
          loading={loading}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {(cancelled || completed || full || registered) && (
          <div className="absolute right-3 top-3">
            {cancelled || completed ? (
              <EventStatusBadge status={event.status} />
            ) : registered ? (
              <Badge className="bg-primary text-primary-foreground">Registered</Badge>
            ) : (
              <Badge variant="outline" className="border-red-500/30 bg-red-500/15 text-red-400">
                Full
              </Badge>
            )}
          </div>
        )}
      </div>

      <CardContent className="space-y-3">
        <h3 className="line-clamp-1 font-medium">{event.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            <span>
              {formatEventDate(event.eventDate)} · {formatEventTime(event.eventDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>
        {!cancelled && !completed && <CapacityBar filled={filled} capacity={event.capacity} />}
      </CardContent>

      <CardFooter>
        <Button className="w-full" variant="outline" onClick={() => navigate(`/events/${event.id}`)}>
          View details
        </Button>
      </CardFooter>
    </Card>
  );
}
