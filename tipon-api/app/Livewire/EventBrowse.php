<?php

namespace App\Livewire;

use App\Models\Event;
use Livewire\Attributes\Computed;
use Livewire\Component;

class EventBrowse extends Component
{
    public string $query = '';

    public function mount(): void
    {
        $this->query = trim((string) request()->query('q', ''));
    }

    #[Computed]
    public function events()
    {
        return Event::query()
            ->with('organizer:id,name')
            ->withCount(['registrations as registered_count' => fn ($q) => $q->where('status', 'registered')])
            ->where('event_date', '>', now())
            ->when($this->query, function ($q) {
                $q->where(function ($q) {
                    $q->where('title', 'like', "%{$this->query}%")
                        ->orWhere('description', 'like', "%{$this->query}%")
                        ->orWhere('venue', 'like', "%{$this->query}%");
                });
            })
            ->orderBy('event_date')
            ->get();
    }

    #[Computed]
    public function myRegisteredEventIds()
    {
        return auth()->user()->registrations()
            ->where('status', 'registered')
            ->pluck('event_id')
            ->all();
    }

    public function render()
    {
        return view('livewire.event-browse');
    }
}
