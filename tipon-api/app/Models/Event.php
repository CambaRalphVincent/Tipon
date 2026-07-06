<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    public const STATUS_OPEN = 'open';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'organizer_id',
        'title',
        'description',
        'venue',
        'event_date',
        'capacity',
        'status',
        'cover_image_path',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
        ];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public static function completePastOpenEvents(): int
    {
        return static::query()
            ->where('status', self::STATUS_OPEN)
            ->where('event_date', '<=', now())
            ->update(['status' => self::STATUS_COMPLETED]);
    }

    public function refreshCompletionStatus(): self
    {
        if ($this->status === self::STATUS_OPEN && $this->event_date->isPast()) {
            $this->update(['status' => self::STATUS_COMPLETED]);
            $this->refresh();
        }

        return $this;
    }
}
