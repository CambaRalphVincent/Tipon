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
        Event::completePastOpenEvents();

        return Event::query()
            ->with('organizer:id,name')
            ->withCount(['registrations as registered_count' => fn ($q) => $q->where('status', 'registered')])
            ->where('status', Event::STATUS_OPEN)
            ->where('event_date', '>', Event::currentEventDateForStorage())
            ->when($this->query, function ($q) {
                $term = '%'.mb_strtolower($this->query).'%';

                $q->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(title) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(description) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(venue) LIKE ?', [$term]);
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
