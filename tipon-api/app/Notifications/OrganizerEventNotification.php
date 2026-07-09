<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Notifications\Notification;

class OrganizerEventNotification extends Notification
{
    public function __construct(
        private readonly Event $event,
        private readonly string $kind,
        private readonly string $title,
        private readonly string $message,
        private readonly string $actionUrl,
        private readonly array $extraData = [],
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'audience' => 'organizer',
            'kind' => $this->kind,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            ...$this->extraData,
        ];
    }
}
