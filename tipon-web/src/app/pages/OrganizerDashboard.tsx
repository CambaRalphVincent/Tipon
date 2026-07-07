import { useMemo } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  ListChecks,
  MapPin,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CapacityBar } from "../components/CapacityBar";
import { EventStatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import { compareEventDateTimes, formatEventDate, formatEventTime } from "../lib/format";
import { useAppStore } from "../store/AppStore";

const shortLabel = (value: string, max = 18) =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value;

export function OrganizerDashboard() {
  const { currentUser, events, registrations, confirmedCountFor } = useAppStore();
  const organizerId = currentUser?.id;

  const myEvents = useMemo(
    () =>
      events
        .filter((e) => e.organizerId === organizerId)
        .sort((a, b) => compareEventDateTimes(a.eventDate, b.eventDate)),
    [events, organizerId],
  );
  const activeEvents = myEvents.filter((e) => e.status === "open");
  const myEventIds = new Set(myEvents.map((e) => e.id));
  const activeEventIds = new Set(activeEvents.map((e) => e.id));
  const myRegs = registrations.filter((r) => myEventIds.has(r.eventId) && r.status === "registered");
  const activeRegs = registrations.filter((r) => activeEventIds.has(r.eventId) && r.status === "registered");

  const totalCapacity = activeEvents.reduce((sum, e) => sum + e.capacity, 0);
  const totalRegistrations = myRegs.length;
  const remainingCapacity = Math.max(0, totalCapacity - activeRegs.length);
  const attendanceRecorded = myRegs.filter((r) => r.attendance !== "pending");
  const present = myRegs.filter((r) => r.attendance === "present").length;
  const absent = myRegs.filter((r) => r.attendance === "absent").length;
  const pending = myRegs.filter((r) => r.attendance === "pending").length;
  const attendanceRate =
    attendanceRecorded.length > 0 ? Math.round((present / attendanceRecorded.length) * 100) : 0;

  const barData = myEvents
    .filter((e) => e.status === "open")
    .slice(0, 6)
    .map((e) => ({
      shortName: shortLabel(e.title),
      fullName: e.title,
      Registered: confirmedCountFor(e.id),
      Remaining: Math.max(0, e.capacity - confirmedCountFor(e.id)),
    }));

  const pieData = [
    { name: "Present", value: present, color: "#34d399" },
    { name: "Absent", value: absent, color: "#f87171" },
    { name: "Pending", value: pending, color: "#64748b" },
  ];
  const attendanceSlices = totalRegistrations > 0
    ? pieData
    : [{ name: "No registrations", value: 1, color: "var(--secondary)" }];
  const hasEvents = myEvents.length > 0;
  const featuredEvents = activeEvents.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of your events, registrations and attendance.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/organizer/events">Manage events</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active events" value={activeEvents.length} icon={CalendarDays} accent="text-sky-400" />
        <StatCard label="Total registrations" value={totalRegistrations} icon={Users} accent="text-primary" hint={`across ${myEvents.length} events`} />
        <StatCard label="Total capacity" value={totalCapacity} icon={CheckCircle2} accent="text-emerald-400" hint={`${remainingCapacity} slots remaining`} />
        <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon={UserCheck} accent="text-primary" hint={`${present} present`} />
      </div>

      {hasEvents ? (
        <>
          <Card className="gap-2">
            <CardHeader className="grid-cols-[1fr_auto] items-start gap-3 px-5 pt-4">
              <div>
                <CardTitle>Your events</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Next events ordered by schedule.</p>
              </div>
              <Button variant="outline" size="sm" className="justify-self-end" asChild>
                <Link to="/organizer/events">Manage all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5 px-5">
              {featuredEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  No active upcoming events. Completed and cancelled events remain available in Manage Events.
                </div>
              ) : featuredEvents.map((e) => {
                const filled = confirmedCountFor(e.id);
                return (
                  <Link
                    key={e.id}
                    to={`/organizer/events/${e.id}`}
                    className="grid gap-3 rounded-lg border bg-background/30 px-4 py-2.5 text-sm transition-colors hover:border-primary/35 hover:bg-accent/30 lg:grid-cols-[minmax(0,1fr)_18rem_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-semibold">{e.title}</span>
                        <EventStatusBadge status={e.status} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {formatEventDate(e.eventDate)} at {formatEventTime(e.eventDate)}
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{e.venue}</span>
                        </span>
                      </div>
                    </div>
                    <div className="content-center">
                      <CapacityBar filled={filled} capacity={e.capacity} />
                    </div>
                    <div className="hidden content-center text-primary lg:block">
                      <ArrowRight className="size-4" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
            <Card className="gap-3 xl:col-span-2">
              <CardHeader className="px-5 pt-5">
                <CardTitle>Registrations vs. remaining capacity</CardTitle>
              </CardHeader>
              <CardContent className="px-5">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="shortName" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <Tooltip
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Bar dataKey="Registered" stackId="a" fill="var(--chart-1)" maxBarSize={52} />
                      <Bar dataKey="Remaining" stackId="a" fill="var(--secondary)" maxBarSize={52} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader className="px-5 pt-5">
                <CardTitle>Attendance summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 px-5 sm:grid-cols-[12rem_1fr] xl:grid-cols-[11rem_1fr]">
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={attendanceSlices} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={2}>
                        {attendanceSlices.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="var(--card)" />
                        ))}
                      </Pie>
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)" fontSize={22} fontWeight={600}>
                        {attendanceRate}%
                      </text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="var(--muted-foreground)" fontSize={11}>
                        attendance
                      </text>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--popover-foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid content-center gap-2 text-sm">
                  {pieData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 rounded-md border bg-background/30 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      ) : (
        <Card className="border-dashed border-primary/15">
          <CardContent className="flex min-h-[22rem] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <ListChecks className="size-6" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold tracking-tight">No events yet</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your dashboard charts and attendance summaries will appear after you publish events
                and participants start registering.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/organizer/events">Go to Manage Events</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
