<?php

use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\User;
use App\Models\UserMerchantStat;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

function createAdminTester(): User
{
    return User::create([
        'name' => 'Admin Merchant Tester',
        'email' => 'admin_merch_' . uniqid() . '@example.com',
        'password' => Hash::make('secretpass123'),
        'role' => 'superadmin',
    ]);
}

test('admin can list merchants with search, filters and pagination', function () {
    $admin = createAdminTester();

    $owner = User::create([
        'name' => 'Owner Alpha',
        'email' => 'owner_alpha_' . uniqid() . '@example.com',
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $owner->id,
        'business_name' => 'Alpha Special Cafe',
        'slug' => 'alpha-special-cafe-' . uniqid(),
        'status' => 'active',
    ]);
    $merchant->is_pro = true;
    $merchant->save();

    // Search by business name
    $resSearch = $this->actingAs($admin)
        ->getJson('/api/admin/merchants?search=Alpha Special')
        ->assertStatus(200);

    expect(collect($resSearch->json('data.merchants'))->pluck('id'))->toContain($merchant->id);

    // Search with special LIKE characters (% and _)
    $resEscaped = $this->actingAs($admin)
        ->getJson('/api/admin/merchants?search=%')
        ->assertStatus(200);

    // Filter by status
    $resActive = $this->actingAs($admin)
        ->getJson('/api/admin/merchants?status=active')
        ->assertStatus(200);
    expect(collect($resActive->json('data.merchants'))->pluck('id'))->toContain($merchant->id);

    // Filter by pro
    $resPro = $this->actingAs($admin)
        ->getJson('/api/admin/merchants?pro=yes')
        ->assertStatus(200);
    expect(collect($resPro->json('data.merchants'))->pluck('id'))->toContain($merchant->id);

    // Pagination capped at 50
    $resPage = $this->actingAs($admin)
        ->getJson('/api/admin/merchants?per_page=100')
        ->assertStatus(200);
    expect($resPage->json('data.pagination.per_page'))->toBe(50);

    // List item contains owner name and email only (no phone)
    $firstItem = collect($resSearch->json('data.merchants'))->firstWhere('id', $merchant->id);
    expect($firstItem['owner'])->toHaveKeys(['name', 'email']);
    expect($firstItem['owner'])->not->toHaveKey('phone');
});

test('admin can view merchant details with counts and recent activity', function () {
    $admin = createAdminTester();

    $owner = User::create([
        'name' => 'Owner Beta',
        'email' => 'owner_beta_' . uniqid() . '@example.com',
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $owner->id,
        'business_name' => 'Beta Bakery',
        'slug' => 'beta-bakery-' . uniqid(),
        'status' => 'active',
        'is_pro' => false,
    ]);

    $customer = User::create([
        'name' => 'Customer Beta',
        'email' => 'cust_beta_' . uniqid() . '@example.com',
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    UserMerchantStat::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'current_streak' => 2,
        'longest_streak' => 3,
    ]);

    $program = LoyaltyProgram::create([
        'merchant_id' => $merchant->id,
        'name' => 'Beta Club',
        'status' => 'active',
    ]);

    $version = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $program->id,
        'version_number' => 1,
        'stamps_to_complete' => 8,
        'status' => 'active',
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 4,
        'status' => 'active',
    ]);

    StampTransaction::create([
        'stamp_card_id' => $card->id,
        'program_version_id' => $version->id,
        'source_type' => 'visit',
        'source_id' => 999,
        'stamps_awarded' => 4,
    ]);

    Voucher::create([
        'merchant_id' => $merchant->id,
        'customer_id' => $customer->id,
        'code' => 'VCH-BETA-' . uniqid(),
        'source_type' => 'stamp_card',
        'reward_title' => 'Free Croissant',
        'reward_type' => 'free_item',
        'status' => 'active',
        'issued_at' => now(),
        'expires_at' => now()->addDays(30),
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/merchants/' . $merchant->id);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $merchant->id,
                'business_name' => 'Beta Bakery',
                'stats' => [
                    'programs_total' => 1,
                    'programs_active' => 1,
                    'customers_count' => 1,
                    'stamps_awarded' => 4,
                    'vouchers_issued' => 1,
                    'vouchers_redeemed' => 0,
                ],
            ],
            'message' => 'Merchant details retrieved successfully.',
        ]);

    $activity = $response->json('data.recent_activity');
    expect($activity)->toHaveCount(1);
    expect($activity[0]['stamps_awarded'])->toBe(4);
    expect($activity[0]['customer']['name'])->toBe('Customer Beta');
});

