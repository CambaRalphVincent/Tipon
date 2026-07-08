import type { EventItem, Registration } from "../data/mockData";
import { isPast } from "./format";

export type RegistrationTab = "upcoming" | "past" | "cancelled";

export interface RegistrationWithEvent {
  reg: Registration;
}

export interface RegistrationWithFullEvent extends RegistrationWithEvent {
  event: EventItem;
}

export function getVisibleCancelledRegistrationItems<T extends RegistrationWithEvent>(
  items: T[],
  nowMs = Date.now(),
): T[] {
  const activeEventIds = new Set(
    items.filter((x) => x.reg.status === "registered").map((x) => x.reg.eventId),
  );
  const recentCancellationCutoff = nowMs - 24 * 60 * 60 * 1000;

  return Array.from(
    items
      .filter((x) => {
        const cancelledAt = x.reg.updatedAt ?? x.reg.createdAt;

        return (
          x.reg.status === "cancelled" &&
          !activeEventIds.has(x.reg.eventId) &&
          new Date(cancelledAt).getTime() >= recentCancellationCutoff
        );
      })
      .sort(
        (a, b) =>
          +new Date(b.reg.updatedAt ?? b.reg.createdAt) -
          +new Date(a.reg.updatedAt ?? a.reg.createdAt),
      )
      .reduce((itemsByEvent, item) => {
        if (!itemsByEvent.has(item.reg.eventId)) {
          itemsByEvent.set(item.reg.eventId, item);
        }

        return itemsByEvent;
      }, new Map<string, T>())
      .values(),
  );
}

export function getRegistrationTabSummary(
  activeTab: RegistrationTab,
  counts: Record<RegistrationTab, number>,
): string {
  if (activeTab === "upcoming") {
    return `Showing ${counts.upcoming} upcoming event${counts.upcoming === 1 ? "" : "s"}.`;
  }

  if (activeTab === "past") {
    return `Showing ${counts.past} past event${counts.past === 1 ? "" : "s"}.`;
  }

  return `Showing ${counts.cancelled} recent cancellation${counts.cancelled === 1 ? "" : "s"}.`;
}

export function getRegistrationTabItems<T extends RegistrationWithFullEvent>(
  items: T[],
  nowMs = Date.now(),
): Record<RegistrationTab, T[]> {
  return {
    upcoming: items.filter(
      (x) => x.reg.status === "registered" && x.event.status === "open" && !isPast(x.event.eventDate),
    ),
    past: items.filter(
      (x) => x.reg.status === "registered" && (x.event.status === "completed" || isPast(x.event.eventDate)),
    ),
    cancelled: getVisibleCancelledRegistrationItems(items, nowMs),
  };
}
