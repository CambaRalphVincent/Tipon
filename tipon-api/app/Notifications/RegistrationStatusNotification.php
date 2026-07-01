<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Notifications\Notification;

class RegistrationStatusNotification extends Notification
{
    public function __construct(
        private readonly Event $event,
        private readonly string $status,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $message = $this->status === 'registered'
            ? "You have successfully registered for {$this->event->title}."
            : "Your registration for {$this->event->title} has been cancelled.";

        return [
            'event_id'    => $this->event->id,
            'event_title' => $this->event->title,
            'status'      => $this->status,
            'message'     => $message,
        ];
    }
}
