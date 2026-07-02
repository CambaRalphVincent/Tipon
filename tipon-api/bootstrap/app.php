<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RequireRole::class,
        ]);

        // Lets Sanctum authenticate the React SPA (and future Livewire pages)
        // via session cookies, while bearer tokens keep working unchanged for
        // any other client (e.g. a future mobile app) hitting the same routes.
        $middleware->statefulApi();

        // There's no Blade login page — login only happens in the React SPA.
        // Send unauthenticated visitors of the Livewire pages there instead
        // of Laravel's default (nonexistent) named 'login' route.
        $middleware->redirectGuestsTo(fn () => config('app.frontend_url').'/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
