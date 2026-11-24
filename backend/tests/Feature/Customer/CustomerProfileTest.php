<?php

use App\Models\User;
use App\Models\Merchant;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

uses(DatabaseTransactions::class);

beforeEach(function () {
    RateLimiter::clear('customer_register:127.0.0.1');
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

function createTestCustomer(array $attributes = []): User
{
    return User::create(array_merge([
        'name' => 'Profile Customer ' . Str::random(5),
        'email' => 'customer_' . Str::random(8) . '@example.com',
        'password' => bcrypt('Password123!'),
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
        'customer_code' => 'RG-' . strtoupper(Str::random(6)),
    ], $attributes));
}

test('get profile returns authenticated customer data with member_since', function () {
    $createdAt = Carbon::create(2026, 11, 20, 10, 0, 0, 'UTC');
    Carbon::setTestNow($createdAt);

    $customer = createTestCustomer([
        'name' => 'Aayush Nepal',
        'phone' => '9812345678',
    ]);

    $expectedDate = $createdAt->copy()->setTimezone('Asia/Kathmandu')->format('Y-m-d');

    $response = $this->actingAs($customer, 'web')->getJson('/api/customer/profile');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => 'Aayush Nepal',
                'email' => $customer->email,
                'phone' => '9812345678',
                'customer_code' => $customer->customer_code,
                'member_since' => $expectedDate,
            ],
            'message' => 'Customer profile retrieved successfully.',
        ]);

    Carbon::setTestNow();
});

test('profile response contains only id, name, email, phone, customer_code, member_since and excludes sensitive fields', function () {
    $customer = createTestCustomer([
        'remember_token' => Str::random(10),
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($customer, 'web')->getJson('/api/customer/profile');

    $response->assertStatus(200);
    $data = $response->json('data');

    // Assert exact keys in data
    $keys = array_keys($data);
    sort($keys);
    $expectedKeys = ['customer_code', 'email', 'id', 'member_since', 'name', 'phone'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
    expect($data)->not->toHaveKey('password')
        ->and($data)->not->toHaveKey('remember_token')
        ->and($data)->not->toHaveKey('email_verified_at')
        ->and($data)->not->toHaveKey('role')
        ->and($data)->not->toHaveKey('is_admin');
});

test('update name works and trims and collapses repeated inner spaces', function () {
    $customer = createTestCustomer(['name' => 'Old Name']);

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => '   Aayush    Kumar     Sharma   ',
        'phone' => $customer->phone,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => 'Aayush Kumar Sharma',
            ],
            'message' => 'Profile updated successfully.',
        ]);

    $customer->refresh();
    expect($customer->name)->toBe('Aayush Kumar Sharma');
});

test('update phone works and is saved normalized', function () {
    $customer = createTestCustomer(['phone' => '9811111111']);

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => $customer->name,
        'phone' => '9841234567',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'phone' => '9841234567',
            ],
        ]);

    $customer->refresh();
    expect($customer->phone)->toBe('9841234567');
});

test('phone with spaces, dashes, or +977 is accepted and normalized', function () {
    $customer = createTestCustomer(['phone' => '9811111111']);

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => $customer->name,
        'phone' => '+977-98 12-345 678',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'phone' => '9812345678',
            ],
        ]);

    $customer->refresh();
    expect($customer->phone)->toBe('9812345678');
});

test('invalid phone returns 422 validation error', function () {
    $customer = createTestCustomer();

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => 'Valid Name',
        'phone' => '1234567890',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['phone']);
});

test('phone used by another user returns 422', function () {
    $otherCustomer = createTestCustomer(['phone' => '9844444444']);
    $myCustomer = createTestCustomer(['phone' => '9855555555']);

    $response = $this->actingAs($myCustomer, 'web')->patchJson('/api/customer/profile', [
        'name' => $myCustomer->name,
        'phone' => '9844444444',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['phone']);

    $myCustomer->refresh();
    expect($myCustomer->phone)->toBe('9855555555');
});

test('submitting same values again succeeds without phone already taken error', function () {
    $customer = createTestCustomer([
        'name' => 'Same Name',
        'phone' => '9866666666',
    ]);

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => 'Same Name',
        'phone' => '9866666666',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'name' => 'Same Name',
                'phone' => '9866666666',
            ],
            'message' => 'Profile updated successfully.',
        ]);
});

