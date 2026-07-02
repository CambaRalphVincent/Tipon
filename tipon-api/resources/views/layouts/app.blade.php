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
            @php $user = auth()->user(); @endphp
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
                                Browse Events
                            </a>
                            <a href="{{ config('app.frontend_url') }}/my-registrations" class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
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
                                <button type="submit" class="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400">
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
                                <a href="/events" class="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Browse Events</a>
                                <a href="{{ config('app.frontend_url') }}/my-registrations" class="rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground">My Registrations</a>
                            </nav>
                            <div class="mt-auto">
                                <form method="POST" action="{{ route('livewire.logout') }}">
                                    @csrf
                                    <button type="submit" class="w-full rounded-md border border-border px-3 py-1.5 text-sm">Sign out</button>
                                </form>
                            </div>
                        </div>
                    </aside>
                </div>

                <div class="flex min-w-0 flex-1 flex-col">
                    <header class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
                        <button @click="mobileOpen = !mobileOpen" class="rounded-md p-2 hover:bg-accent" aria-label="Toggle menu">
                            ☰
                        </button>
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
