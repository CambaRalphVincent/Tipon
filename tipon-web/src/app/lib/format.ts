// Small formatting helpers shared across pages.

const EVENT_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/;

export function parseEventDateTime(value: string): Date {
  const normalized = value
    .trim()
    .replace(" ", "T")
    .replace(/\.\d+/, "")
    .replace(EVENT_TIMEZONE_SUFFIX, "");

  return new Date(normalized.length === 10 ? `${normalized}T00:00:00` : normalized);
}

export function toEventDateTimePayload(date: string, time: string): string {
  const eventTime = time || "14:00";
  return `${date}T${eventTime.length === 5 ? `${eventTime}:00` : eventTime}`;
}

export function toEventDateTimeInputParts(value: string): { date: string; time: string } {
  const parsed = parseEventDateTime(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

export function compareEventDateTimes(a: string, b: string): number {
  return parseEventDateTime(a).getTime() - parseEventDateTime(b).getTime();
}

export function formatEventDate(iso: string): string {
  return parseEventDateTime(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTime(iso: string): string {
  return parseEventDateTime(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function isPast(iso: string): boolean {
  return parseEventDateTime(iso).getTime() < Date.now();
}