test('extra fields are completely ignored and unchanged in database', function () {
    $customer = createTestCustomer([
        'name' => 'Initial Name',
        'email' => 'keep_this_' . uniqid() . '@example.com',
        'role' => 'customer',
        'customer_code' => 'RG-SAFE01',
    ]);
    $originalPassword = $customer->password;

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => 'Updated Name',
        'phone' => '9877777777',
        'email' => 'hacked@example.com',
        'role' => 'merchant',
        'customer_code' => 'RG-HACKED',
        'password' => 'newpassword123',
        'is_admin' => 1,
    ]);

    $response->assertStatus(200);

    $customer->refresh();
    expect($customer->name)->toBe('Updated Name')
        ->and($customer->phone)->toBe('9877777777')
        ->and($customer->email)->not->toBe('hacked@example.com')
        ->and($customer->role)->toBe('customer')
        ->and($customer->customer_code)->toBe('RG-SAFE01')
        ->and($customer->password)->toBe($originalPassword);
});

test('empty name or whitespace only returns 422', function () {
    $customer = createTestCustomer();

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => '    ',
        'phone' => $customer->phone,
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['name']);
});

test('customer code never changes when updating profile', function () {
    $customer = createTestCustomer(['customer_code' => 'RG-UNCHANGED']);

    $response = $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => 'Brand New Name',
        'phone' => '9899999999',
    ]);

    $response->assertStatus(200);
    $customer->refresh();
    expect($customer->customer_code)->toBe('RG-UNCHANGED');
});

test('merchant user receives 403 forbidden on profile endpoints', function () {
    $owner = User::create([
        'name' => 'Merchant Owner',
        'email' => 'merchant_' . uniqid() . '@example.com',
        'password' => bcrypt('Password123!'),
        'role' => 'merchant',
    ]);

    $this->actingAs($owner, 'web')
        ->getJson('/api/customer/profile')
        ->assertStatus(403);

    $this->actingAs($owner, 'web')
        ->patchJson('/api/customer/profile', [
            'name' => 'Merchant Trying Update',
            'phone' => '9812345678',
        ])
        ->assertStatus(403);
});

test('unauthenticated user receives 401 on profile endpoints', function () {
    $this->getJson('/api/customer/profile')->assertStatus(401);

    $this->patchJson('/api/customer/profile', [
        'name' => 'Anon',
        'phone' => '9812345678',
    ])->assertStatus(401);
});

test('customer me endpoint still works and shows updated name after profile update', function () {
    $customer = createTestCustomer(['name' => 'Original Me Name']);

    // Update via profile endpoint
    $this->actingAs($customer, 'web')->patchJson('/api/customer/profile', [
        'name' => 'New Me Name',
        'phone' => $customer->phone,
    ])->assertStatus(200);

    // Fetch via me endpoint
    $meResponse = $this->actingAs($customer, 'web')->getJson('/api/customer/me');

    $meResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => 'New Me Name',
                'email' => $customer->email,
                'phone' => $customer->phone,
                'customer_code' => $customer->customer_code,
            ],
            'message' => 'Customer profile retrieved successfully.',
        ]);
});

test('race condition unique constraint violation on phone returns 422 instead of 500', function () {
    $customer = createTestCustomer();

    // Create another user in DB
    $existing = createTestCustomer(['phone' => '9833333333']);

    // Mock CustomerProfileService or trigger query exception by updating user directly
    $service = app(\App\Services\Customer\CustomerProfileService::class);
    $response = $service->updateProfile($customer, [
        'name' => 'Conflict Test',
        'phone' => $existing->phone, // Already taken in DB, will throw QueryException on save()
    ]);

    expect($response->status())->toBe(422);
    $content = json_decode($response->content(), true);
    expect($content['success'])->toBeFalse()
        ->and($content['message'])->toBe('The phone has already been taken.')
        ->and($content['errors']['phone'][0])->toBe('The phone has already been taken.');
});
