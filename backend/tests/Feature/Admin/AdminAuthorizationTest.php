<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

test('unauthenticated request to admin endpoints returns 401', function () {
    $this->getJson('/api/admin/me')->assertStatus(401);
    $this->getJson('/api/admin/stats')->assertStatus(401);
    $this->getJson('/api/admin/merchants')->assertStatus(401);
    $this->getJson('/api/admin/merchants/1')->assertStatus(401);
    $this->patchJson('/api/admin/merchants/1/status', ['status' => 'suspended'])->assertStatus(401);
    $this->patchJson('/api/admin/merchants/1/pro', ['is_pro' => true])->assertStatus(401);
    $this->postJson('/api/logout/admin')->assertStatus(401);
});

test('customer user gets 403 on all admin endpoints', function () {
    $customer = User::create([
        'name' => 'Regular Customer',
        'email' => 'customer_' . uniqid() . '@example.com',
        'password' => Hash::make('password123'),
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $this->actingAs($customer);

    $this->getJson('/api/admin/me')->assertStatus(403);
    $this->getJson('/api/admin/stats')->assertStatus(403);
    $this->getJson('/api/admin/merchants')->assertStatus(403);
    $this->getJson('/api/admin/merchants/1')->assertStatus(403);
    $this->patchJson('/api/admin/merchants/1/status', ['status' => 'suspended'])->assertStatus(403);
    $this->patchJson('/api/admin/merchants/1/pro', ['is_pro' => true])->assertStatus(403);
    $this->postJson('/api/logout/admin')->assertStatus(403);
});

test('merchant user gets 403 on all admin endpoints', function () {
    $merchantUser = User::create([
        'name' => 'Merchant Owner',
        'email' => 'merchant_' . uniqid() . '@example.com',
        'password' => Hash::make('password123'),
        'role' => 'merchant',
    ]);

    $this->actingAs($merchantUser);

    $this->getJson('/api/admin/me')->assertStatus(403);
    $this->getJson('/api/admin/stats')->assertStatus(403);
    $this->getJson('/api/admin/merchants')->assertStatus(403);
    $this->getJson('/api/admin/merchants/1')->assertStatus(403);
    $this->patchJson('/api/admin/merchants/1/status', ['status' => 'suspended'])->assertStatus(403);
    $this->patchJson('/api/admin/merchants/1/pro', ['is_pro' => true])->assertStatus(403);
    $this->postJson('/api/logout/admin')->assertStatus(403);
});
