<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

test('admin:create command creates a superadmin user', function () {
    $email = 'new_superadmin_' . uniqid() . '@example.com';

    $this->artisan('admin:create', [
        'email' => $email,
        '--name' => 'Initial Superadmin',
    ])
        ->expectsQuestion('Enter admin password (min 12 characters)', 'SuperSecurePassword123!')
        ->expectsQuestion('Confirm admin password', 'SuperSecurePassword123!')
        ->assertSuccessful();

    $user = User::where('email', $email)->first();
    expect($user)->not->toBeNull();
    expect($user->role)->toBe('superadmin');
    expect($user->name)->toBe('Initial Superadmin');
    expect(Illuminate\Support\Facades\Hash::check('SuperSecurePassword123!', $user->password))->toBeTrue();
});

test('admin:create refuses password shorter than 12 characters', function () {
    $email = 'short_admin_' . uniqid() . '@example.com';

    $this->artisan('admin:create', [
        'email' => $email,
        '--name' => 'Short Admin',
    ])
        ->expectsQuestion('Enter admin password (min 12 characters)', 'short123')
        ->expectsQuestion('Confirm admin password', 'short123')
        ->assertFailed();

    expect(User::where('email', $email)->exists())->toBeFalse();
});

test('admin:create refuses mismatched passwords', function () {
    $email = 'mismatch_admin_' . uniqid() . '@example.com';

    $this->artisan('admin:create', [
        'email' => $email,
        '--name' => 'Mismatch Admin',
    ])
        ->expectsQuestion('Enter admin password (min 12 characters)', 'SuperSecurePassword123!')
        ->expectsQuestion('Confirm admin password', 'DifferentPassword123!')
        ->assertFailed();

    expect(User::where('email', $email)->exists())->toBeFalse();
});

test('admin:create refuses duplicate email', function () {
    $email = 'duplicate_admin_' . uniqid() . '@example.com';

    User::create([
        'name' => 'Existing User',
        'email' => $email,
        'password' => 'somehash',
        'role' => 'customer',
    ]);

    $this->artisan('admin:create', [
        'email' => $email,
        '--name' => 'Duplicate Admin',
    ])
        ->assertFailed();
});
