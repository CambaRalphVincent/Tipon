import { Bell, BellRing, CalendarClock, CheckCircle2, Info, Users, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { TriggerButton } from "./TriggerButton";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";
import { formatRelative } from "../lib/format";
import { getNotificationsForUser, getUnreadNotificationCount } from "../lib/notifications";
import { LIVEWIRE_BASE_URL } from "../lib/api";
import { useAppStore } from "../store/AppStore";
import type { AppNotification, NotificationType } from "../data/mockData";

const ICONS: Record<NotificationType, typeof Info> = {
  registration_confirmed: CheckCircle2,
  participant_registered: CheckCircle2,
  participant_cancelled: XCircle,
  capacity_threshold: Users,
  event_full: Users,
  upcoming_event_reminder: CalendarClock,
  attendance_reminder: CheckCircle2,
  event_cancellation_summary: XCircle,
  event_updated: Info,
  event_cancelled: XCircle,
  event_reminder: CalendarClock,
};

const ICON_COLOR: Record<NotificationType, string> = {
  registration_confirmed: "text-emerald-400",
  participant_registered: "text-emerald-400",
  participant_cancelled: "text-red-400",
  capacity_threshold: "text-amber-400",
  event_full: "text-emerald-400",
  upcoming_event_reminder: "text-amber-400",
  attendance_reminder: "text-sky-400",
  event_cancellation_summary: "text-red-400",
  event_updated: "text-sky-400",
  event_cancelled: "text-red-400",
  event_reminder: "text-amber-400",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } =
    useAppStore();

  const mine: AppNotification[] = getNotificationsForUser(notifications, currentUser?.id);
  const unread = getUnreadNotificationCount(mine);
  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationRead(notification.id);

    if (!notification.actionUrl) {
      return;
    }

    if (notification.actionUrl.startsWith("/events")) {
      window.location.href = `${LIVEWIRE_BASE_URL}${notification.actionUrl}`;
      return;
    }

    navigate(notification.actionUrl);
  };

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
      <PopoverContent align="end" className="w-80 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-medium">Notifications</p>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllNotificationsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[min(22rem,calc(100vh-6rem))] overflow-y-auto overscroll-contain">
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
                      onClick={() => handleNotificationClick(n)}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
