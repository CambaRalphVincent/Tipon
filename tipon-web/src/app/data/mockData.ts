// Mock data + domain types for the Event Registration System prototype.
// Mirrors the DB diagram: users, events, registrations, notifications.

export type UserRole = "participant" | "organizer" | "admin";
export type EventStatus = "open" | "cancelled" | "completed";
export type RegistrationStatus = "registered" | "cancelled";
export type AttendanceStatus = "pending" | "present" | "absent";
export type NotificationType =
  | "registration_confirmed"
  | "participant_registered"
  | "participant_cancelled"
  | "capacity_threshold"
  | "event_full"
  | "upcoming_event_reminder"
  | "attendance_reminder"
  | "event_cancellation_summary"
  | "event_updated"
  | "event_cancelled"
  | "event_reminder";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface EventItem {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  venue: string;
  eventDate: string; // ISO string
  capacity: number;
  status: EventStatus;
  cover_image_path: string;
  registeredCount?: number;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  attendance: AttendanceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  userId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  actionUrl?: string;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const users: User[] = [
  { id: "u-org-1", name: "Dr. Elena Reyes", email: "e.reyes@university.edu", role: "organizer" },
  { id: "u-org-2", name: "Prof. Marcus Cole", email: "m.cole@university.edu", role: "organizer" },
  { id: "u-part-1", name: "Aisha Tan", email: "aisha.tan@student.edu", role: "participant" },
  { id: "u-part-2", name: "Liam Ortega", email: "liam.ortega@student.edu", role: "participant" },
  { id: "u-part-3", name: "Sofia Nakamura", email: "sofia.n@student.edu", role: "participant" },
  { id: "u-part-4", name: "Daniel Okafor", email: "d.okafor@student.edu", role: "participant" },
  { id: "u-part-5", name: "Mia Fernandez", email: "mia.f@student.edu", role: "participant" },
  { id: "u-part-6", name: "Noah Bergstrom", email: "noah.b@student.edu", role: "participant" },
  { id: "u-part-7", name: "Yuki Tanaka", email: "yuki.t@student.edu", role: "participant" },
  { id: "u-part-8", name: "Grace Mensah", email: "grace.m@student.edu", role: "participant" },
];

// Default identities used by the role switcher.
export const DEFAULT_PARTICIPANT_ID = "u-part-1";
export const DEFAULT_ORGANIZER_ID = "u-org-1";

const COVERS = {
  ai: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=1200&q=80",
  data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80",
  startup: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  research: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
  career: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
  cyber: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
  robotics: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
};

const daysFromNow = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(14, 0, 0, 0);
  return date.toISOString();
};

export const events: EventItem[] = [
  {
    id: "ev-1",
    organizerId: "u-org-1",
    title: "Introduction to Machine Learning",
    description:
      "A hands-on seminar covering the foundations of supervised and unsupervised learning, model evaluation, and practical workflows using Python notebooks. Suitable for students new to ML.",
    venue: "Engineering Auditorium A",
    eventDate: daysFromNow(7),
    capacity: 120,
    status: "open",
    cover_image_path: COVERS.ai,
  },
  {
    id: "ev-2",
    organizerId: "u-org-1",
    title: "Data Visualization Workshop",
    description:
      "Learn to build clear, compelling charts and dashboards. We will explore principles of visual encoding and work through real datasets in a guided lab session.",
    venue: "Computer Lab 3",
    eventDate: daysFromNow(3),
    capacity: 30,
    status: "open",
    cover_image_path: COVERS.data,
  },
  {
    id: "ev-3",
    organizerId: "u-org-2",
    title: "UX Design Sprint",
    description:
      "A fast-paced design sprint where teams ideate, prototype, and test a product concept in a single afternoon. Bring a laptop and your creativity.",
    venue: "Design Studio 1",
    eventDate: daysFromNow(10),
    capacity: 24,
    status: "open",
    cover_image_path: COVERS.design,
  },
  {
    id: "ev-4",
    organizerId: "u-org-2",
    title: "Startup Pitch Night",
    description:
      "Student founders present their ventures to a panel of mentors and investors. Open to all who want to learn about entrepreneurship and early-stage fundraising.",
    venue: "Innovation Hub",
    eventDate: daysFromNow(14),
    capacity: 80,
    status: "open",
    cover_image_path: COVERS.startup,
  },
  {
    id: "ev-5",
    organizerId: "u-org-1",
    title: "Research Methods Seminar",
    description:
      "An overview of quantitative and qualitative research methods, study design, and academic writing for undergraduate researchers.",
    venue: "Library Seminar Room 2",
    eventDate: daysFromNow(5),
    capacity: 40,
    status: "open",
    cover_image_path: COVERS.research,
  },
  {
    id: "ev-6",
    organizerId: "u-org-2",
    title: "Career Fair Prep Session",
    description:
      "Polish your resume, practice interview answers, and learn networking strategies ahead of the autumn career fair.",
    venue: "Student Center Hall",
    eventDate: daysFromNow(2),
    capacity: 60,
    status: "open",
    cover_image_path: COVERS.career,
  },
  {
    id: "ev-7",
    organizerId: "u-org-1",
    title: "Cybersecurity Essentials",
    description:
      "Understand common threats, secure coding practices, and how to protect your accounts and data. Includes a live demonstration of basic attacks and defenses.",
    venue: "Engineering Auditorium B",
    eventDate: daysFromNow(9),
    capacity: 100,
    status: "open",
    cover_image_path: COVERS.cyber,
  },
  {
    id: "ev-8",
    organizerId: "u-org-2",
    title: "Robotics Demo Day",
    description:
      "See student-built robots in action, from autonomous navigation to robotic arms. A showcase of the semester's capstone projects.",
    venue: "Robotics Lab",
    eventDate: daysFromNow(-4),
    capacity: 50,
    status: "completed",
    cover_image_path: COVERS.robotics,
  },
  {
    id: "ev-9",
    organizerId: "u-org-1",
    title: "Advanced Deep Learning (Cancelled)",
    description:
      "This advanced seminar has been cancelled due to a scheduling conflict. A rescheduled date will be announced soon.",
    venue: "Engineering Auditorium A",
    eventDate: daysFromNow(12),
    capacity: 60,
    status: "cancelled",
    cover_image_path: COVERS.ai,
  },
];