test('admin can update merchant status, writes audit log, and affects customer endpoints', function () {
    Log::spy();
    $admin = createAdminTester();

    $owner = User::create([
        'name' => 'Owner Gamma',
        'email' => 'owner_gamma_' . uniqid() . '@example.com',
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $owner->id,
        'business_name' => 'Gamma Gym',
        'slug' => 'gamma-gym-' . uniqid(),
        'status' => 'active',
        'is_pro' => false,
    ]);

    $program = LoyaltyProgram::create([
        'merchant_id' => $merchant->id,
        'name' => 'Gamma Fitness Club',
        'status' => 'active',
    ]);

    $customer = User::create([
        'name' => 'Customer Gamma',
        'email' => 'cust_gamma_' . uniqid() . '@example.com',
        'role' => 'customer',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    // Customer directory shows active merchant
    $this->actingAs($customer)
        ->getJson('/api/customer/businesses')
        ->assertStatus(200)
        ->assertJsonFragment(['slug' => $merchant->slug]);

    // Suspend the merchant
    $this->flushSession();
    $patchRes = $this->actingAs($admin)
        ->patchJson('/api/admin/merchants/' . $merchant->id . '/status', [
            'status' => 'suspended',
        ]);

    $patchRes->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $merchant->id,
                'status' => 'suspended',
            ],
            'message' => 'Merchant status updated successfully.',
        ]);

    expect($merchant->fresh()->status)->toBe('suspended');

    // Audit log was written
    Log::shouldHaveReceived('info')->withArgs(function ($message, $context) use ($admin, $merchant) {
        return str_contains($message, '[admin.merchant.status_updated]')
            && $context['admin_id'] === $admin->id
            && $context['merchant_id'] === $merchant->id
            && $context['old_value'] === 'active'
            && $context['new_value'] === 'suspended';
    });

    // Customer directory now hides the suspended merchant
    $this->flushSession();
    $this->actingAs($customer)
        ->getJson('/api/customer/businesses')
        ->assertStatus(200)
        ->assertJsonMissing(['slug' => $merchant->slug]);

    // Customer program details returns 404 for suspended business
    $this->actingAs($customer)
        ->getJson('/api/customer/programs/' . $program->id)
        ->assertStatus(404);

    // Customer join returns 404 for suspended business
    $this->actingAs($customer)
        ->postJson('/api/customer/join', ['loyalty_program_id' => $program->id])
        ->assertStatus(404);

    // Re-activate merchant
    $this->flushSession();
    $this->actingAs($admin)
        ->patchJson('/api/admin/merchants/' . $merchant->id . '/status', [
            'status' => 'active',
        ])
        ->assertStatus(200);

    expect($merchant->fresh()->status)->toBe('active');
});

test('admin can update merchant pro and writes audit log', function () {
    Log::spy();
    $admin = createAdminTester();

    $owner = User::create([
        'name' => 'Owner Delta',
        'email' => 'owner_delta_' . uniqid() . '@example.com',
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $owner->id,
        'business_name' => 'Delta Dining',
        'slug' => 'delta-dining-' . uniqid(),
        'status' => 'active',
        'is_pro' => false,
    ]);

    $response = $this->actingAs($admin)
        ->patchJson('/api/admin/merchants/' . $merchant->id . '/pro', [
            'is_pro' => true,
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $merchant->id,
                'is_pro' => true,
            ],
            'message' => 'Merchant pro status updated successfully.',
        ]);

    expect($merchant->fresh()->is_pro)->toBe(1);

    Log::shouldHaveReceived('info')->withArgs(function ($message, $context) use ($admin, $merchant) {
        return str_contains($message, '[admin.merchant.pro_updated]')
            && $context['admin_id'] === $admin->id
            && $context['merchant_id'] === $merchant->id
            && $context['old_value'] === false
            && $context['new_value'] === true;
    });
});

test('unknown merchant returns 404 and invalid status returns 422', function () {
    $admin = createAdminTester();

    $this->actingAs($admin)
        ->getJson('/api/admin/merchants/999999')
        ->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Merchant not found.']);

    $this->actingAs($admin)
        ->patchJson('/api/admin/merchants/999999/status', ['status' => 'active'])
        ->assertStatus(404);

    $owner = User::create([
        'name' => 'Owner Valid',
        'email' => 'owner_valid_' . uniqid() . '@example.com',
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $owner->id,
        'business_name' => 'Valid Biz',
        'slug' => 'valid-biz-' . uniqid(),
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->patchJson('/api/admin/merchants/' . $merchant->id . '/status', ['status' => 'invalid_status'])
        ->assertStatus(422)
        ->assertJson(['success' => false]);
});
