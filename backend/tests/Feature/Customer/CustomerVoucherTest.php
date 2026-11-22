<?php

use App\Models\Merchant;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'Referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

function createVoucherCustomer(): User
{
    return User::create([
        'name' => 'Test Customer ' . Str::random(5),
        'email' => 'customer_' . Str::random(8) . '@example.com',
        'password' => bcrypt('Password123!'),
        'role' => 'customer',
        'phone' => '+977-98' . rand(10000000, 99999999),
        'customer_code' => 'CUST-' . strtoupper(Str::random(6)),
    ]);
}

function createVoucherMerchant(string $tz = 'Asia/Kathmandu'): array
{
    $owner = User::create([
        'name' => 'Merchant Owner ' . Str::random(5),
        'email' => 'merchant_' . Str::random(8) . '@example.com',
        'password' => bcrypt('Password123!'),
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $owner->id,
        'business_name' => 'Test Biz ' . Str::random(4),
        'slug' => 'test-biz-' . Str::lower(Str::random(6)),
        'category' => 'cafe',
        'status' => 'active',
        'currency' => 'NPR',
    ]);
    $merchant->forceFill(['timezone' => $tz])->save();

    return [$merchant, $owner];
}

afterEach(function () {
    Carbon::setTestNow(); // Reset any mock time
});

test('only authenticated customer can access vouchers', function () {
    $this->getJson('/api/customer/vouchers')
        ->assertStatus(401);
});

test('merchant user receives 403 on customer vouchers endpoint', function () {
    [$merchant, $owner] = createVoucherMerchant();

    $this->actingAs($owner, 'web')
        ->getJson('/api/customer/vouchers')
        ->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Forbidden. Customer access only.',
        ]);
});

test('customer only sees their own vouchers and clean source mapping', function () {
    $customerA = createVoucherCustomer();
    $customerB = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    // Customer A has 2 vouchers
    $voucherA1 = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customerA->id,
        'code' => 'VCH-A1-' . Str::random(8),
        'source_type' => 'visit_reward',
        'reward_title' => 'Free Americano',
        'reward_description' => 'A nice hot coffee',
        'reward_type' => 'free_item',
        'reward_value' => 250.00,
        'currency' => 'NPR',
        'status' => 'active',
        'issued_at' => now()->subDays(2),
        'expires_at' => now()->addDays(20),
    ]);

    $voucherA2 = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customerA->id,
        'code' => 'VCH-A2-' . Str::random(8),
        'source_type' => 'targeted_offer',
        'reward_title' => '20% Discount',
        'reward_type' => 'discount',
        'status' => 'active',
        'issued_at' => now()->subDay(),
        'expires_at' => now()->addDays(10),
    ]);

    // Customer B has 1 voucher
    $voucherB = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customerB->id,
        'code' => 'VCH-B1-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Customer B Reward',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now()->subDay(),
        'expires_at' => now()->addDays(5),
    ]);

    $res = $this->actingAs($customerA, 'web')->getJson('/api/customer/vouchers');
    $res->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Vouchers retrieved successfully.',
        ]);

    $codes = collect($res->json('data.vouchers'))->pluck('code')->all();
    expect($codes)->toContain($voucherA1->code)
        ->and($codes)->toContain($voucherA2->code)
        ->and($codes)->not->toContain($voucherB->code);

    // Verify clean source mapping and no raw source_type
    $firstItem = collect($res->json('data.vouchers'))->firstWhere('code', $voucherA1->code);
    expect($firstItem['source'])->toBe('stamp_card')
        ->and(array_key_exists('source_type', $firstItem))->toBeFalse();

    $secondItem = collect($res->json('data.vouchers'))->firstWhere('code', $voucherA2->code);
    expect($secondItem['source'])->toBe('offer');
});

test('status filter active returns only unexpired active vouchers', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    // 1. Truly active
    $active = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-ACT-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Active Item',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now()->subDays(2),
        'expires_at' => now()->addDays(15),
    ]);

    // 2. Active in DB, but expires_at is past (dynamically expired)
    $pastActive = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-PAST-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Past Item',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now()->subDays(20),
        'expires_at' => now()->subMinutes(10),
    ]);

    // 3. Redeemed
    $redeemed = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-RED-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Redeemed Item',
        'reward_type' => 'free_item',
        'status' => 'redeemed',
        'issued_at' => now()->subDays(10),
        'expires_at' => now()->addDays(5),
        'redeemed_at' => now()->subDays(1),
    ]);

    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?status=active');
    $res->assertStatus(200);

    $codes = collect($res->json('data.vouchers'))->pluck('code')->all();
    expect($codes)->toContain($active->code)
        ->and($codes)->not->toContain($pastActive->code)
        ->and($codes)->not->toContain($redeemed->code);
});

