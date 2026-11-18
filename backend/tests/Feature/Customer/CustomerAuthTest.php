<?php

use App\Models\User;
use App\Services\Customer\CustomerCodeGenerator;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

uses(DatabaseTransactions::class);

beforeEach(function () {
    RateLimiter::clear('customer_register:127.0.0.1');
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

test('customer registers successfully with role customer, customer code, and normalized phone', function () {
    $generator = new CustomerCodeGenerator();

    $response = $this->postJson('/api/register/customer', [
        'name' => 'Aayush Nepal',
        'email' => 'aayush_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
        'phone' => '+977-9812345678',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Customer registered successfully.',
        ])
        ->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'name',
                'email',
                'phone',
                'customer_code',
            ],
            'message',
        ]);

    $data = $response->json('data');
    expect($data['phone'])->toBe('9812345678')
        ->and($data['customer_code'])->not->toBeNull()
        ->and($generator->isValid($data['customer_code']))->toBeTrue();

    $user = User::find($data['id']);
    expect($user->role)->toBe('customer')
        ->and($user->phone)->toBe('9812345678')
        ->and(Auth::guard('web')->id())->toBe($user->id);
});

test('passwords are hashed exactly once and user can log in after registration and logout', function () {
    $email = 'hash_test_' . uniqid() . '@example.com';
    $password = 'TestPassword123!';

    $registerResponse = $this->postJson('/api/register/customer', [
        'name' => 'Hash Test',
        'email' => $email,
        'password' => $password,
        'password_confirmation' => $password,
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $registerResponse->assertStatus(201);
    $userId = $registerResponse->json('data.id');
    $user = User::find($userId);

    // Verify password is correctly hashed once
    expect(Hash::check($password, $user->password))->toBeTrue();

    // Logout
    $logoutResponse = $this->postJson('/api/logout/customer');
    $logoutResponse->assertStatus(200);

    // Login with the exact same password
    $loginResponse = $this->postJson('/api/login/customer', [
        'email' => $email,
        'password' => $password,
    ]);

    $loginResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Customer logged in successfully.',
            'data' => [
                'id' => $userId,
                'email' => strtolower($email),
            ],
        ]);
});

