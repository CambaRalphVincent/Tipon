<?php

use App\Models\Event;
use App\Models\Registration;
use App\Notifications\RegistrationStatusNotification;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Computed;
use Livewire\Component;

new class extends Component
{
    public Event $event;

    public function mount(Event $event)
    {
        $this->event = $event;
    }

    #[Computed]
    public function registeredCount()
    {
        return $this->event->registrations()->where('status', 'registered')->count();
    }

    #[Computed]
    public function myRegistration()
    {
        return $this->event->registrations()
            ->where('user_id', auth()->id())
            ->where('status', 'registered')
            ->first();
    }

    #[Computed]
    public function isFull()
    {
        return $this->registeredCount >= $this->event->capacity;
    }

    #[Computed]
    public function isPast()
    {
        return $this->event->event_date->isPast();
    }

    // Mirrors RegistrationController::store()'s capacity-safe logic — the
    // event row is locked inside a transaction so concurrent registrations
    // (from this page or the React app) can't overbook the event.
    public function register()
    {
        if ($this->event->status !== 'open') {
            session()->flash('error', 'Event is not open for registration.');
            return;
        }

        if ($this->myRegistration) {
            session()->flash('error', 'You are already registered for this event.');
            return;
        }

        try {
            DB::transaction(function () {
                $locked = Event::lockForUpdate()->findOrFail($this->event->id);

                if ($locked->registrations()->where('status', 'registered')->count() >= $locked->capacity) {
                    throw new \RuntimeException('Event is at full capacity.');
                }

                Registration::create([
                    'event_id' => $locked->id,
                    'user_id'  => auth()->id(),
                    'status'   => 'registered',
                ]);
            });
        } catch (\RuntimeException $e) {
            session()->flash('error', $e->getMessage());
            unset($this->registeredCount, $this->isFull, $this->myRegistration);
            return;
        }

        auth()->user()->notify(new RegistrationStatusNotification($this->event, 'registered'));

        unset($this->registeredCount, $this->isFull, $this->myRegistration);
        session()->flash('success', 'You have successfully registered for this event.');
    }

    public function cancelRegistration()
    {
        $registration = $this->myRegistration;

        if (! $registration) {
            return;
        }

        $registration->update(['status' => 'cancelled']);

        auth()->user()->notify(new RegistrationStatusNotification($this->event, 'cancelled'));

        unset($this->registeredCount, $this->isFull, $this->myRegistration);
        session()->flash('success', 'Your registration has been cancelled.');
    }
};
?>

