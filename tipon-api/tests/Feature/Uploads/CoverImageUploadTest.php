<?php

namespace Tests\Feature\Uploads;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoverImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_organizer_can_upload_valid_cover_image(): void
    {
        Storage::fake('public');
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/upload', [
            'file' => $this->fakePngUpload(),
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['url']);

        Storage::disk('public')->assertExists('covers/'.basename($response->json('url')));
    }

    public function test_cover_upload_requires_a_file(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/upload');

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_cover_upload_rejects_files_larger_than_two_mb(): void
    {
        Storage::fake('public');
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/upload', [
            'file' => $this->fakePngUpload('large-cover.png', 2049 * 1024),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_cover_upload_accepts_png_jpg_and_jpeg_extensions(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        foreach ([
            $this->fakePngUpload('cover.png'),
            $this->fakeJpegUpload('cover.jpg'),
            $this->fakeJpegUpload('cover.jpeg'),
        ] as $file) {
            Storage::fake('public');

            $this->postJson('/api/upload', ['file' => $file])
                ->assertOk()
                ->assertJsonStructure(['url']);
        }
    }

    public function test_participant_cannot_upload_cover_image(): void
    {
        Storage::fake('public');
        $participant = User::factory()->create(['role' => 'participant']);

        Sanctum::actingAs($participant);

        $response = $this->postJson('/api/upload', [
            'file' => $this->fakePngUpload(),
        ]);

        $response->assertForbidden();
    }

    public function test_cover_upload_rejects_invalid_file_type(): void
    {
        Storage::fake('public');
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/upload', [
            'file' => UploadedFile::fake()->create('malicious.svg', 10, 'image/svg+xml'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    public function test_cover_upload_rejects_pdf_and_gif_files(): void
    {
        Storage::fake('public');
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        foreach ([
            UploadedFile::fake()->create('document.pdf', 10, 'application/pdf'),
            UploadedFile::fake()->create('animation.gif', 10, 'image/gif'),
        ] as $file) {
            $this->postJson('/api/upload', ['file' => $file])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('file');
        }
    }

    public function test_uploaded_cover_uses_generated_storage_filename_instead_of_original_filename(): void
    {
        Storage::fake('public');
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/upload', [
            'file' => $this->fakePngUpload('unsafe-original-name.png'),
        ]);

        $response->assertOk();

        $url = $response->json('url');

        $this->assertStringNotContainsString('unsafe-original-name', $url);
        $this->assertStringContainsString('/storage/covers/', $url);
    }

    private function fakePngUpload(string $name = 'cover.png', ?int $targetBytes = null): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'tipon-cover-');
        $content = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
        );

        if ($targetBytes !== null && strlen($content) < $targetBytes) {
            $content .= str_repeat('0', $targetBytes - strlen($content));
        }

        file_put_contents($path, $content);

        return new UploadedFile($path, $name, 'image/png', null, true);
    }

    private function fakeJpegUpload(string $name): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'tipon-cover-');

        file_put_contents($path, base64_decode(
            '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUTEhIVFhUVFRUVFRUVFRUVFRUVFRUWFhUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAVEAEBAAAAAAAAAAAAAAAAAAAABf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUC/wD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Af/EABQRAQAAAAAAAAAAAAAAAAAAAAH/2gAIAQIBAT8B/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAEP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAEP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k='
        ));

        return new UploadedFile($path, $name, 'image/jpeg', null, true);
    }
}
