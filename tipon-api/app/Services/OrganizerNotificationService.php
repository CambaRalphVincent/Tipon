<?php

namespace App\Services;

use App\Models\Event;
use App\Models\User;
use App\Notifications\OrganizerEventNotification;
use Carbon\CarbonImmutable;

class OrganizerNotificationService
{
    private const CAPACITY_THRESHOLD_PERCENT = 90;

    public function notifyRegistrationMilestones(Event $event): void
    {
        $event->loadMissing('organizer');

        if (! $event->organizer) {
            return;
        }

        $registeredCount = $this->registeredCount($event);

        if ($registeredCount >= $event->capacity) {
            $this->notifyOnce(
                $event->organizer,
                $event,
                'event_full',
                'Event is full',
                "{$event->title} is now full with {$registeredCount} of {$event->capacity} slots taken.",
                "/organizer/events/{$event->id}",
                [
                    'registered_count' => $registeredCount,
                    'capacity' => $event->capacity,
                ],
            );

            return;
        }

        $thresholdCount = (int) ceil($event->capacity * (self::CAPACITY_THRESHOLD_PERCENT / 100));

        if ($registeredCount >= $thresholdCount) {
            $this->notifyOnce(
                $event->organizer,
                $event,
                'capacity_threshold',
                'Event is almost full',
                "{$event->title} has reached {$registeredCount} of {$event->capacity} slots.",
                "/organizer/events/{$event->id}",
                [
                    'registered_count' => $registeredCount,
                    'capacity' => $event->capacity,
                    'threshold_percent' => self::CAPACITY_THRESHOLD_PERCENT,
                ],
            );
        }
    }

    public function notifyCancellationSummary(Event $event, int $affectedCount): void
    {
        $event->loadMissing('organizer');

        if (! $event->organizer) {
            return;
        }

        $participantLabel = $affectedCount === 1 ? 'participant was' : 'participants were';

        $this->notifyOnce(
            $event->organizer,
            $event,
            'event_cancellation_summary',
            'Event cancellation summary',
            "{$event->title} was cancelled. {$affectedCount} registered {$participantLabel} notified.",
            '/organizer/events',
            ['affected_count' => $affectedCount],
        );
    }

    public function syncDueReminders(User $organizer): void
    {
        Event::completePastOpenEvents();

        $this->syncUpcomingEventReminders($organizer);
        $this->syncAttendanceReminders($organizer);
    }

    private function syncUpcomingEventReminders(User $organizer): void
    {
        $now = CarbonImmutable::now('Asia/Manila');
        $tomorrow = $now->addDay();

        $events = $organizer->organizedEvents()
            ->where('status', Event::STATUS_OPEN)
            ->whereBetween('event_date', [
                $now->format('Y-m-d H:i:s'),
                $tomorrow->format('Y-m-d H:i:s'),
            ])
            ->get();

        foreach ($events as $event) {
            $this->notifyOnce(
                $organizer,
                $event,
                'upcoming_event_reminder',
                'Upcoming event reminder',
                "{$event->title} starts within 24 hours. Review registrants and attendance setup.",
                "/organizer/events/{$event->id}",
            );
        }
    }

    private function syncAttendanceReminders(User $organizer): void
    {
        $events = $organizer->organizedEvents()
            ->where('status', Event::STATUS_COMPLETED)
            ->whereHas('registrations', fn ($query) => $query
                ->where('status', 'registered')
                ->where('attendance', 'pending'))
            ->withCount(['registrations as pending_attendance_count' => fn ($query) => $query
                ->where('status', 'registered')
                ->where('attendance', 'pending')])
            ->get();

        foreach ($events as $event) {
            $pendingCount = (int) $event->pending_attendance_count;
            $participantLabel = $pendingCount === 1 ? 'participant still needs' : 'participants still need';

            $this->notifyOnce(
                $organizer,
                $event,
                'attendance_reminder',
                'Attendance needs review',
                "{$event->title} is complete. {$pendingCount} {$participantLabel} attendance recorded.",
                "/organizer/events/{$event->id}",
                ['pending_attendance_count' => $pendingCount],
            );
        }
    }

    private function registeredCount(Event $event): int
    {
        return $event->registrations()
            ->where('status', 'registered')
            ->count();
    }

    private function notifyOnce(
        User $organizer,
        Event $event,
        string $kind,
        string $title,
        string $message,
        string $actionUrl,
        array $extraData = [],
    ): void {
        $alreadySent = $organizer->notifications()
            ->get()
            ->contains(fn ($notification) =>
                ($notification->data['audience'] ?? null) === 'organizer'
                && ($notification->data['kind'] ?? null) === $kind
                && (int) ($notification->data['event_id'] ?? 0) === $event->id);

        if ($alreadySent) {
            return;
        }

        $organizer->notify(new OrganizerEventNotification(
            $event,
            $kind,
            $title,
            $message,
            $actionUrl,
            $extraData,
        ));
    }
}
