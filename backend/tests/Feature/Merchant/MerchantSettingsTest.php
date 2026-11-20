<?php

use App\Models\Merchant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->phone = '98' . rand(10000000, 99999999);
    $this->user = User::factory()->create([
        'name' => 'Original Owner',
        'email' => 'owner' . uniqid() . '@example.com',
        'password' => Hash::make('Secret1234!'),
        'role' => 'merchant',
        'phone' => $this->phone,
    ]);

    $this->merchant = Merchant::create([
        'user_id' => $this->user->id,
        'business_name' => 'Original Cafe',
        'slug' => 'original-cafe-' . uniqid(),
        'phone' => '9841' . rand(100000, 999999),
        'address' => 'Kathmandu, Nepal',
        'status' => 'active',
    ]);
});

test('authenticated merchant can get their settings details via GET /api/merchant/me', function () {
    $response = $this->actingAs($this->user)
        ->getJson('/api/merchant/me');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'user' => [
                'name' => 'Original Owner',
                'phone' => $this->phone,
            ],
            'merchant' => [
                'business_name' => 'Original Cafe',
                'address' => 'Kathmandu, Nepal',
            ],
        ]);
});

test('merchant can update business information via PUT /api/merchant/me', function () {
    $newBizPhone = '9841' . rand(100000, 999999);

    $response = $this->actingAs($this->user)
        ->putJson('/api/merchant/me', [
            'business_name' => 'Updated Cafe Name',
            'phone' => $newBizPhone,
            'address' => 'Patan, Lalitpur',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'merchant' => [
                'business_name' => 'Updated Cafe Name',
                'phone' => $newBizPhone,
                'address' => 'Patan, Lalitpur',
            ],
        ]);

    $this->assertDatabaseHas('merchants', [
        'id' => $this->merchant->id,
        'business_name' => 'Updated Cafe Name',
        'phone' => $newBizPhone,
        'address' => 'Patan, Lalitpur',
    ]);
});

test('merchant can update personal account details via PUT /api/merchant/me', function () {
    $newEmail = 'newowner' . uniqid() . '@example.com';
    $newPersonalPhone = '98' . rand(10000000, 99999999);

    $response = $this->actingAs($this->user)
        ->putJson('/api/merchant/me', [
            'name' => 'New Owner Name',
            'email' => $newEmail,
            'personal_phone' => $newPersonalPhone,
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'user' => [
                'name' => 'New Owner Name',
                'email' => $newEmail,
                'phone' => $newPersonalPhone,
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $this->user->id,
        'name' => 'New Owner Name',
        'email' => $newEmail,
        'phone' => $newPersonalPhone,
    ]);
});

test('merchant can update password via PUT /api/merchant/me', function () {
    $response = $this->actingAs($this->user)
        ->putJson('/api/merchant/me', [
            'current_password' => 'Secret1234!',
            'password' => 'BrandNewSecret88!',
            'password_confirmation' => 'BrandNewSecret88!',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Settings updated successfully.',
        ]);

    $this->user->refresh();
    expect(Hash::check('BrandNewSecret88!', $this->user->password))->toBeTrue();
});

test('password update fails if current password is wrong', function () {
    $response = $this->actingAs($this->user)
        ->putJson('/api/merchant/me', [
            'current_password' => 'WrongPassword!',
            'password' => 'BrandNewSecret88!',
            'password_confirmation' => 'BrandNewSecret88!',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['current_password']);
});
