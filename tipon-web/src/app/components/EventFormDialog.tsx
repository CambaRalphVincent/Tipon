import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadApi } from "../lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { cn } from "./ui/utils";
import { useAppStore } from "../store/AppStore";
import type { EventItem } from "../data/mockData";

interface FormState {
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  capacity: number;
  cover_image_path: string;
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80";

const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

const emptyForm: FormState = {
  title: "",
  description: "",
  venue: "",
  date: "",
  time: "14:00",
  capacity: 50,
  cover_image_path: "",
};

function toFormState(event: EventItem): FormState {
  const d = new Date(event.eventDate);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    title: event.title,
    description: event.description,
    venue: event.venue,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    capacity: event.capacity,
    cover_image_path: event.cover_image_path,
  };
}

export function EventFormDialog({
  trigger,
  event,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode;
  event?: EventItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { currentUser, events, createEvent, updateEvent } = useAppStore();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (o: boolean) => {
    if (!isControlled) setUncontrolledOpen(o);
    onOpenChange?.(o);
  };

  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  // Track locally-created object URLs so we can revoke them on close.
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!event;

  useEffect(() => {
    if (open) {
      setForm(event ? toFormState(event) : emptyForm);
    } else {
      // Revoke any object URL created during this session.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    }
  }, [open, event]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!ALLOWED_THUMBNAIL_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }

    // Show a local preview immediately while the upload runs.
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const blobUrl = URL.createObjectURL(file);
    objectUrlRef.current = blobUrl;
    set("cover_image_path", blobUrl);

    // Upload to server in the background.
    setUploading(true);
    uploadApi
      .image(file)
      .then((res) => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
        set("cover_image_path", res.data.url);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Image upload failed. Please try again.";
        toast.error(msg);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
        set("cover_image_path", "");
      })
      .finally(() => setUploading(false));
  };

  const clearThumbnail = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    set("cover_image_path", "");
  };

  const isDuplicateTitle = events.some(
    (e) =>
      e.organizerId === currentUser?.id &&
      e.status === "open" &&
      e.id !== event?.id &&
      e.title?.trim().toLowerCase() === form.title.trim().toLowerCase(),
  );

  const valid =
    form.title.trim() &&
    form.venue.trim() &&
    form.date &&
    form.capacity > 0 &&
    !uploading &&
    !isDuplicateTitle;

  const submit = () => {
    if (!valid) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      venue: form.venue.trim(),
      eventDate: new Date(`${form.date}T${form.time || "14:00"}`).toISOString(),
      capacity: Number(form.capacity),
      cover_image_path: form.cover_image_path || DEFAULT_COVER,
    };
    if (isEdit && event) updateEvent(event.id, payload);
    else createEvent(payload);
    setOpen(false);
  };

  const preview = form.cover_image_path;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details below. Registered participants will be notified."
              : "Set the details and capacity for your new event."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Thumbnail uploader */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
                <img src={preview} alt="Thumbnail preview" className="size-full object-cover" />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                )}
                {!uploading && (
                  <>
                    <button
                      type="button"
                      onClick={clearThumbnail}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                      aria-label="Remove thumbnail"
                    >
                      <X className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-black/80"
                    >
                      Change
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center justify-center gap-2",
                  "rounded-lg border-2 border-dashed border-border bg-muted/30 py-8",
                  "text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <ImagePlus className="size-8" />
                <span className="text-sm font-medium">Click to upload thumbnail</span>
                <span className="text-xs">PNG, JPG, or WEBP — up to 2 MB</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title</Label>
              <span
                className={cn(
                  "text-xs",
                  form.title.length >= MAX_TITLE_LENGTH ? "text-red-500" : "text-muted-foreground",
                )}
              >
                {form.title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Introduction to Machine Learning"
              maxLength={MAX_TITLE_LENGTH}
            />
            {isDuplicateTitle && (
              <p className="text-xs text-red-500">
                You already have an active event with this title. Cancel that event first, or
                choose a different title.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span
                className={cn(
                  "text-xs",
                  form.description.length >= MAX_DESCRIPTION_LENGTH ? "text-red-500" : "text-muted-foreground",
                )}
              >
                {form.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this event about?"
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Auditorium A" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set("capacity", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>
            {uploading ? (
              <><Loader2 className="size-4 animate-spin" /> Uploading…</>
            ) : isEdit ? "Save changes" : "Create event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
