<?php

namespace App\Livewire;

use App\Models\Event;
use App\Models\Registration;
use App\Notifications\RegistrationStatusNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Livewire\Attributes\Computed;
use Livewire\Component;
use Throwable;

class EventDetail extends Component
{
    public Event $event;
    public bool $showCancelConfirm = false;
    public bool $showRegisterConfirm = false;

    public function mount(Event $event): void
    {
        $this->event = $event->refreshCompletionStatus();
    }

    public function openRegisterConfirm(): void
    {
        $this->showRegisterConfirm = true;
    }

    public function closeRegisterConfirm(): void
    {
        $this->showRegisterConfirm = false;
    }

    public function openCancelConfirm(): void
    {
        $this->showCancelConfirm = true;
    }

    public function closeCancelConfirm(): void
    {
        $this->showCancelConfirm = false;
    }

    #[Computed]
    public function registeredCount()
    {
        return $this->event->registrations()->where('status', 'registered')->count();
    }

    #[Computed]
    public function myRegistration()
    {
        return $this->event->registrations()
            ->where('user_id', auth()->id())
            ->where('status', 'registered')
            ->first();
    }

    #[Computed]
    public function isFull()
    {
        return $this->registeredCount >= $this->event->capacity;
    }

    #[Computed]
    public function isPast()
    {
        return $this->event->event_date->isPast();
    }

    public function register(): void
    {
        $this->closeRegisterConfirm();

        $this->event->refreshCompletionStatus();

        if ($this->event->status !== Event::STATUS_OPEN) {
            session()->flash('error', 'Event is not open for registration.');
            return;
        }

        if ($this->isPast) {
            session()->flash('error', 'Event has already ended.');
            return;
        }

        if ($this->myRegistration) {
            session()->flash('error', 'You are already registered for this event.');
            return;
        }

        try {
            DB::transaction(function () {
                $locked = Event::lockForUpdate()->findOrFail($this->event->id);

                if ($locked->status !== Event::STATUS_OPEN || $locked->event_date->isPast()) {
                    if ($locked->status === Event::STATUS_OPEN && $locked->event_date->isPast()) {
                        $locked->update(['status' => Event::STATUS_COMPLETED]);
                    }

                    throw new \RuntimeException('Event is not open for registration.');
                }

                if ($locked->registrations()->where('status', 'registered')->count() >= $locked->capacity) {
                    throw new \RuntimeException('Event is at full capacity.');
                }

                Registration::create([
                    'event_id' => $locked->id,
                    'user_id'  => auth()->id(),
                    'status'   => 'registered',
                ]);
            });
        } catch (\RuntimeException $e) {
            session()->flash('error', $e->getMessage());
            unset($this->registeredCount, $this->isFull, $this->myRegistration);
            return;
        } catch (Throwable $e) {
            Log::error('Livewire event registration failed.', [
                'event_id' => $this->event->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            session()->flash('error', 'Registration failed. Please try again.');
            unset($this->registeredCount, $this->isFull, $this->myRegistration);
            return;
        }

        try {
            auth()->user()->notify(new RegistrationStatusNotification($this->event, 'registered'));
        } catch (Throwable $e) {
            Log::warning('Registration notification failed after successful registration.', [
                'event_id' => $this->event->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);
        }

        unset($this->registeredCount, $this->isFull, $this->myRegistration);
        session()->flash('success', 'You have successfully registered for this event.');
    }

    public function cancelRegistration(): void
    {
        $this->closeCancelConfirm();

        $registration = $this->myRegistration;

        if (! $registration) {
            return;
        }

        $this->event->refreshCompletionStatus();

        if ($this->isPast || $this->event->status === Event::STATUS_COMPLETED) {
            session()->flash('error', 'Registration can no longer be cancelled after the event date.');
            return;
        }

        $registration->update(['status' => 'cancelled']);

        try {
            auth()->user()->notify(new RegistrationStatusNotification($this->event, 'cancelled'));
        } catch (Throwable $e) {
            Log::warning('Cancellation notification failed after successful cancellation.', [
                'event_id' => $this->event->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);
        }

        unset($this->registeredCount, $this->isFull, $this->myRegistration);
        session()->flash('success', 'Your registration has been cancelled.');
    }

    public function render()
    {
        return view('livewire.event-detail');
    }
}
