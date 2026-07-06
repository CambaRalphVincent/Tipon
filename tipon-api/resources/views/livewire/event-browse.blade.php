<div class="mx-auto max-w-7xl space-y-6">
    <div>
        <div class="mb-1">
            <h1 class="text-[1.75rem] font-extrabold leading-none tracking-tight">Browse Events</h1>
        </div>
        <p class="text-sm text-muted-foreground">Discover upcoming seminars, workshops and academic events - and secure your slot.</p>
    </div>

    <form method="GET" action="/events" class="flex max-w-[30rem] items-center gap-3 rounded-xl border border-primary/10 bg-foreground/[0.03] px-4 py-2.5">
        <button type="submit" class="text-muted-foreground transition-colors hover:text-primary" aria-label="Search events">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
        </button>
        <input
            type="text"
            name="q"
            value="{{ $query }}"
            wire:model.live.debounce.300ms="query"
            placeholder="Search events, venues..."
            class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        >
    </form>

    @if (! $this->events->isEmpty())
        <p class="text-xs text-muted-foreground">
            Showing <span class="font-semibold text-foreground">{{ $this->events->count() }}</span>
            event{{ $this->events->count() === 1 ? '' : 's' }}
        </p>
    @endif

    @if ($this->events->isEmpty())
        <div class="flex min-h-[20rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-20 text-center">
            <div class="flex size-10 items-center justify-center text-muted-foreground">
                @if (trim($query) === '')
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-10"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9.5 14.5 5 5" /><path d="m14.5 14.5-5 5" /></svg>
                @else
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-10"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /><path d="m8.5 8.5 5 5" /><path d="m13.5 8.5-5 5" /></svg>
                @endif
            </div>
            <div class="space-y-1">
                <p class="font-medium">{{ trim($query) === '' ? 'No events yet' : 'No events found' }}</p>
                <p class="text-sm text-muted-foreground">
                    {{ trim($query) === '' ? 'Upcoming events will appear here once organizers publish them.' : 'Try adjusting your search.' }}
                </p>
            </div>
        </div>
    @else
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($this->events as $event)
                @php
                    $filled = $event->registered_count;
                    $capacity = $event->capacity;
                    $pct = $capacity > 0 ? min(100, round(($filled / $capacity) * 100)) : 0;
                    $full = $filled >= $capacity;
                    $nearlyFull = $pct >= 80 && !$full;
                    $barColor = $full ? 'bg-red-500' : ($nearlyFull ? 'bg-amber-500' : 'bg-emerald-500');
                    $registered = in_array($event->id, $this->myRegisteredEventIds);
                @endphp
                <a
                    wire:key="event-{{ $event->id }}"
                    href="/events/{{ $event->id }}"
                    class="group flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card transition-colors duration-200 [contain-intrinsic-size:24rem] [content-visibility:auto] hover:border-primary/30"
                >
                    <div class="relative aspect-video overflow-hidden bg-muted">
                        <img
                            src="{{ $event->cover_image_path }}"
                            alt="{{ $event->title }}"
                            width="960"
                            height="540"
                            loading="{{ $loop->iteration <= 3 ? 'eager' : 'lazy' }}"
                            decoding="async"
                            fetchpriority="{{ $loop->iteration <= 3 ? 'high' : 'low' }}"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            class="size-full object-cover"
                        >
                        @if ($event->status === 'cancelled')
                            <span class="absolute right-3 top-3 inline-flex items-center rounded-full border border-red-300/30 bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-black/25">Cancelled</span>
                        @elseif ($registered)
                            <span class="absolute right-3 top-3 inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-black/20">Registered</span>
                        @elseif ($full)
                            <span class="absolute right-3 top-3 inline-flex items-center rounded-full border border-red-300/30 bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-black/25">Full</span>
                        @endif
                    </div>
                    <div class="flex flex-1 flex-col gap-3 p-5">
                        <div>
                            <h3 class="mb-1 line-clamp-1 font-bold leading-tight tracking-tight">{{ $event->title }}</h3>
                            <p class="line-clamp-2 text-sm text-muted-foreground">{{ $event->description }}</p>
                        </div>
                        <div class="flex flex-col gap-1.5 text-xs text-muted-foreground">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0 text-primary"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                                {{ $event->event_date->format('M j, Y \a\t g:i A') }}
                            </div>
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0 text-primary"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                                {{ $event->venue }}
                            </div>
                        </div>
                        <div class="mt-auto flex flex-col gap-3 pt-2">
                            @if ($event->status !== 'cancelled')
                                <div class="space-y-1.5">
                                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                                        <span><span class="font-semibold text-foreground">{{ $filled }}</span> / {{ $capacity }} registered</span>
                                        <span class="{{ $full ? 'text-red-400' : ($nearlyFull ? 'text-amber-400' : '') }}">
                                            {{ $full ? 'Full' : ($capacity - $filled) . ' left' }}
                                        </span>
                                    </div>
                                    <div class="h-1 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
                                        <div class="h-full rounded-full transition-all {{ $barColor }}" style="width: {{ $pct }}%"></div>
                                    </div>
                                </div>
                            @endif
                            <div class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                View details
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </div>
                    </div>
                </a>
            @endforeach
        </div>
    @endif
</div>
