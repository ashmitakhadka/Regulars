<?php

use App\Models\EarningRule;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\MerchantQrCode;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->withHeaders([
        'Origin' => 'http://localhost:5173',
        'referer' => 'http://localhost:5173',
        'Accept' => 'application/json',
    ]);
});

/**
 * Helper to create a customer user and authenticate via Sanctum.
 */
function createCustomerUser(): User
{
    $customer = User::create([
        'name' => 'Test Customer',
        'email' => 'cust_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);

    return $customer;
}

/**
 * Helper to create a merchant with an active program and version.
 */
function createMerchantWithProgram(array $merchantAttrs = [], array $programAttrs = [], array $earningAttrs = []): array
{
    $owner = User::create([
        'name' => 'Owner ' . uniqid(),
        'email' => 'owner_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'merchant',
    ]);

    $merchant = (new Merchant)->forceFill(array_merge([
        'user_id' => $owner->id,
        'business_name' => 'Test Cafe ' . uniqid(),
        'category' => 'cafe',
        'slug' => 'test-cafe-' . uniqid(),
        'description' => 'Test cafe description',
        'address' => 'Kathmandu, Nepal',
        'status' => 'active',
    ], $merchantAttrs));
    $merchant->save();

    // QR code with private token_hash to ensure it never leaks
    MerchantQrCode::create([
        'merchant_id' => $merchant->id,
        'type' => 'business',
        'token_hash' => hash('sha256', 'secret-token-' . uniqid()),
        'is_active' => true,
    ]);

    $program = LoyaltyProgram::create(array_merge([
        'merchant_id' => $merchant->id,
        'name' => 'Coffee Stamp Card',
        'description' => 'Collect 10 stamps for free coffee',
        'status' => 'active',
    ], $programAttrs));

    $version = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $program->id,
        'version_number' => 1,
        'status' => 'active',
        'effective_at' => now(),
    ]);

    $earningRule = EarningRule::create(array_merge([
        'program_version_id' => $version->id,
        'earning_type' => 'visit',
        'threshold' => 10,
        'stamps_awarded' => 1,
        'daily_stamp_limit' => 1,
    ], $earningAttrs));

    $reward = Reward::create([
        'program_version_id' => $version->id,
        'title' => 'Free Cappuccino',
        'description' => 'Any regular size cappuccino',
        'reward_type' => 'free_item',
        'reward_value' => 250.00,
        'voucher_validity_days' => 30,
    ]);

    return compact('owner', 'merchant', 'program', 'version', 'earningRule', 'reward');
}

test('directory shows only active businesses with at least one active program', function () {
    $customer = createCustomerUser();

    // 1. Active merchant with active program (should appear)
    $activeData = createMerchantWithProgram(['business_name' => 'Alpha Himalayan Cafe']);

    // 2. Suspended merchant with active program (must be hidden)
    $suspendedData = createMerchantWithProgram([
        'business_name' => 'Suspended Beta Bakery',
        'status' => 'suspended',
    ]);

    // 3. Active merchant with archived program only (must be hidden)
    $archivedData = createMerchantWithProgram(
        ['business_name' => 'Archived Gamma Salon'],
        ['status' => 'archived']
    );

    // 4. Active merchant with paused/inactive program only (must be hidden)
    $pausedData = createMerchantWithProgram(
        ['business_name' => 'Paused Delta Gym'],
        ['status' => 'inactive']
    );

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/businesses');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'slug',
                    'business_name',
                    'category',
                    'short_description',
                    'address',
                    'logo',
                    'active_programs_count',
                ],
            ],
            'pagination' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
            'message',
        ]);

    $slugs = collect($response->json('data'))->pluck('slug');

    expect($slugs)->toContain($activeData['merchant']->slug)
        ->and($slugs)->not->toContain($suspendedData['merchant']->slug)
        ->and($slugs)->not->toContain($archivedData['merchant']->slug)
        ->and($slugs)->not->toContain($pausedData['merchant']->slug);
});

