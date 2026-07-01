import { useMemo, useState } from "react";
import { CalendarX2, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { EventCard } from "../components/EventCard";
import { useAppStore } from "../store/AppStore";
import { isPast } from "../lib/format";

export function EventsBrowse() {
  const { events } = useAppStore();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return events
      .filter((e) => !isPast(e.eventDate))
      .filter((e) =>
        query.trim()
          ? (e.title + e.description + e.venue).toLowerCase().includes(query.toLowerCase())
          : true,
      )
      .sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate));
  }, [events, query]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Browse Events</h1>
        <p className="text-muted-foreground">
          Discover upcoming seminars, workshops and academic events — and secure your slot.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events, venues..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <CalendarX2 className="size-10 text-muted-foreground" />
          <p className="font-medium">No events found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
