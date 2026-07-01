import { Bell, BellRing, CalendarClock, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { TriggerButton } from "./TriggerButton";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "./ui/utils";
import { formatRelative } from "../lib/format";
import { useAppStore } from "../store/AppStore";
import type { AppNotification, NotificationType } from "../data/mockData";

const ICONS: Record<NotificationType, typeof Info> = {
  registration_confirmed: CheckCircle2,
  event_updated: Info,
  event_cancelled: XCircle,
  event_reminder: CalendarClock,
};

const ICON_COLOR: Record<NotificationType, string> = {
  registration_confirmed: "text-emerald-400",
  event_updated: "text-sky-400",
  event_cancelled: "text-red-400",
  event_reminder: "text-amber-400",
};

export function NotificationBell() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } =
    useAppStore();

  const mine: AppNotification[] = notifications
    .filter((n) => n.userId === (currentUser?.id ?? ""))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const unread = mine.filter((n) => !n.readAt).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <TriggerButton variant="ghost" size="icon" className="relative" aria-label="Notifications">
          {unread > 0 ? <BellRing className="size-5" /> : <Bell className="size-5" />}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unread}
            </span>
          )}
        </TriggerButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-medium">Notifications</p>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllNotificationsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {mine.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y">
              {mine.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => markNotificationRead(n.id)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                        !n.readAt && "bg-accent/40",
                      )}
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", ICON_COLOR[n.type])} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{n.title}</p>
                          {!n.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