test('status filter used returns redeemed vouchers with redeemed_at date', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    $used = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-USED-' . Str::random(8),
        'source_type' => 'purchase_reward',
        'reward_title' => 'Redeemed Product',
        'reward_type' => 'free_item',
        'status' => 'redeemed',
        'issued_at' => now()->subDays(10),
        'expires_at' => now()->addDays(5),
        'redeemed_at' => now()->subDays(1),
    ]);

    $active = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-ACT-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Active Product',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now()->subDays(1),
        'expires_at' => now()->addDays(10),
    ]);

    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?status=used');
    $res->assertStatus(200);

    $vouchers = $res->json('data.vouchers');
    expect($vouchers)->toHaveCount(1)
        ->and($vouchers[0]['code'])->toBe($used->code)
        ->and($vouchers[0]['status'])->toBe('used')
        ->and($vouchers[0]['days_left'])->toBeNull()
        ->and($vouchers[0]['expiring_soon'])->toBeFalse()
        ->and($vouchers[0]['redeemed_at'])->not->toBeNull();
});

test('active voucher past expiry is listed as expired and database row is unchanged', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    $voucher = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-EXP-CHECK-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Expired Check',
        'reward_type' => 'free_item',
        'status' => 'active', // Active in database
        'issued_at' => now()->subDays(30),
        'expires_at' => now()->subDay(), // Past expiry
        'redeemed_at' => null,
    ]);

    // Request expired list
    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?status=expired');
    $res->assertStatus(200);

    $vouchers = $res->json('data.vouchers');
    expect($vouchers)->toHaveCount(1)
        ->and($vouchers[0]['code'])->toBe($voucher->code)
        ->and($vouchers[0]['status'])->toBe('expired')
        ->and($vouchers[0]['days_left'])->toBeNull()
        ->and($vouchers[0]['expiring_soon'])->toBeFalse();

    // CRITICAL: Ensure the database row status was NOT changed
    $voucherFresh = $voucher->fresh();
    expect($voucherFresh->status)->toBe('active');
});

test('summary counts cover all customer vouchers regardless of status filter', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    // 1 active
    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-SUM-1-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Active',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now(),
        'expires_at' => now()->addDays(10),
    ]);

    // 1 used
    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-SUM-2-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Used',
        'reward_type' => 'free_item',
        'status' => 'redeemed',
        'issued_at' => now()->subDays(5),
        'expires_at' => now()->addDays(5),
        'redeemed_at' => now()->subDay(),
    ]);

    // 1 explicitly expired
    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-SUM-3-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Expired',
        'reward_type' => 'free_item',
        'status' => 'expired',
        'issued_at' => now()->subDays(20),
        'expires_at' => now()->subDays(5),
    ]);

    // 1 dynamic expired (active in db but past expiry)
    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-SUM-4-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Dynamic Expired',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now()->subDays(20),
        'expires_at' => now()->subHour(),
    ]);

    // Query with filter = used
    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?status=used');
    $res->assertStatus(200);

    // Filtered list only has the 1 used voucher
    expect($res->json('data.vouchers'))->toHaveCount(1);

    // Summary counts cover ALL vouchers
    $summary = $res->json('data.summary');
    expect($summary['active'])->toBe(1)
        ->and($summary['used'])->toBe(1)
        ->and($summary['expired'])->toBe(2);
});

test('days_left and expiring_soon calculations and midnight timezone handling', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant('Asia/Kathmandu');

    // Freeze server time in UTC: 2026-11-22 18:30:00 UTC
    // In Kathmandu (UTC+5:45), this is 2026-11-23 00:15:00 (past midnight, calendar day is 23rd Nov)
    Carbon::setTestNow(Carbon::parse('2026-11-22 18:30:00', 'UTC'));

    // Voucher 1: expires on 2026-11-25 12:00:00 in Kathmandu -> 2 whole calendar days left (25 - 23 = 2)
    $v1 = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-DAYS-2-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => '2 Days Left',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now(),
        'expires_at' => Carbon::parse('2026-11-25 12:00:00', 'Asia/Kathmandu')->utc(),
    ]);

    // Voucher 2: expires on 2026-11-23 23:59:00 in Kathmandu (same calendar day) -> 0 days left
    $v2 = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-DAYS-0-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Expires Today',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now(),
        'expires_at' => Carbon::parse('2026-11-23 23:59:00', 'Asia/Kathmandu')->utc(),
    ]);

    // Voucher 3: expires in 10 days -> expiring_soon = false
    $v3 = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-DAYS-10-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => '10 Days Left',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now(),
        'expires_at' => Carbon::parse('2026-12-03 12:00:00', 'Asia/Kathmandu')->utc(),
    ]);

    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?status=active');
    $res->assertStatus(200);

    $items = collect($res->json('data.vouchers'));

    $item1 = $items->firstWhere('code', $v1->code);
    expect($item1['days_left'])->toBe(2)
        ->and($item1['expiring_soon'])->toBeTrue()
        ->and($item1['timezone'])->toBe('Asia/Kathmandu')
        ->and($item1['expires_at'])->toContain('+05:45');

    $item2 = $items->firstWhere('code', $v2->code);
    expect($item2['days_left'])->toBe(0)
        ->and($item2['expiring_soon'])->toBeTrue();

    $item3 = $items->firstWhere('code', $v3->code);
    expect($item3['days_left'])->toBe(10)
        ->and($item3['expiring_soon'])->toBeFalse();
});

