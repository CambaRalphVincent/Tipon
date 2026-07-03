import { useEffect, useState } from "react";
import { type LucideIcon, Lock, Mail, Search, ShieldCheck, User, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { adminApi, type ApiUser } from "../lib/api";

export function AdminDashboard() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminApi
      .users()
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const handlePromote = async (user: ApiUser) => {
    try {
      const res = await adminApi.promoteUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
      toast.success(`${user.name} promoted to organizer.`);
    } catch {
      toast.error("Failed to promote user.");
    }
  };

  const handleCreateOrganizer = async (data: { name: string; email: string; password: string }) => {
    const res = await adminApi.createOrganizer(data);
    setUsers((prev) => [...prev, res.data]);
  };

  const filtered = users.filter((u) =>
    query.trim() ? (u.name + u.email).toLowerCase().includes(query.toLowerCase()) : true,
  );

  const participantCount = users.filter((u) => u.role === "participant").length;
  const organizerCount = users.filter((u) => u.role === "organizer").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.75rem] font-extrabold leading-none tracking-tight">
              User Management
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              Admin
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage participant and organizer accounts.
          </p>
        </div>
        <CreateOrganizerDialog onCreate={handleCreateOrganizer} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-[30rem] items-center gap-3 rounded-xl border border-primary/10 bg-foreground/[0.03] px-4 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <CountPill icon={Users} label="Participants" value={participantCount} />
          <CountPill icon={ShieldCheck} label="Organizers" value={organizerCount} />
          <CountPill label="Showing" value={filtered.length} />
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border-primary/10 py-0">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
          <h2 className="text-sm font-bold tracking-tight">All Users</h2>
          <p className="text-xs text-muted-foreground">
            {users.length} total account{users.length === 1 ? "" : "s"}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/[0.02] hover:bg-foreground/[0.02]">
              <TableHead className="px-4 py-3 sm:px-5">Name</TableHead>
              <TableHead className="hidden px-4 py-3 sm:table-cell">Email</TableHead>
              <TableHead className="px-4 py-3">Role</TableHead>
              <TableHead className="hidden px-4 py-3 md:table-cell">Joined</TableHead>
              <TableHead className="px-4 py-3 text-right sm:px-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 py-4 font-bold sm:px-5">{user.name}</TableCell>
                    <TableCell className="hidden px-4 py-4 text-sm text-muted-foreground sm:table-cell">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant={user.role === "organizer" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden px-4 py-4 text-sm text-muted-foreground md:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right sm:px-5">
                      {user.role === "participant" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl">
                              Promote
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Promote to organizer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.name} will be able to create and manage events. They will
                                lose participant access, including any existing registrations, and
                                will no longer be able to register for events.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePromote(user)}>
                                Promote
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CountPill({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-foreground/[0.03] px-3 py-1.5">
      {Icon && <Icon className="size-3.5 text-primary" />}
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

function CreateOrganizerDialog({
  onCreate,
}: {
  onCreate: (data: { name: string; email: string; password: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ name, email, password });
      toast.success(`Organizer account created for ${name}.`);
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
    } catch {
      toast.error("Failed to create organizer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <UserPlus className="size-4" /> New Organizer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organizer account</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="co-name">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="co-name"
                className="pl-9"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="co-email"
                type="email"
                className="pl-9"
                placeholder="organizer@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-password">Temporary password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="co-password"
                type="password"
                className="pl-9"
                placeholder="Min. 8 chars, upper/lowercase, number, symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Must include an uppercase letter, a lowercase letter, a number, and a symbol.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create organizer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
