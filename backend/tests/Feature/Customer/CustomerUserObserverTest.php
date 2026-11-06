<?php

use App\Models\User;
use App\Services\Customer\CustomerCodeGenerator;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

test('new user with customer role automatically gets a customer code', function () {
    $generator = new CustomerCodeGenerator();

    $customer = User::create([
        'name' => 'Auto Customer',
        'email' => 'customer_' . uniqid() . '@example.com',
        'password' => 'secret123',
        'role' => 'customer',
    ]);

    expect($customer->customer_code)->not->toBeNull()
        ->and($generator->isValid($customer->customer_code))->toBeTrue();
});

test('new user with merchant role does not get a customer code', function () {
    $merchant = User::create([
        'name' => 'Auto Merchant',
        'email' => 'merchant_' . uniqid() . '@example.com',
        'password' => 'secret123',
        'role' => 'merchant',
    ]);

    expect($merchant->customer_code)->toBeNull();
});

test('new user with superadmin role does not get a customer code', function () {
    $admin = User::create([
        'name' => 'Auto Admin',
        'email' => 'admin_' . uniqid() . '@example.com',
        'password' => 'secret123',
        'role' => 'superadmin',
    ]);

    expect($admin->customer_code)->toBeNull();
});

test('new customer with pre-set code keeps that code and is not overwritten', function () {
    $customCode = 'RG-999999';

    $customer = User::create([
        'name' => 'Preset Customer',
        'email' => 'preset_' . uniqid() . '@example.com',
        'password' => 'secret123',
        'role' => 'customer',
        'customer_code' => $customCode,
    ]);

    expect($customer->customer_code)->toBe($customCode);
});

