<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class AdminSystemNotification extends Notification
{
    public function __construct(
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
            'audience' => 'admin',
            'kind' => $this->kind,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            ...$this->extraData,
        ];
    }
}