test('pagination validates per_page and page parameters', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    for ($i = 1; $i <= 5; $i++) {
        Voucher::create([
            'merchant_id' => $merchant->id,
            'customer_id' => $customer->id,
            'code' => "VCH-PAGE-{$i}-" . Str::random(8),
            'source_type' => 'stamp_card',
            'reward_title' => "Reward {$i}",
            'reward_type' => 'free_item',
            'status' => 'active',
            'issued_at' => now()->subMinutes(10 - $i),
            'expires_at' => now()->addDays(20),
        ]);
    }

    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?page=2&per_page=2');
    $res->assertStatus(200);

    $data = $res->json('data');
    expect($data['vouchers'])->toHaveCount(2)
        ->and($data['pagination']['current_page'])->toBe(2)
        ->and($data['pagination']['per_page'])->toBe(2)
        ->and($data['pagination']['total'])->toBe(5)
        ->and($data['pagination']['last_page'])->toBe(3);
});

test('invalid query parameters return 422 with proper JSON error format', function () {
    $customer = createVoucherCustomer();

    $res = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?status=bogus_status');
    $res->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'The given data was invalid.',
        ])
        ->assertJsonValidationErrors(['status']);

    $res2 = $this->actingAs($customer, 'web')->getJson('/api/customer/vouchers?per_page=999');
    $res2->assertStatus(422)
        ->assertJsonValidationErrors(['per_page']);
});

test('get single voucher returns 200 with detailed reward snapshot', function () {
    $customer = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    $voucher = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-SINGLE-' . Str::random(8),
        'source_type' => 'quantity_reward',
        'reward_title' => 'Signature Blend Coffee Pack',
        'reward_description' => '250g whole bean roasted specialty coffee beans.',
        'reward_type' => 'free_item',
        'reward_value' => 850.00,
        'currency' => 'NPR',
        'status' => 'active',
        'issued_at' => now()->subDay(),
        'expires_at' => now()->addDays(14),
    ]);

    $res = $this->actingAs($customer, 'web')->getJson("/api/customer/vouchers/{$voucher->id}");
    $res->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Voucher details retrieved successfully.',
            'data' => [
                'voucher' => [
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'status' => 'active',
                    'source' => 'stamp_card',
                    'reward_title' => 'Signature Blend Coffee Pack',
                    'reward_description' => '250g whole bean roasted specialty coffee beans.',
                    'reward_type' => 'free_item',
                    'reward_value' => 850.0,
                    'currency' => 'NPR',
                    'business' => [
                        'name' => $merchant->business_name,
                        'slug' => $merchant->slug,
                    ],
                    'timezone' => 'Asia/Kathmandu',
                ],
            ],
        ]);
});

test('single voucher endpoint returns 404 for non-existent or other customer voucher', function () {
    $customerA = createVoucherCustomer();
    $customerB = createVoucherCustomer();
    [$merchant] = createVoucherMerchant();

    $voucherB = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customerB->id,
        'code' => 'VCH-SECRET-B-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Customer B Reward',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now(),
        'expires_at' => now()->addDays(5),
    ]);

    // Unknown voucher
    $this->actingAs($customerA, 'web')->getJson('/api/customer/vouchers/999999')
        ->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Voucher not found.',
        ]);

    // Customer A tries to access Customer B's voucher -> 404 (never 403)
    $this->actingAs($customerA, 'web')->getJson("/api/customer/vouchers/{$voucherB->id}")
        ->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Voucher not found.',
        ]);
});

test('response does not expose internal sensitive or staff fields', function () {
    $customer = createVoucherCustomer();
    [$merchant, $owner] = createVoucherMerchant();

    $voucher = Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-SENSITIVE-' . Str::random(8),
        'source_type' => 'stamp_card',
        'reward_title' => 'Safe Item',
        'reward_type' => 'free_item',
        'status' => 'redeemed',
        'issued_at' => now()->subDays(5),
        'expires_at' => now()->addDays(5),
        'redeemed_at' => now()->subDay(),
    ]);

    VoucherRedemption::create([
        'voucher_id' => $voucher->id,
        'merchant_id' => $merchant->id,
        'redeemed_by' => $owner->id,
        'redeemed_at' => now()->subDay(),
    ]);

    $res = $this->actingAs($customer, 'web')->getJson("/api/customer/vouchers/{$voucher->id}");
    $res->assertStatus(200);

    $voucherData = $res->json('data.voucher');
    expect(array_key_exists('redeemed_by', $voucherData))->toBeFalse()
        ->and(array_key_exists('user_id', $voucherData))->toBeFalse()
        ->and(array_key_exists('source_type', $voucherData))->toBeFalse()
        ->and(array_key_exists('owner', $voucherData['business']))->toBeFalse();
});
