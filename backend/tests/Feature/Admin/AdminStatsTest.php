<?php

use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\User;
use App\Models\Voucher;
use Carbon\Carbon;
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

test('admin stats returns accurate counts and handles Asia/Kathmandu 7-day window around midnight', function () {
    $admin = User::create([
        'name' => 'Admin Stats Tester',
        'email' => 'admin_stats_' . uniqid() . '@example.com',
        'password' => Hash::make('secretpass123'),
        'role' => 'superadmin',
    ]);

    // Freeze time around midnight in Asia/Kathmandu (server in UTC)
    // 2026-11-24 00:05:00 in Kathmandu is 2026-11-23 18:20:00 UTC
    $fixedNowKathmandu = Carbon::parse('2026-11-24 00:05:00', 'Asia/Kathmandu');
    Carbon::setTestNow($fixedNowKathmandu);

    // 7-day window covers: Nov 18, 19, 20, 21, 22, 23, 24 in Kathmandu
    // Window start = Nov 18 00:00:00 Asia/Kathmandu = Nov 17 18:15:00 UTC
    $insideDateUtc = Carbon::parse('2026-11-18 01:00:00', 'Asia/Kathmandu')->utc();
    $outsideDateUtc = Carbon::parse('2026-11-17 23:50:00', 'Asia/Kathmandu')->utc();

    // 1. Create Customer Inside and Customer Outside 7-day window
    $customerInside = User::create([
        'name' => 'Cust Inside',
        'email' => 'cust_inside_' . uniqid() . '@example.com',
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
        'created_at' => $insideDateUtc,
    ]);

    $customerOutside = User::create([
        'name' => 'Cust Outside',
        'email' => 'cust_outside_' . uniqid() . '@example.com',
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
        'created_at' => $outsideDateUtc,
    ]);

    // 2. Create Active Merchant & Suspended Merchant & Pro Merchant
    $merchantUser = User::create([
        'name' => 'Owner',
        'email' => 'owner_' . uniqid() . '@example.com',
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $merchantUser->id,
        'business_name' => 'Stats Cafe',
        'slug' => 'stats-cafe-' . uniqid(),
        'status' => 'active',
    ]);
    $merchant->is_pro = true;
    $merchant->save();

    $program = LoyaltyProgram::create([
        'merchant_id' => $merchant->id,
        'name' => 'Stats Program',
        'status' => 'active',
    ]);

    $version = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $program->id,
        'version_number' => 1,
        'stamps_to_complete' => 10,
        'status' => 'active',
    ]);

    $card = StampCard::create([
        'customer_id' => $customerInside->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 5,
        'status' => 'active',
    ]);

    // 3. Stamp transactions (inside and outside)
    StampTransaction::create([
        'stamp_card_id' => $card->id,
        'program_version_id' => $version->id,
        'source_type' => 'visit',
        'source_id' => 101,
        'stamps_awarded' => 3,
        'created_at' => $insideDateUtc,
    ]);

    StampTransaction::create([
        'stamp_card_id' => $card->id,
        'program_version_id' => $version->id,
        'source_type' => 'visit',
        'source_id' => 102,
        'stamps_awarded' => 2,
        'created_at' => $outsideDateUtc,
    ]);

    // 4. Vouchers (inside and outside)
    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customerInside->id,
        'code' => 'VCH-INSIDE-' . uniqid(),
        'source_type' => 'stamp_card',
        'reward_title' => 'Free Coffee',
        'reward_type' => 'free_item',
        'status' => 'redeemed',
        'issued_at' => $insideDateUtc,
        'expires_at' => Carbon::now()->addDays(30),
        'redeemed_at' => $insideDateUtc,
        'created_at' => $insideDateUtc,
    ]);

    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customerOutside->id,
        'code' => 'VCH-OUTSIDE-' . uniqid(),
        'source_type' => 'stamp_card',
        'reward_title' => 'Free Pastry',
        'reward_type' => 'free_item',
        'status' => 'redeemed',
        'issued_at' => $outsideDateUtc,
        'expires_at' => Carbon::now()->addDays(30),
        'redeemed_at' => $outsideDateUtc,
        'created_at' => $outsideDateUtc,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/stats');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data' => [
                'merchants' => ['total', 'active', 'suspended', 'pro'],
                'customers' => ['total', 'new_last_7_days'],
                'loyalty_programs' => ['total', 'active'],
                'stamps_awarded' => ['total', 'last_7_days'],
                'vouchers' => [
                    'issued_total',
                    'issued_last_7_days',
                    'redeemed_total',
                    'redeemed_last_7_days',
                ],
            ],
            'message',
        ]);

    $data = $response->json('data');

    expect($data['merchants']['total'])->toBeGreaterThanOrEqual(1);
    expect($data['merchants']['pro'])->toBeGreaterThanOrEqual(1);
    expect($data['customers']['new_last_7_days'])->toBeGreaterThanOrEqual(1);
    expect($data['stamps_awarded']['last_7_days'])->toBeGreaterThanOrEqual(3);
    expect($data['vouchers']['issued_last_7_days'])->toBeGreaterThanOrEqual(1);
    expect($data['vouchers']['redeemed_last_7_days'])->toBeGreaterThanOrEqual(1);

    Carbon::setTestNow(); // Reset test clock
});
