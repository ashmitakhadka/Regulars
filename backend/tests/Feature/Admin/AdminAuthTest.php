<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

uses(DatabaseTransactions::class);

beforeEach(function () {
    RateLimiter::clear('admin-login:admin@example.com|127.0.0.1');
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

test('superadmin can log in successfully and receives admin profile', function () {
    $admin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin_' . uniqid() . '@example.com',
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'superadmin',
    ]);

    $response = $this->postJson('/api/login/admin', [
        'email' => $admin->email,
        'password' => 'SecretPass1234!',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
            'message' => 'Admin logged in successfully.',
        ]);

    $this->assertAuthenticatedAs($admin);
});

test('customer account cannot log in as admin and gets vague 401', function () {
    $customer = User::create([
        'name' => 'Customer User',
        'email' => 'cust_' . uniqid() . '@example.com',
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $response = $this->postJson('/api/login/admin', [
        'email' => $customer->email,
        'password' => 'SecretPass1234!',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Email or password is incorrect.',
        ]);

    $this->assertGuest();
});

test('merchant account cannot log in as admin and gets vague 401', function () {
    $merchantUser = User::create([
        'name' => 'Merchant User',
        'email' => 'merch_' . uniqid() . '@example.com',
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'merchant',
    ]);

    $response = $this->postJson('/api/login/admin', [
        'email' => $merchantUser->email,
        'password' => 'SecretPass1234!',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Email or password is incorrect.',
        ]);

    $this->assertGuest();
});

test('wrong password for admin returns vague 401', function () {
    $admin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin_' . uniqid() . '@example.com',
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'superadmin',
    ]);

    $response = $this->postJson('/api/login/admin', [
        'email' => $admin->email,
        'password' => 'WrongPassword123!',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Email or password is incorrect.',
        ]);

    $this->assertGuest();
});

test('admin login is rate limited to 5 attempts per minute', function () {
    $email = 'admin_rate_' . uniqid() . '@example.com';
    $rateKey = 'admin-login:' . $email . '|127.0.0.1';
    RateLimiter::clear($rateKey);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/login/admin', [
            'email' => $email,
            'password' => 'WrongPass',
        ])->assertStatus(401);
    }

    $response = $this->postJson('/api/login/admin', [
        'email' => $email,
        'password' => 'WrongPass',
    ]);

    $response->assertStatus(429)
        ->assertJsonStructure(['success', 'message']);

    RateLimiter::clear($rateKey);
});

test('get me returns authenticated admin profile', function () {
    $admin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin_' . uniqid() . '@example.com',
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'superadmin',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/admin/me')
        ->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
            'message' => 'Admin profile retrieved successfully.',
        ]);
});

test('admin logout terminates session', function () {
    $admin = User::create([
        'name' => 'Super Admin',
        'email' => 'admin_' . uniqid() . '@example.com',
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'superadmin',
    ]);

    $this->actingAs($admin)
        ->postJson('/api/logout/admin')
        ->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Admin logged out successfully.',
        ]);

    expect(Auth::guard('web')->check())->toBeFalse();
});

test('admin login success and failure log audit events', function () {
    Log::spy();

    $email = 'admin_audit_' . uniqid() . '@example.com';
    $admin = User::create([
        'name' => 'Super Admin',
        'email' => $email,
        'password' => Hash::make('SecretPass1234!'),
        'role' => 'superadmin',
    ]);

    // Failed login attempt
    $this->postJson('/api/login/admin', [
        'email' => $email,
        'password' => 'WrongPassword',
    ]);

    Log::shouldHaveReceived('info')->withArgs(function ($message, $context) use ($email) {
        return str_contains($message, '[admin.login.failed]') && $context['email'] === $email;
    });

    // Successful login attempt
    $this->postJson('/api/login/admin', [
        'email' => $email,
        'password' => 'SecretPass1234!',
    ]);

    Log::shouldHaveReceived('info')->withArgs(function ($message, $context) use ($admin) {
        return str_contains($message, '[admin.login.success]') && $context['admin_id'] === $admin->id;
    });
});
