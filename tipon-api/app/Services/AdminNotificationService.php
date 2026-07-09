<?php

namespace App\Services;

use App\Models\Event;
use App\Models\User;
use App\Notifications\AdminSystemNotification;

class AdminNotificationService
{
    public function syncDueReminders(User $admin): void
    {
        if ($admin->role !== 'admin') {
            return;
        }

        $this->syncUnverifiedOrganizerReminders($admin);
    }

    public function notifyEventCancellationSummary(Event $event, int $affectedCount): void
    {
        if ($affectedCount === 0) {
            return;
        }

        $event->loadMissing('organizer');

        foreach ($this->admins() as $admin) {
            $this->notifyOnce(
                $admin,
                'admin_event_cancellation_summary',
                'Event cancelled',
                "{$event->title} was cancelled by {$event->organizer?->name}. {$affectedCount} registered participant".
                    ($affectedCount === 1 ? ' was' : 's were').' affected.',
                '/admin/events',
                [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'organizer_id' => $event->organizer_id,
                    'organizer_name' => $event->organizer?->name,
                    'affected_count' => $affectedCount,
                ],
                ['event_id' => $event->id],
            );
        }
    }

    public function notifyEventCreated(Event $event): void
    {
        $event->loadMissing('organizer');

        foreach ($this->admins() as $admin) {
            $this->notifyOnce(
                $admin,
                'admin_event_created',
                'New event created',
                "{$event->organizer?->name} created {$event->title}.",
                '/admin/events',
                [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'organizer_id' => $event->organizer_id,
                    'organizer_name' => $event->organizer?->name,
                ],
                ['event_id' => $event->id],
            );
        }
    }

    private function syncUnverifiedOrganizerReminders(User $admin): void
    {
        $organizers = User::where('role', 'organizer')
            ->whereNull('email_verified_at')
            ->where('created_at', '<=', now()->subDay())
            ->orderBy('created_at')
            ->get();

        foreach ($organizers as $organizer) {
            $this->notifyOnce(
                $admin,
                'unverified_organizer_reminder',
                'Organizer pending verification',
                "{$organizer->name} has not verified their organizer account yet.",
                '/admin',
                [
                    'organizer_id' => $organizer->id,
                    'organizer_name' => $organizer->name,
                    'organizer_email' => $organizer->email,
                ],
                ['organizer_id' => $organizer->id],
            );
        }
    }

    /**
     * @return iterable<User>
     */
    private function admins(): iterable
    {
        return User::where('role', 'admin')->get();
    }

    private function notifyOnce(
        User $admin,
        string $kind,
        string $title,
        string $message,
        string $actionUrl,
        array $extraData,
        array $uniqueData,
    ): void {
        $alreadySent = $admin->notifications()
            ->where('type', AdminSystemNotification::class)
            ->get()
            ->contains(function ($notification) use ($kind, $uniqueData) {
                if (($notification->data['audience'] ?? null) !== 'admin') {
                    return false;
                }

                if (($notification->data['kind'] ?? null) !== $kind) {
                    return false;
                }

                foreach ($uniqueData as $key => $value) {
                    if ((string) ($notification->data[$key] ?? '') !== (string) $value) {
                        return false;
                    }
                }

                return true;
            });

        if ($alreadySent) {
            return;
        }

        $admin->notify(new AdminSystemNotification($kind, $title, $message, $actionUrl, $extraData));
    }
}
