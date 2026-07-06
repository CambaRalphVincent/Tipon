import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Pencil, Search, Users, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
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
import { adaptRegistration, useAppStore } from "../store/AppStore";
import { registrationsApi } from "../lib/api";
import type { Registration, User, UserRole } from "../data/mockData";
import type { ApiRegistration } from "../lib/api";

interface RowItem {
  reg: Registration;
  user: User;
}

function adaptRow(r: ApiRegistration): RowItem | null {
  if (!r.user) return null;
  return {
    reg: adaptRegistration(r),
    user: {
      id: String(r.user.id),
      name: r.user.name,
      email: r.user.email,
      role: "participant" as UserRole,
    },
  };
}

export function RegistrantList() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { eventById, recordAttendance } = useAppStore();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(true);

  const event = eventById(id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    registrationsApi
      .eventRegistrations(id)
      .then((res) => {
        setRows(res.data.map(adaptRow).filter(Boolean) as RowItem[]);
      })
      .catch(() => toast.error("Failed to load registrants."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAttendance = (reg: Registration, next: Registration["attendance"]) => {
    // Optimistic local update for instant UI feedback.
    setRows((prev) =>
      prev.map((x) => (x.reg.id === reg.id ? { ...x, reg: { ...x.reg, attendance: next } } : x)),
    );
    // Store action handles the API call and updates global registrations
    // so the dashboard attendance rate stays in sync.
    recordAttendance(reg.id, next);
  };

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

  const filteredRows = rows.filter((x) =>
    query.trim()
      ? (x.user.name + x.user.email).toLowerCase().includes(query.toLowerCase())
      : true,
  );

  const filled = rows.length;
  const present = rows.filter((x) => x.reg.attendance === "present").length;
  const absent = rows.filter((x) => x.reg.attendance === "absent").length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatEventDate(event.eventDate)} at {formatEventTime(event.eventDate)} - {event.venue}
          </p>
        </div>
        {event.status === "completed" ? (
          <Button variant="outline" disabled>
            Completed event
          </Button>
        ) : (
          <EventFormDialog
            event={event}
            trigger={
              <Button variant="outline">
                <Pencil className="size-4" /> Edit event
              </Button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered" value={`${filled} / ${event.capacity}`} icon={Users} accent="text-primary" />
        <StatCard label="Present" value={present} icon={CheckCircle2} accent="text-emerald-400" />
        <StatCard label="Absent" value={absent} icon={UserX} accent="text-red-400" />
        <StatCard label="Remaining slots" value={Math.max(0, event.capacity - filled)} icon={CalendarDays} accent="text-sky-400" />
      </div>

      <Card className="gap-0">
        <CardContent className="p-4">
          <CapacityBar filled={filled} capacity={event.capacity} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Registrants ({filteredRows.length})</h2>
            <p className="text-xs text-muted-foreground">
              Record attendance for confirmed participants.
            </p>
          </div>
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
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-3 text-xs uppercase tracking-normal text-muted-foreground">
                  Participant
                </TableHead>
                <TableHead className="hidden h-8 px-3 text-xs uppercase tracking-normal text-muted-foreground md:table-cell">
                  Registered
                </TableHead>
                <TableHead className="h-8 px-3 text-xs uppercase tracking-normal text-muted-foreground">
                  Attendance
                </TableHead>
                <TableHead className="h-8 px-3 text-right text-xs uppercase tracking-normal text-muted-foreground">
                  Record
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    Loading registrants...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No registrants found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map(({ reg, user }) => (
                  <TableRow key={reg.id} className="hover:bg-accent/30">
                    <TableCell className="px-3 py-2.5">
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
                    <TableCell className="hidden px-3 py-2.5 text-sm text-muted-foreground md:table-cell">
                      {formatEventDate(reg.createdAt)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <AttendanceBadge status={reg.attendance} />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
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
                            handleAttendance(reg, reg.attendance === "present" ? "pending" : "present")
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
                            handleAttendance(reg, reg.attendance === "absent" ? "pending" : "absent")
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
