<?php

namespace App\Notifications;

use App\Models\Event;
use App\Models\User;
use Illuminate\Notifications\Notification;

class OrganizerRegistrationNotification extends Notification
{
    public function __construct(
        private readonly Event $event,
        private readonly User $participant,
        private readonly string $status,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $message = $this->status === 'registered'
            ? "{$this->participant->name} registered for {$this->event->title}."
            : "{$this->participant->name} cancelled their registration for {$this->event->title}.";

        return [
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'participant_id' => $this->participant->id,
            'participant_name' => $this->participant->name,
            'status' => $this->status,
            'audience' => 'organizer',
            'kind' => $this->status === 'registered' ? 'participant_registered' : 'participant_cancelled',
            'action_url' => "/organizer/events/{$this->event->id}",
            'message' => $message,
        ];
    }
}
