<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark theme-teal">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>{{ $title ?? config('app.name') }}</title>

        @vite(['resources/css/app.css', 'resources/js/app.js'])

        @livewireStyles
    </head>
    <body class="min-h-screen bg-background font-sans text-foreground">
        @auth
            @php
                $user = auth()->user();
                $unreadNotifications = $user->unreadNotifications()->count();
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
                            <button type="button" class="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent" aria-label="Change theme">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6C22 6.5 17.5 2 12 2z" /></svg>
                            </button>
                            <button type="button" class="relative inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent" aria-label="Notifications">
                                @if ($unreadNotifications > 0)
                                    <span class="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">{{ $unreadNotifications > 9 ? '9+' : $unreadNotifications }}</span>
                                @endif
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></svg>
                            </button>
                        </div>
                    </header>
                    <main class="flex-1 p-4 md:p-6 lg:p-8">
                        {{ $slot }}
                    </main>
                </div>
            </div>
        @else
            {{ $slot }}
        @endauth

        @livewireScripts
    </body>
</html>