<div class="w-full max-w-none space-y-6" x-data="{ showCancelConfirm: false, showRegisterConfirm: false }">
    <a wire:navigate href="/events" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
        Back to events
    </a>

    @if (session('success'))
        <div class="rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{{ session('success') }}</div>
    @endif
    @if (session('error'))
        <div class="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">{{ session('error') }}</div>
    @endif

    @php
        $filled = $this->registeredCount;
        $capacity = $event->capacity;
        $pct = $capacity > 0 ? min(100, round(($filled / $capacity) * 100)) : 0;
        $nearlyFull = $pct >= 80 && !$this->isFull;
        $barColor = $this->isFull ? 'bg-red-500' : ($nearlyFull ? 'bg-amber-500' : 'bg-emerald-500');
        $registered = (bool) $this->myRegistration;
    @endphp

    <div class="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start">
        {{-- Left: main content --}}
        <div class="min-w-0 flex-1 space-y-7">
            {{-- Hero banner --}}
            <div class="relative overflow-hidden rounded-2xl border border-primary/10" style="height: 260px">
                <img src="{{ $event->cover_image_path }}" alt="{{ $event->title }}" class="absolute inset-0 size-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 space-y-2 px-6 pb-5">
                    <div class="flex items-center gap-2">
                        @if ($event->status === 'cancelled')
                            <span class="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">Cancelled</span>
                        @elseif ($registered)
                            <span class="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-2.5 shrink-0"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg>
                                Registered
                            </span>
                        @elseif ($this->isFull)
                            <span class="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">Full</span>
                        @endif
                    </div>
                    <h1 class="text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl" style="font-family: 'Bricolage Grotesque', sans-serif;">{{ $event->title }}</h1>
                </div>
            </div>

            {{-- About --}}
            <section class="rounded-2xl border border-primary/10 bg-card/40 p-5">
                <h2 class="mb-3 text-lg font-bold tracking-tight" style="font-family: 'Bricolage Grotesque', sans-serif;">About this event</h2>
                <p class="max-w-[82ch] whitespace-pre-line text-base leading-8 text-muted-foreground">{{ $event->description }}</p>
            </section>

            {{-- Info grid --}}
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="flex items-start gap-3 rounded-xl border border-primary/10 bg-foreground/[0.03] p-4">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
                    </div>
                    <div>
                        <p class="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                        <p class="text-sm font-semibold">{{ $event->event_date->format('l, F j, Y') }}</p>
                    </div>
                </div>
                <div class="flex items-start gap-3 rounded-xl border border-primary/10 bg-foreground/[0.03] p-4">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    </div>
                    <div>
                        <p class="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</p>
                        <p class="text-sm font-semibold">{{ $event->event_date->format('g:i A') }}</p>
                    </div>
                </div>
                <div class="flex items-start gap-3 rounded-xl border border-primary/10 bg-foreground/[0.03] p-4">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div>
                        <p class="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Venue</p>
                        <p class="text-sm font-semibold">{{ $event->venue }}</p>
                    </div>
                </div>
                <div class="flex items-start gap-3 rounded-xl border border-primary/10 bg-foreground/[0.03] p-4">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" /></svg>
                    </div>
                    <div>
                        <p class="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organizer</p>
                        <p class="text-sm font-semibold">{{ $event->organizer->name ?? '—' }}</p>
                    </div>
                </div>
            </div>
        </div>

        {{-- Right: registration panel --}}
        <div class="w-full shrink-0 space-y-4 lg:sticky lg:top-24">
            <div class="overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-xl">
                @if ($event->status !== 'cancelled')
                    <div class="space-y-1.5 border-b border-primary/10 px-5 pb-4 pt-5">
                        <div class="mb-1 flex items-end justify-between">
                            <div>
                                <p class="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seats filled</p>
                                <p class="text-3xl font-extrabold leading-none tracking-tight {{ $this->isFull ? 'text-red-400' : '' }}" style="font-family: 'Bricolage Grotesque', sans-serif;">
                                    {{ $filled }}<span class="text-base font-medium text-muted-foreground"> / {{ $capacity }}</span>
                                </p>
                            </div>
                            <div class="text-right">
                                @if ($this->isFull)
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-auto size-5 text-red-400"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                @else
                                    <p class="text-xl font-bold leading-none text-primary" style="font-family: 'Bricolage Grotesque', sans-serif;">{{ $capacity - $filled }}</p>
                                    <p class="text-xs text-muted-foreground">spots left</p>
                                @endif
                            </div>
                        </div>
                        <div class="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]">
                            <div class="h-full rounded-full transition-all {{ $barColor }}" style="width: {{ $pct }}%"></div>
                        </div>
                        <p class="text-right text-xs text-muted-foreground">{{ $pct }}% full</p>
                    </div>
                @endif

                <div class="space-y-3 px-5 py-4">
                    @if ($registered)
                        <div class="flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 py-3 text-sm font-semibold text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M21.801 10A10 10 0 1 1 17 3.335" /><path d="m9 11 3 3L22 4" /></svg>
                            You're registered
                        </div>
                        @if (! $this->isPast)
                            <button
                                @click="showCancelConfirm = true"
                                class="w-full rounded-xl border border-red-500/15 bg-red-500/[0.08] py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15"
                            >
                                Cancel registration
                            </button>
                        @endif
                    @elseif ($event->status === 'cancelled')
                        <div class="flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-foreground/[0.04] py-3 text-sm font-semibold text-muted-foreground">Event cancelled</div>
                    @elseif ($this->isPast)
                        <div class="flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-foreground/[0.04] py-3 text-sm font-semibold text-muted-foreground">Event has ended</div>
                    @elseif ($this->isFull)
                        <div class="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-foreground/[0.04] py-3 text-sm font-semibold text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            Registration closed
                        </div>
                    @else
                        <button
                            @click="showRegisterConfirm = true"
                            class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] hover:bg-primary/90"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
                            Register now
                        </button>
                    @endif

                    <div class="flex flex-col gap-2 border-t border-primary/10 pt-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-muted-foreground">Capacity</span>
                            <span class="text-xs font-semibold">{{ $capacity }} seats</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-muted-foreground">Reg. closes</span>
                            <span class="text-xs font-semibold">{{ $event->event_date->format('M j, Y') }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Cancel-registration confirmation: styled to match the app's dark dialog pattern. --}}
    <div x-show="showCancelConfirm" x-cloak class="fixed inset-0 z-50">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-[2px]" @click="showCancelConfirm = false"></div>
        <div class="fixed left-[50%] top-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-2xl sm:max-w-[30rem]">
            <div class="space-y-4 p-6">
                <div class="space-y-2">
                    <div class="flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
                    </div>
                    <h2 class="text-xl font-bold tracking-tight" style="font-family: 'Bricolage Grotesque', sans-serif;">Cancel your registration?</h2>
                    <p class="text-sm leading-relaxed text-muted-foreground">
                        Your slot for <span class="font-medium text-foreground">"{{ $event->title }}"</span> will be released. You can register again later if space is available.
                    </p>
                </div>
                <div class="rounded-xl border border-primary/10 bg-foreground/[0.03] px-4 py-3 text-sm text-muted-foreground">
                    <p class="font-medium text-foreground">{{ $event->event_date->format('M j, Y \a\t g:i A') }}</p>
                    <p>{{ $event->venue }}</p>
                </div>
            </div>
            <div class="flex flex-col-reverse gap-2 border-t border-primary/10 bg-foreground/[0.02] p-4 sm:flex-row sm:justify-end">
                <button
                    @click="showCancelConfirm = false"
                    class="inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/10 hover:bg-accent hover:text-foreground focus-visible:border-primary/30 focus-visible:text-foreground"
                >
                    Keep registration
                </button>
                <button
                    wire:click="cancelRegistration"
                    @click="showCancelConfirm = false"
                    class="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/15 focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                    Cancel registration
                </button>
            </div>
        </div>
    </div>

    {{-- Register confirmation: confirms the commitment and repeats the event details. --}}
    <div x-show="showRegisterConfirm" x-cloak class="fixed inset-0 z-50">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-[2px]" @click="showRegisterConfirm = false"></div>
        <div class="fixed left-[50%] top-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-2xl sm:max-w-[30rem]">
            <div class="space-y-4 p-6">
                <div class="space-y-2">
                    <div class="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
                    </div>
                    <h2 class="text-xl font-bold tracking-tight" style="font-family: 'Bricolage Grotesque', sans-serif;">Register for this event?</h2>
                    <p class="text-sm leading-relaxed text-muted-foreground">
                        You're reserving a seat for <span class="font-medium text-foreground">"{{ $event->title }}"</span>. You can cancel your registration later if your plans change.
                    </p>
                </div>
                <div class="rounded-xl border border-primary/10 bg-foreground/[0.03] px-4 py-3 text-sm text-muted-foreground">
                    <p class="font-medium text-foreground">{{ $event->event_date->format('M j, Y \a\t g:i A') }}</p>
                    <p>{{ $event->venue }}</p>
                </div>
            </div>
            <div class="flex flex-col-reverse gap-2 border-t border-primary/10 bg-foreground/[0.02] p-4 sm:flex-row sm:justify-end">
                <button
                    @click="showRegisterConfirm = false"
                    class="inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/10 hover:bg-accent hover:text-foreground focus-visible:border-primary/30 focus-visible:text-foreground"
                >
                    Cancel
                </button>
                <button
                    wire:click="register"
                    @click="showRegisterConfirm = false"
                    class="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                    Confirm registration
                </button>
            </div>
        </div>
    </div>
</div>
