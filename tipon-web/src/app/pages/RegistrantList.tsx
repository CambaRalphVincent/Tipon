import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Pencil, Search, UserX, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { TriggerButton } from "../components/TriggerButton";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { StatCard } from "../components/StatCard";
import { CapacityBar } from "../components/CapacityBar";
import {
  AttendanceBadge,
  EventStatusBadge,
} from "../components/StatusBadge";
import { EventFormDialog } from "../components/EventFormDialog";
import { cn } from "../components/ui/utils";
import { formatEventDate, formatEventTime } from "../lib/format";
import { useAppStore } from "../store/AppStore";
import { CalendarDays, CheckCircle2, Users } from "lucide-react";

export function RegistrantList() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { eventById, registrations, userById, confirmedCountFor, recordAttendance } = useAppStore();
  const [query, setQuery] = useState("");

  const event = eventById(id);

  const rows = useMemo(() => {
    return registrations
      .filter((r) => r.eventId === id && r.status === "registered")
      .map((r) => ({ reg: r, user: userById(r.userId)! }))
      .filter((x) => x.user)
      .filter((x) =>
        query.trim()
          ? (x.user.name + x.user.email).toLowerCase().includes(query.toLowerCase())
          : true,
      );
  }, [registrations, id, userById, query]);

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="font-medium">Event not found</p>
        <Button variant="link" asChild>
          <Link to="/organizer/events">Back to manage events</Link>
        </Button>
      </div>
    );
  }

  const filled = confirmedCountFor(event.id);
  const present = rows.filter((x) => x.reg.attendance === "present").length;
  const absent = rows.filter((x) => x.reg.attendance === "absent").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-muted-foreground">
            {formatEventDate(event.eventDate)} · {formatEventTime(event.eventDate)} · {event.venue}
          </p>
        </div>
        <EventFormDialog
          event={event}
          trigger={
            <TriggerButton variant="outline">
              <Pencil className="size-4" /> Edit event
            </TriggerButton>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered" value={`${filled} / ${event.capacity}`} icon={Users} accent="text-primary" />
        <StatCard label="Present" value={present} icon={CheckCircle2} accent="text-emerald-400" />
        <StatCard label="Absent" value={absent} icon={UserX} accent="text-red-400" />
        <StatCard label="Remaining slots" value={Math.max(0, event.capacity - filled)} icon={CalendarDays} accent="text-sky-400" />
      </div>

      <Card>
        <CardContent className="p-5">
          <CapacityBar filled={filled} capacity={event.capacity} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-medium">Registrants ({rows.length})</h2>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search registrants..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead className="hidden md:table-cell">Registered</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No registrants found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ reg, user }) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{user.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatEventDate(reg.createdAt)}
                    </TableCell>
                    <TableCell>
                      <AttendanceBadge status={reg.attendance} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 gap-1",
                            reg.attendance === "present" &&
                              "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
                          )}
                          onClick={() =>
                            recordAttendance(reg.id, reg.attendance === "present" ? "pending" : "present")
                          }
                        >
                          <Check className="size-3.5" /> Present
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 gap-1",
                            reg.attendance === "absent" &&
                              "border-red-500/40 bg-red-500/15 text-red-400",
                          )}
                          onClick={() =>
                            recordAttendance(reg.id, reg.attendance === "absent" ? "pending" : "absent")
                          }
                        >
                          <X className="size-3.5" /> Absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
