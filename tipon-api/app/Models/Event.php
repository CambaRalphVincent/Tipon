<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    private const EVENT_TIMEZONE = 'Asia/Manila';

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
        return [];
    }

    protected function eventDate(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value
                ? CarbonImmutable::parse($value, self::eventTimezone())
                : null,
            set: fn ($value) => self::formatEventDateForStorage($value),
        );
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return CarbonImmutable::instance($date)
            ->setTimezone(self::eventTimezone())
            ->format('Y-m-d\TH:i:s');
    }

    private static function formatEventDateForStorage(mixed $value): string
    {
        $timezone = self::eventTimezone();

        if ($value instanceof DateTimeInterface) {
            return CarbonImmutable::instance($value)
                ->setTimezone($timezone)
                ->format('Y-m-d H:i:s');
        }

        $raw = trim((string) $value);
        $date = preg_match('/(Z|[+-]\d{2}:?\d{2})$/', $raw)
            ? CarbonImmutable::parse($raw)->setTimezone($timezone)
            : CarbonImmutable::parse($raw, $timezone);

        return $date->format('Y-m-d H:i:s');
    }

    private static function eventTimezone(): string
    {
        return self::EVENT_TIMEZONE;
    }

    public static function currentEventDateForStorage(): string
    {
        return CarbonImmutable::now(self::eventTimezone())->format('Y-m-d H:i:s');
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
            ->where('event_date', '<=', self::currentEventDateForStorage())
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