test('business search by name works properly', function () {
    $customer = createCustomerUser();

    $cafeA = createMerchantWithProgram(['business_name' => 'Everest Roasters Special']);
    $cafeB = createMerchantWithProgram(['business_name' => 'Annapurna Trekking Brew']);

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/businesses?search=Everest');

    $response->assertStatus(200);
    $names = collect($response->json('data'))->pluck('business_name');

    expect($names)->toContain('Everest Roasters Special')
        ->and($names)->not->toContain('Annapurna Trekking Brew');
});

test('category filter works and safely handles null category merchants', function () {
    $customer = createCustomerUser();

    $cafe = createMerchantWithProgram(['business_name' => 'Kathmandu Coffee Shop', 'category' => 'cafe']);
    $salon = createMerchantWithProgram(['business_name' => 'Lalitpur Hair Studio', 'category' => 'salon']);
    $noCategory = createMerchantWithProgram(['business_name' => 'Uncategorized Spot', 'category' => null]);

    // Filter by cafe
    $response = $this->actingAs($customer)
        ->getJson('/api/customer/businesses?category=cafe');

    $response->assertStatus(200);
    $slugs = collect($response->json('data'))->pluck('slug');

    expect($slugs)->toContain($cafe['merchant']->slug)
        ->and($slugs)->not->toContain($salon['merchant']->slug)
        ->and($slugs)->not->toContain($noCategory['merchant']->slug);
});

test('directory pagination options work with page and per_page limits', function () {
    $customer = createCustomerUser();

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/businesses?per_page=2&page=1');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'pagination' => [
                'current_page' => 1,
                'per_page' => 2,
            ],
        ]);

    expect(count($response->json('data')))->toBeLessThanOrEqual(2);
});

test('business details endpoint returns active programs and excludes archived ones', function () {
    $customer = createCustomerUser();
    $data = createMerchantWithProgram(['business_name' => 'Signature Blend Cafe']);

    // Add an archived program to the same merchant
    LoyaltyProgram::create([
        'merchant_id' => $data['merchant']->id,
        'name' => 'Expired Summer Card',
        'status' => 'archived',
    ]);

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/businesses/' . $data['merchant']->slug);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $data['merchant']->id,
                'slug' => $data['merchant']->slug,
                'business_name' => 'Signature Blend Cafe',
            ],
        ]);

    $programs = collect($response->json('data.programs'));
    $programNames = $programs->pluck('name');

    expect($programNames)->toContain('Coffee Stamp Card')
        ->and($programNames)->not->toContain('Expired Summer Card');

    // Check visit-based program fields
    $activeProg = $programs->firstWhere('name', 'Coffee Stamp Card');
    expect($activeProg['earning_method'])->toBe('visit')
        ->and($activeProg['stamps_required'])->toBe(10)
        ->and($activeProg['reward']['title'])->toBe('Free Cappuccino')
        ->and($activeProg['joined'])->toBeFalse()
        ->and($activeProg['card_id'])->toBeNull();
});

test('business details show joined true and card id when customer has an active card', function () {
    $customer = createCustomerUser();
    $data = createMerchantWithProgram(['business_name' => 'Patan Roastery']);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $data['program']->id,
        'program_version_id' => $data['version']->id,
        'stamps_earned' => 5,
        'status' => 'active',
        'started_at' => now(),
    ]);

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/businesses/' . $data['merchant']->slug);

    $response->assertStatus(200);
    $activeProg = collect($response->json('data.programs'))->firstWhere('id', $data['program']->id);

    expect($activeProg['joined'])->toBeTrue()
        ->and($activeProg['card_id'])->toBe($card->id);
});