test('duplicate email is rejected during customer registration', function () {
    $email = 'existing_' . uniqid() . '@example.com';

    User::create([
        'name' => 'Existing User',
        'email' => $email,
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);

    $response = $this->postJson('/api/register/customer', [
        'name' => 'Duplicate Email User',
        'email' => $email,
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['email']);
});

test('duplicate normalized phone is rejected during customer registration', function () {
    $phone = '9801234567';

    User::create([
        'name' => 'Phone User',
        'email' => 'phone_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => $phone,
        'role' => 'customer',
    ]);

    // Send formatted phone that normalizes to the same number
    $response = $this->postJson('/api/register/customer', [
        'name' => 'Second User',
        'email' => 'second_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
        'phone' => '+977-9801234567',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['phone']);
});

test('invalid Nepal phone number is rejected during customer registration', function () {
    $response = $this->postJson('/api/register/customer', [
        'name' => 'Invalid Phone User',
        'email' => 'invalid_phone_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
        'phone' => '014234567', // Landline format, not 96/97/98 mobile
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['phone']);
});

test('weak password under 8 characters is rejected during customer registration', function () {
    $response = $this->postJson('/api/register/customer', [
        'name' => 'Weak Pass User',
        'email' => 'weak_pass_' . uniqid() . '@example.com',
        'password' => 'short',
        'password_confirmation' => 'short',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['password']);
});

test('password confirmation mismatch is rejected during customer registration', function () {
    $response = $this->postJson('/api/register/customer', [
        'name' => 'Mismatch Pass User',
        'email' => 'mismatch_' . uniqid() . '@example.com',
        'password' => 'password1234',
        'password_confirmation' => 'different1234',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ])
        ->assertJsonValidationErrors(['password']);
});

test('registration rate limit blocks after 5 attempts per minute per IP', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/register/customer', [
            'name' => 'Throttle Test ' . $i,
            'email' => 'throttle_' . $i . '_' . uniqid() . '@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
            'phone' => '98' . rand(10000000, 99999999),
        ]);
    }

    $blocked = $this->postJson('/api/register/customer', [
        'name' => 'Blocked Attempt',
        'email' => 'blocked_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'password_confirmation' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $blocked->assertStatus(429)
        ->assertJson([
            'success' => false,
        ]);
});

test('customer logs in successfully with valid credentials', function () {
    $email = 'login_test_' . uniqid() . '@example.com';
    $password = 'CorrectPassword123';

    $user = User::create([
        'name' => 'Login Customer',
        'email' => $email,
        'password' => $password,
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);

    $response = $this->postJson('/api/login/customer', [
        'email' => $email,
        'password' => $password,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Customer logged in successfully.',
            'data' => [
                'id' => $user->id,
                'name' => 'Login Customer',
                'email' => $email,
            ],
        ]);

    expect(Auth::guard('web')->id())->toBe($user->id);
});

test('login fails with wrong password and returns vague 401 error', function () {
    $email = 'wrong_pass_' . uniqid() . '@example.com';

    User::create([
        'name' => 'Wrong Pass Customer',
        'email' => $email,
        'password' => 'RealPassword123',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);

    $response = $this->postJson('/api/login/customer', [
        'email' => $email,
        'password' => 'WrongPassword123',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Email or password is incorrect',
        ]);
});

test('merchant email cannot log in as customer and returns the same vague 401 error', function () {
    $email = 'merchant_' . uniqid() . '@example.com';
    $password = 'MerchantSecret123';

    User::create([
        'name' => 'Merchant Account',
        'email' => $email,
        'password' => $password,
        'role' => 'merchant',
    ]);

    $response = $this->postJson('/api/login/customer', [
        'email' => $email,
        'password' => $password,
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Email or password is incorrect',
        ]);
});

test('customer login rate limit triggers after 10 failed attempts', function () {
    $email = 'throttle_login_' . uniqid() . '@example.com';
    RateLimiter::clear('customer_login:' . strtolower($email) . '|127.0.0.1');

    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/login/customer', [
            'email' => $email,
            'password' => 'wrongpass' . $i,
        ]);
    }

    $blocked = $this->postJson('/api/login/customer', [
        'email' => $email,
        'password' => 'wrongpass_blocked',
    ]);

    $blocked->assertStatus(429)
        ->assertJson([
            'success' => false,
        ]);
});

test('customer me endpoint requires login and returns 401 unauthenticated JSON', function () {
    $response = $this->getJson('/api/customer/me');

    $response->assertStatus(401);
});

test('customer me endpoint returns customer profile when authenticated', function () {
    $user = User::create([
        'name' => 'Profile Customer',
        'email' => 'me_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);

    $response = $this->actingAs($user, 'web')->getJson('/api/customer/me');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => 'Profile Customer',
                'email' => $user->email,
                'phone' => $user->phone,
                'customer_code' => $user->customer_code,
            ],
            'message' => 'Customer profile retrieved successfully.',
        ]);
});

test('merchant user receives 403 forbidden when accessing customer me endpoint', function () {
    $merchantUser = User::create([
        'name' => 'Merchant Test',
        'email' => 'merchant_forbidden_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'role' => 'merchant',
    ]);

    $response = $this->actingAs($merchantUser, 'web')->getJson('/api/customer/me');

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Forbidden. Customer access only.',
        ]);
});

test('customer logout terminates active session', function () {
    $user = User::create([
        'name' => 'Logout Customer',
        'email' => 'logout_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);

    $this->actingAs($user, 'web');

    $logoutResponse = $this->postJson('/api/logout/customer');
    $logoutResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Customer logged out successfully.',
        ]);

    expect(Auth::guard('web')->check())->toBeFalse();
});