// Registrations — ev-2 is intentionally at full capacity for the "closed" state.
const buildFullRegistrations = (): Registration[] => {
  const seed: Registration[] = [
    // Participant u-part-1 is already registered for ev-1 and attended ev-8.
    { id: "rg-1", eventId: "ev-1", userId: "u-part-1", status: "registered", attendance: "pending", createdAt: daysFromNow(-2) },
    { id: "rg-2", eventId: "ev-1", userId: "u-part-2", status: "registered", attendance: "pending", createdAt: daysFromNow(-2) },
    { id: "rg-3", eventId: "ev-1", userId: "u-part-3", status: "registered", attendance: "pending", createdAt: daysFromNow(-1) },
    { id: "rg-4", eventId: "ev-1", userId: "u-part-4", status: "registered", attendance: "pending", createdAt: daysFromNow(-1) },
    { id: "rg-5", eventId: "ev-5", userId: "u-part-1", status: "registered", attendance: "pending", createdAt: daysFromNow(-3) },
    { id: "rg-6", eventId: "ev-5", userId: "u-part-5", status: "registered", attendance: "pending", createdAt: daysFromNow(-3) },
    { id: "rg-7", eventId: "ev-8", userId: "u-part-1", status: "registered", attendance: "present", createdAt: daysFromNow(-10) },
    { id: "rg-8", eventId: "ev-8", userId: "u-part-2", status: "registered", attendance: "present", createdAt: daysFromNow(-10) },
    { id: "rg-9", eventId: "ev-8", userId: "u-part-3", status: "registered", attendance: "absent", createdAt: daysFromNow(-9) },
    { id: "rg-10", eventId: "ev-8", userId: "u-part-6", status: "registered", attendance: "present", createdAt: daysFromNow(-9) },
    { id: "rg-11", eventId: "ev-4", userId: "u-part-7", status: "registered", attendance: "pending", createdAt: daysFromNow(-1) },
    { id: "rg-12", eventId: "ev-7", userId: "u-part-8", status: "registered", attendance: "pending", createdAt: daysFromNow(-1) },
  ];

  // Fill ev-2 to its full capacity of 30 so registration is closed.
  const participantIds = users.filter((u) => u.role === "participant").map((u) => u.id);
  for (let i = 0; i < 30; i++) {
    seed.push({
      id: `rg-full-${i}`,
      eventId: "ev-2",
      userId: participantIds[i % participantIds.length],
      status: "registered",
      attendance: "pending",
      createdAt: daysFromNow(-5),
    });
  }
  return seed;
};

export const registrations: Registration[] = buildFullRegistrations();

export const notifications: AppNotification[] = [
  {
    id: "nt-1",
    type: "registration_confirmed",
    userId: "u-part-1",
    title: "Registration confirmed",
    body: "You're registered for \"Introduction to Machine Learning\" on " + new Date(daysFromNow(7)).toLocaleDateString() + ".",
    readAt: null,
    createdAt: daysFromNow(-2),
    actionUrl: "/events/ev-1",
  },
  {
    id: "nt-2",
    type: "event_reminder",
    userId: "u-part-1",
    title: "Upcoming event reminder",
    body: "\"Research Methods Seminar\" is in 5 days. See you at Library Seminar Room 2.",
    readAt: null,
    createdAt: daysFromNow(-1),
    actionUrl: "/events/ev-5",
  },
  {
    id: "nt-3",
    type: "event_updated",
    userId: "u-part-1",
    title: "Event venue updated",
    body: "The venue for \"Introduction to Machine Learning\" is now Engineering Auditorium A.",
    readAt: daysFromNow(-1),
    createdAt: daysFromNow(-1),
    actionUrl: "/events/ev-1",
  },
  {
    id: "nt-org-1",
    type: "participant_registered",
    userId: "u-org-1",
    title: "New registration",
    body: "Aisha Tan registered for \"Introduction to Machine Learning\".",
    readAt: null,
    createdAt: daysFromNow(-1),
    actionUrl: "/organizer/events/ev-1",
  },
  {
    id: "nt-org-2",
    type: "participant_cancelled",
    userId: "u-org-1",
    title: "Registration cancelled",
    body: "Liam Ortega cancelled their registration for \"Data Visualization Workshop\".",
    readAt: daysFromNow(-1),
    createdAt: daysFromNow(-1),
    actionUrl: "/organizer/events/ev-2",
  },
  {
    id: "nt-org-3",
    type: "event_full",
    userId: "u-org-1",
    title: "Event is full",
    body: "\"Data Visualization Workshop\" is now full with 30 of 30 slots taken.",
    readAt: null,
    createdAt: daysFromNow(-1),
    actionUrl: "/organizer/events/ev-2",
  },
];