test('business details return 404 for unknown slug or suspended business', function () {
    $customer = createCustomerUser();

    // Unknown slug
    $this->actingAs($customer)
        ->getJson('/api/customer/businesses/non-existent-slug')
        ->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Business not found.']);

    // Suspended business
    $suspended = createMerchantWithProgram(['status' => 'suspended']);
    $this->actingAs($customer)
        ->getJson('/api/customer/businesses/' . $suspended['merchant']->slug)
        ->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Business not found.']);
});

test('program details endpoint returns correct program, reward, and customer card progress', function () {
    $customer = createCustomerUser();
    $data = createMerchantWithProgram();

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $data['program']->id,
        'program_version_id' => $data['version']->id,
        'stamps_earned' => 7,
        'status' => 'active',
        'started_at' => now(),
    ]);

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/programs/' . $data['program']->id);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $data['program']->id,
                'name' => $data['program']->name,
                'business_name' => $data['merchant']->business_name,
                'business_slug' => $data['merchant']->slug,
                'earning_method' => 'visit',
                'stamps_required' => 10,
                'joined' => true,
                'my_card' => [
                    'card_id' => $card->id,
                    'stamps_earned' => 7,
                    'status' => 'active',
                ],
            ],
            'message' => 'Program retrieved successfully.',
        ]);
});

test('program details return 404 for archived program or program of suspended business', function () {
    $customer = createCustomerUser();

    // 1. Archived program
    $archived = createMerchantWithProgram([], ['status' => 'archived']);
    $this->actingAs($customer)
        ->getJson('/api/customer/programs/' . $archived['program']->id)
        ->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Program not found.']);

    // 2. Program of suspended merchant
    $suspended = createMerchantWithProgram(['status' => 'suspended'], ['status' => 'active']);
    $this->actingAs($customer)
        ->getJson('/api/customer/programs/' . $suspended['program']->id)
        ->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Program not found.']);
});

test('no private fields are exposed in business directory or program details responses', function () {
    $customer = createCustomerUser();
    $data = createMerchantWithProgram();

    // 1. Directory List
    $listRes = $this->actingAs($customer)->getJson('/api/customer/businesses');
    $listJson = json_encode($listRes->json());

    expect($listJson)->not->toContain('user_id')
        ->and($listJson)->not->toContain('token_hash')
        ->and($listJson)->not->toContain('password')
        ->and($listJson)->not->toContain($data['owner']->email);

    // 2. Business Details
    $detailRes = $this->actingAs($customer)->getJson('/api/customer/businesses/' . $data['merchant']->slug);
    $detailJson = json_encode($detailRes->json());

    expect($detailJson)->not->toContain('user_id')
        ->and($detailJson)->not->toContain('token_hash')
        ->and($detailJson)->not->toContain('password')
        ->and($detailJson)->not->toContain($data['owner']->email);

    // 3. Program Details
    $progRes = $this->actingAs($customer)->getJson('/api/customer/programs/' . $data['program']->id);
    $progJson = json_encode($progRes->json());

    expect($progJson)->not->toContain('user_id')
        ->and($progJson)->not->toContain('token_hash')
        ->and($progJson)->not->toContain('password')
        ->and($progJson)->not->toContain($data['owner']->email);
});

test('merchant user gets 403 on customer directory and program endpoints', function () {
    $merchantUser = User::create([
        'name' => 'Merchant Owner',
        'email' => 'merchant_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'role' => 'merchant',
    ]);

    $this->actingAs($merchantUser)
        ->getJson('/api/customer/businesses')
        ->assertStatus(403);

    $this->actingAs($merchantUser)
        ->getJson('/api/customer/businesses/any-slug')
        ->assertStatus(403);

    $this->actingAs($merchantUser)
        ->getJson('/api/customer/programs/1')
        ->assertStatus(403);
});

test('unauthenticated user gets 401 on customer directory and program endpoints', function () {
    $this->getJson('/api/customer/businesses')
        ->assertStatus(401);

    $this->getJson('/api/customer/businesses/any-slug')
        ->assertStatus(401);

    $this->getJson('/api/customer/programs/1')
        ->assertStatus(401);
});
