<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark theme-teal">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>{{ $title ?? config('app.name') }}</title>

        @vite(['resources/css/app.css', 'resources/js/app.js'])

    </head>
    <body class="min-h-screen bg-background font-sans text-foreground">
        @auth
            @php
                $user = auth()->user();
                $unreadNotifications = $user->unreadNotifications()->count();
                $notifications = $user->notifications()->latest()->limit(10)->get();
            @endphp
            <div class="flex min-h-screen bg-background text-foreground" x-data="{ mobileOpen: false }">
                {{-- Desktop sidebar — mirrors AppShell.tsx's <aside> exactly --}}
                <aside class="hidden w-64 shrink-0 border-r border-border md:block">
                    <div class="sticky top-0 flex h-screen flex-col gap-6 p-4">
                        <a href="/events" class="block px-2 py-1">
                            <div class="flex flex-row items-center gap-3">
                                @include('partials.tipon-logo-icon', ['class' => 'h-11 w-11 shrink-0 text-foreground'])
                                <div class="leading-none">
                                    <p class="text-xl tracking-tight text-foreground" style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;">Tipon</p>
                                    <p class="text-[11px] text-muted-foreground" style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;">Event Registration</p>
                                </div>
                            </div>
                        </a>

                        <nav class="flex flex-col gap-1">
                            <a href="/events" class="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                                Browse Events
                            </a>
                            <a href="{{ config('app.frontend_url') }}/my-registrations" class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
                                My Registrations
                            </a>
                        </nav>

                        <div class="mt-auto space-y-3">
                            <hr class="border-border">
                            <div class="flex items-center gap-3 px-2">
                                <div class="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
                                    {{ collect(explode(' ', $user->name))->map(fn ($p) => $p[0])->join('') }}
                                </div>
                                <div class="min-w-0 leading-tight">
                                    <p class="truncate text-sm font-medium">{{ $user->name }}</p>
                                    <p class="truncate text-xs capitalize text-muted-foreground">{{ $user->role }}</p>
                                </div>
                            </div>
                            <form method="POST" action="{{ route('livewire.logout') }}">
                                @csrf
                                <button type="submit" class="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {{-- Mobile drawer --}}
                <div x-show="mobileOpen" x-cloak class="fixed inset-0 z-50 md:hidden">
                    <div class="absolute inset-0 bg-black/60" @click="mobileOpen = false"></div>
                    <aside class="absolute left-0 top-0 h-full w-64 border-r border-border bg-background">
                        <div class="flex h-full flex-col gap-6 p-4">
                            <a href="/events" class="block px-2 py-1" @click="mobileOpen = false">
                                <div class="flex flex-row items-center gap-3">
                                    @include('partials.tipon-logo-icon', ['class' => 'h-9 w-9 shrink-0 text-foreground'])
                                    <p class="text-xl tracking-tight text-foreground" style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800;">Tipon</p>
                                </div>
                            </a>
                            <nav class="flex flex-col gap-1">
                                <a href="/events" class="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                                    Browse Events
                                </a>
                                <a href="{{ config('app.frontend_url') }}/my-registrations" class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
                                    My Registrations
                                </a>
                            </nav>
                            <div class="mt-auto">
                                <form method="POST" action="{{ route('livewire.logout') }}">
                                    @csrf
                                    <button type="submit" class="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 shrink-0"><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg>
                                        Sign out
                                    </button>
                                </form>
                            </div>
                        </div>
                    </aside>
                </div>

                <div class="flex min-w-0 flex-1 flex-col">
                    <header class="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
                        <button @click="mobileOpen = !mobileOpen" class="rounded-md p-2 hover:bg-accent md:hidden" aria-label="Toggle menu">
                            <svg x-show="!mobileOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M4 12h16" /><path d="M4 18h16" /><path d="M4 6h16" /></svg>
                            <svg x-show="mobileOpen" x-cloak xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                        <div class="hidden md:block"></div>
                        <div class="flex items-center gap-1">
                            <div class="relative" data-menu-root>
                                <button type="button" data-menu-trigger="theme" class="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent" aria-label="Change theme" aria-haspopup="menu" aria-expanded="false">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6C22 6.5 17.5 2 12 2z" /></svg>
                                </button>
                                <div data-menu-panel="theme" class="absolute right-0 top-11 z-50 hidden w-56 overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                                    <div class="px-2 py-1.5 text-sm font-medium">Theme</div>
                                    <div class="-mx-1 my-1 h-px bg-border"></div>
                                    <div>
                                        <button type="button" data-theme-option="gold" class="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                                            <span class="flex size-5 shrink-0 items-center justify-center rounded-full border" style="background: oklch(0.205 0.028 264); border-color: oklch(0.81 0.15 79);"><span class="size-2.5 rounded-full" style="background: oklch(0.81 0.15 79);"></span></span>
                                            <span class="min-w-0 flex-1">
                                                <span class="block text-sm">Bayanihan Gold</span>
                                                <span class="block text-xs text-muted-foreground">Navy + warm golden-amber</span>
                                            </span>
                                            <span data-theme-check="gold" class="size-4 shrink-0 text-primary opacity-0">&#10003;</span>
                                        </button>
                                        <button type="button" data-theme-option="teal" class="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                                            <span class="flex size-5 shrink-0 items-center justify-center rounded-full border" style="background: oklch(0.205 0.022 220); border-color: oklch(0.77 0.12 185);"><span class="size-2.5 rounded-full" style="background: oklch(0.77 0.12 185);"></span></span>
                                            <span class="min-w-0 flex-1">
                                                <span class="block text-sm">Tropical Teal</span>
                                                <span class="block text-xs text-muted-foreground">Dark slate + teal/emerald</span>
                                            </span>
                                            <span data-theme-check="teal" class="size-4 shrink-0 text-primary opacity-0">&#10003;</span>
                                        </button>
                                        <button type="button" data-theme-option="sunset" class="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                                            <span class="flex size-5 shrink-0 items-center justify-center rounded-full border" style="background: oklch(0.205 0.035 330); border-color: oklch(0.72 0.18 18);"><span class="size-2.5 rounded-full" style="background: oklch(0.72 0.18 18);"></span></span>
                                            <span class="min-w-0 flex-1">
                                                <span class="block text-sm">Festival Sunset</span>
                                                <span class="block text-xs text-muted-foreground">Dark plum + coral/magenta</span>
                                            </span>
                                            <span data-theme-check="sunset" class="size-4 shrink-0 text-primary opacity-0">&#10003;</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="relative" data-menu-root>
                                <button type="button" data-menu-trigger="notifications" class="relative inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent" aria-label="Notifications" aria-haspopup="menu" aria-expanded="false">
                                    @if ($unreadNotifications > 0)
                                        <span class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">{{ $unreadNotifications > 9 ? '9+' : $unreadNotifications }}</span>
                                    @endif
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></svg>
                                </button>
                                <div data-menu-panel="notifications" class="absolute right-0 top-11 z-50 hidden w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
                                    <div class="flex items-center justify-between border-b border-border px-4 py-3">
                                        <p class="text-sm font-medium">Notifications</p>
                                        @if ($unreadNotifications > 0)
                                            <form method="POST" action="{{ route('livewire.notifications.readAll') }}">
                                                @csrf
                                                <button type="submit" class="text-xs font-medium text-primary hover:underline">Mark all read</button>
                                            </form>
                                        @endif
                                    </div>
                                    <div class="max-h-[min(22rem,calc(100vh-6rem))] overflow-y-auto overscroll-contain">
                                        @forelse ($notifications as $notification)
                                            @php
                                                $data = $notification->data ?? [];
                                                $status = $data['status'] ?? null;
                                                $message = $data['message'] ?? 'Notification update.';
                                                $eventTitle = $data['event_title'] ?? 'Event update';
                                                $isCancelled = $status === 'cancelled';
                                                $title = $isCancelled ? 'Registration cancelled' : 'Registration confirmed';
                                                $iconClass = $isCancelled ? 'text-red-400' : 'text-emerald-400';
                                            @endphp
                                            <form method="POST" action="{{ route('livewire.notifications.read', $notification->id) }}" class="border-b border-border last:border-b-0">
                                                @csrf
                                                <button
                                                    type="submit"
                                                    class="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent {{ $notification->read_at ? '' : 'bg-accent/40' }}"
                                                    aria-label="Mark notification about {{ $eventTitle }} as read"
                                                >
                                                    @if ($isCancelled)
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 size-4 shrink-0 {{ $iconClass }}"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                                                    @else
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 size-4 shrink-0 {{ $iconClass }}"><path d="M21.8 10A10 10 0 1 1 17 3.3" /><path d="m9 11 3 3L22 4" /></svg>
                                                    @endif
                                                    <span class="min-w-0 flex-1">
                                                        <span class="flex items-center justify-between gap-2">
                                                            <span class="truncate text-sm font-medium">{{ $title }}</span>
                                                            @if (! $notification->read_at)
                                                                <span class="size-2 shrink-0 rounded-full bg-primary"></span>
                                                            @endif
                                                        </span>
                                                        <span class="block text-sm text-muted-foreground">{{ $message }}</span>
                                                        <span class="mt-1 block text-xs text-muted-foreground">{{ $notification->created_at->diffForHumans() }}</span>
                                                    </span>
                                                </button>
                                            </form>
                                        @empty
                                            <p class="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
                                        @endforelse
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    <main class="flex-1 p-4 md:p-6 lg:p-8">
                        {{ $slot ?? '' }}
                        @yield('content')
                    </main>
                </div>
            </div>
        @else
            {{ $slot ?? '' }}
            @yield('content')
        @endauth

        <script>
            (() => {
                const storageKey = 'tipon-theme';
                const themeNames = ['gold', 'teal', 'sunset'];
                const root = document.documentElement;

                function closeMenus(except) {
                    document.querySelectorAll('[data-menu-panel]').forEach((panel) => {
                        if (panel === except) return;
                        panel.classList.add('hidden');
                    });
                    document.querySelectorAll('[data-menu-trigger]').forEach((trigger) => {
                        const panelName = trigger.getAttribute('data-menu-trigger');
                        const panel = document.querySelector(`[data-menu-panel="${panelName}"]`);
                        trigger.setAttribute('aria-expanded', panel && !panel.classList.contains('hidden') ? 'true' : 'false');
                    });
                }

                function setTheme(theme) {
                    const nextTheme = themeNames.includes(theme) ? theme : 'teal';
                    root.classList.add('dark');
                    root.classList.remove('theme-gold', 'theme-teal', 'theme-sunset');
                    if (nextTheme !== 'gold') root.classList.add(`theme-${nextTheme}`);
                    window.localStorage.setItem(storageKey, nextTheme);

                    document.querySelectorAll('[data-theme-check]').forEach((check) => {
                        check.classList.toggle('opacity-0', check.getAttribute('data-theme-check') !== nextTheme);
                    });
                }

                setTheme(window.localStorage.getItem(storageKey) || 'teal');

                document.addEventListener('click', (event) => {
                    const trigger = event.target.closest('[data-menu-trigger]');
                    if (trigger) {
                        const name = trigger.getAttribute('data-menu-trigger');
                        const panel = document.querySelector(`[data-menu-panel="${name}"]`);
                        if (!panel) return;

                        const shouldOpen = panel.classList.contains('hidden');
                        closeMenus(panel);
                        panel.classList.toggle('hidden', !shouldOpen);
                        trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
                        return;
                    }

                    const themeOption = event.target.closest('[data-theme-option]');
                    if (themeOption) {
                        setTheme(themeOption.getAttribute('data-theme-option'));
                        closeMenus();
                        return;
                    }

                    if (!event.target.closest('[data-menu-root]')) {
                        closeMenus();
                    }
                });

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') closeMenus();
                });
            })();
        </script>
    </body>
</html>
