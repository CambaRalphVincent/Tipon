import type { EventItem } from "../data/mockData";
import { compareEventDateTimes, isPast } from "./format";

export function getVisibleBrowseEvents(events: EventItem[], query: string): EventItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return events
    .filter((event) => !isPast(event.eventDate))
    .filter((event) =>
      normalizedQuery
        ? `${event.title} ${event.description} ${event.venue}`.toLowerCase().includes(normalizedQuery)
        : true,
    )
    .sort((a, b) => compareEventDateTimes(a.eventDate, b.eventDate));
}

export function hasDuplicateOpenEventTitleForOrganizer(
  events: EventItem[],
  organizerId: string | undefined,
  title: string,
  currentEventId?: string,
): boolean {
  const normalizedTitle = title.trim().toLowerCase();
  if (!organizerId || !normalizedTitle) return false;

  return events.some(
    (event) =>
      event.organizerId === organizerId &&
      event.status === "open" &&
      event.id !== currentEventId &&
      event.title.trim().toLowerCase() === normalizedTitle,
  );
}
