import { useMemo } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, CheckCircle2, Users, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TriggerButton } from "../components/TriggerButton";
import { StatCard } from "../components/StatCard";
import { EventFormDialog } from "../components/EventFormDialog";
import { Plus } from "lucide-react";
import { useAppStore } from "../store/AppStore";

export function OrganizerDashboard() {
  const { currentUser, events, registrations, confirmedCountFor } = useAppStore();

  const myEvents = useMemo(
    () => events.filter((e) => e.organizerId === currentUser.id),
    [events, currentUser.id],
  );
  const myEventIds = new Set(myEvents.map((e) => e.id));
  const myRegs = registrations.filter((r) => myEventIds.has(r.eventId) && r.status === "registered");

  const totalCapacity = myEvents.reduce((sum, e) => sum + e.capacity, 0);
  const totalRegistrations = myRegs.length;
  const attendanceRecorded = myRegs.filter((r) => r.attendance !== "pending");
  const present = myRegs.filter((r) => r.attendance === "present").length;
  const attendanceRate =
    attendanceRecorded.length > 0 ? Math.round((present / attendanceRecorded.length) * 100) : 0;

  const barData = myEvents
    .filter((e) => e.status !== "cancelled")
    .map((e) => ({
      name: e.title.length > 16 ? e.title.slice(0, 14) + "…" : e.title,
      Registered: confirmedCountFor(e.id),
      Remaining: Math.max(0, e.capacity - confirmedCountFor(e.id)),
    }));

  const pieData = [
    { name: "Present", value: present, color: "#34d399" },
    { name: "Absent", value: myRegs.filter((r) => r.attendance === "absent").length, color: "#f87171" },
    { name: "Pending", value: myRegs.filter((r) => r.attendance === "pending").length, color: "#64748b" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of your events, registrations and attendance.
          </p>
        </div>
        <EventFormDialog
          trigger={
            <TriggerButton>
              <Plus className="size-4" /> Create event
            </TriggerButton>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active events" value={myEvents.filter((e) => e.status === "open").length} icon={CalendarDays} accent="text-sky-400" />
        <StatCard label="Total registrations" value={totalRegistrations} icon={Users} accent="text-primary" hint={`across ${myEvents.length} events`} />
        <StatCard label="Total capacity" value={totalCapacity} icon={CheckCircle2} accent="text-emerald-400" hint={`${totalCapacity - totalRegistrations} slots remaining`} />
        <StatCard label="Attendance rate" value={`${attendanceRate}%`} icon={UserCheck} accent="text-primary" hint={`${present} present`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registrations vs. remaining capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Registered" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Remaining" stackId="a" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Your events</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/organizer/events">Manage all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {myEvents.slice(0, 5).map((e) => {
            const filled = confirmedCountFor(e.id);
            return (
              <Link
                key={e.id}
                to={`/organizer/events/${e.id}`}
                className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-accent/50"
              >
                <span className="truncate font-medium">{e.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {filled} / {e.capacity} registered
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
