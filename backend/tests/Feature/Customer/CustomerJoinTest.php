<?php

use App\Models\EarningRule;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\User;
use App\Models\UserMerchantStat;
use Carbon\Carbon;
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
 * Helper to create a test customer.
 */
function createJoinCustomer(): User
{
    return User::create([
        'name' => 'Join Customer ' . uniqid(),
        'email' => 'cust_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);
}

/**
 * Helper to create a merchant with an active loyalty program and version.
 */
function createJoinMerchantWithProgram(array $merchantAttrs = [], array $programAttrs = [], array $versionAttrs = []): array
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
        'timezone' => 'Asia/Kathmandu',
        'status' => 'active',
    ], $merchantAttrs));
    $merchant->save();

    $program = LoyaltyProgram::create(array_merge([
        'merchant_id' => $merchant->id,
        'name' => 'Coffee Stamp Card ' . uniqid(),
        'description' => 'Earn free coffee',
        'status' => 'active',
    ], $programAttrs));

    $version = LoyaltyProgramVersion::create(array_merge([
        'loyalty_program_id' => $program->id,
        'version_number' => 1,
        'status' => 'active',
        'effective_at' => now(),
        'issues_voucher' => true,
    ], $versionAttrs));

    $earningRule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'visit',
        'threshold' => 10,
        'stamps_awarded' => 1,
    ]);

    $reward = Reward::create([
        'program_version_id' => $version->id,
        'title' => 'Free Cappuccino',
        'reward_type' => 'free_item',
        'reward_value' => 250,
        'voucher_validity_days' => 30,
    ]);

    return [$merchant, $program, $version, $earningRule, $reward, $owner];
}

test('join creates an active card with 0 stamps on the programs current version', function () {
    $customer = createJoinCustomer();
    [$merchant, $program, $version] = createJoinMerchantWithProgram();

    $response = $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$program->id}/join");

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Joined loyalty program successfully.',
            'data' => [
                'already_joined' => false,
                'card' => [
                    'status' => 'active',
                    'stamps_earned' => 0,
                    'program' => [
                        'id' => $program->id,
                        'name' => $program->name,
                    ],
                    'business' => [
                        'id' => $merchant->id,
                        'name' => $merchant->business_name,
                        'slug' => $merchant->slug,
                    ],
                ],
            ],
        ]);

    $cardId = $response->json('data.card.id');
    expect($cardId)->toBeInt();

    $card = StampCard::find($cardId);
    expect($card)->not->toBeNull()
        ->and($card->customer_id)->toBe($customer->id)
        ->and($card->loyalty_program_id)->toBe($program->id)
        ->and($card->program_version_id)->toBe($version->id)
        ->and($card->stamps_earned)->toBe(0)
        ->and($card->status)->toBe('active')
        ->and($card->started_at)->not->toBeNull();
});

test('joining twice gives one card and already_joined true', function () {
    $customer = createJoinCustomer();
    [$merchant, $program] = createJoinMerchantWithProgram();

    // First join -> 201
    $firstResponse = $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$program->id}/join");
    $firstResponse->assertStatus(201);
    $cardId = $firstResponse->json('data.card.id');

    // Second join -> 200 with already_joined: true and same card ID
    $secondResponse = $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$program->id}/join");

    $secondResponse->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'You have already joined this loyalty program.',
            'data' => [
                'already_joined' => true,
                'card' => [
                    'id' => $cardId,
                    'status' => 'active',
                ],
            ],
        ]);

    // Ensure only 1 stamp card exists in DB
    $cardsCount = StampCard::where('customer_id', $customer->id)
        ->where('loyalty_program_id', $program->id)
        ->count();
    expect($cardsCount)->toBe(1);
});

test('two consecutive or rapid joins result in exactly one active stamp card', function () {
    $customer = createJoinCustomer();
    [$merchant, $program] = createJoinMerchantWithProgram();

    $res1 = $this->actingAs($customer)->postJson("/api/customer/programs/{$program->id}/join");
    $res2 = $this->actingAs($customer)->postJson("/api/customer/programs/{$program->id}/join");

    expect($res1->status())->toBe(201)
        ->and($res2->status())->toBe(200)
        ->and($res1->json('data.card.id'))->toBe($res2->json('data.card.id'));

    $count = StampCard::where('customer_id', $customer->id)
        ->where('loyalty_program_id', $program->id)
        ->count();
    expect($count)->toBe(1);
});

test('an existing stats row is not changed during join', function () {
    $customer = createJoinCustomer();
    [$merchant, $program] = createJoinMerchantWithProgram();

    // Pre-existing stats row with high streaks
    $existingStat = UserMerchantStat::create([
        'customer_id' => $customer->id,
        'merchant_id' => $merchant->id,
        'current_streak' => 5,
        'longest_streak' => 12,
        'last_qualifying_visit_date' => Carbon::now()->subDay()->format('Y-m-d'),
    ]);

    $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$program->id}/join")
        ->assertStatus(201);

    $freshStat = $existingStat->fresh();
    expect($freshStat->current_streak)->toBe(5)
        ->and($freshStat->longest_streak)->toBe(12)
        ->and($freshStat->last_qualifying_visit_date?->format('Y-m-d'))->toBe(Carbon::now()->subDay()->format('Y-m-d'));
});

test('a missing stats row is created with zeros on join', function () {
    $customer = createJoinCustomer();
    [$merchant, $program] = createJoinMerchantWithProgram();

    expect(UserMerchantStat::where('customer_id', $customer->id)->where('merchant_id', $merchant->id)->exists())->toBeFalse();

    $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$program->id}/join")
        ->assertStatus(201);

    $stat = UserMerchantStat::where('customer_id', $customer->id)
        ->where('merchant_id', $merchant->id)
        ->first();

    expect($stat)->not->toBeNull()
        ->and($stat->current_streak)->toBe(0)
        ->and($stat->longest_streak)->toBe(0)
        ->and($stat->last_qualifying_visit_date)->toBeNull();
});

test('inactive, archived, suspended-business and unknown programs return 404', function () {
    $customer = createJoinCustomer();

    // 1. Unknown program ID
    $this->actingAs($customer)
        ->postJson("/api/customer/programs/999999/join")
        ->assertStatus(404)
        ->assertJson(['success' => false, 'message' => 'Program not found.']);

    // 2. Inactive program
    [$merchantActive, $inactiveProgram] = createJoinMerchantWithProgram([], ['status' => 'inactive']);
    $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$inactiveProgram->id}/join")
        ->assertStatus(404);

    // 3. Archived program
    [$merchantActive2, $archivedProgram] = createJoinMerchantWithProgram([], ['status' => 'archived']);
    $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$archivedProgram->id}/join")
        ->assertStatus(404);

    // 4. Program belonging to a suspended business
    [$suspendedMerchant, $programOfSuspended] = createJoinMerchantWithProgram(['status' => 'suspended']);
    $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$programOfSuspended->id}/join")
        ->assertStatus(404);

    // 5. Program with no active version
    [$merchant3, $programNoVersion, $v] = createJoinMerchantWithProgram();
    $v->update(['status' => 'archived']);
    $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$programNoVersion->id}/join")
        ->assertStatus(404);
});

test('a card created after a program gets a new version uses the newest version while older card keeps its own', function () {
    [$merchant, $program, $v1] = createJoinMerchantWithProgram();

    // Customer 1 already has a card under version 1
    $customer1 = createJoinCustomer();
    $card1 = StampCard::create([
        'customer_id' => $customer1->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $v1->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    // Merchant releases version 2
    $v2 = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $program->id,
        'version_number' => 2,
        'status' => 'active',
        'effective_at' => now()->subMinute(),
        'issues_voucher' => true,
    ]);

    // Customer 2 joins now under version 2
    $customer2 = createJoinCustomer();
    $res2 = $this->actingAs($customer2)->postJson("/api/customer/programs/{$program->id}/join");
    $res2->assertStatus(201);
    $card2Id = $res2->json('data.card.id');
    $card2 = StampCard::find($card2Id);

    expect($card2->program_version_id)->toBe($v2->id);
    // Old card still retains original version 1
    expect($card1->fresh()->program_version_id)->toBe($v1->id);
});

test('bulk join returns correct per-program results preserving input order', function () {
    $customer = createJoinCustomer();
    [$merchantA, $progA] = createJoinMerchantWithProgram();
    [$merchantB, $progB] = createJoinMerchantWithProgram();
    [$suspendedMerchant, $progSuspended] = createJoinMerchantWithProgram(['status' => 'suspended']);

    // Customer has already joined progA
    StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $progA->id,
        'program_version_id' => $progA->versions->first()->id,
        'stamps_earned' => 2,
        'status' => 'active',
        'started_at' => now(),
    ]);

    $payload = [
        'program_ids' => [
            $progB->id,          // fresh -> joined
            $progA->id,          // existing -> already_joined
            $progSuspended->id,  // suspended biz -> unavailable
            999999,              // non-existent -> unavailable
        ],
    ];

    $response = $this->actingAs($customer)
        ->postJson('/api/customer/programs/join', $payload);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Programs processed successfully.',
            'data' => [
                'results' => [
                    [
                        'program_id' => $progB->id,
                        'status' => 'joined',
                        'program_name' => $progB->name,
                    ],
                    [
                        'program_id' => $progA->id,
                        'status' => 'already_joined',
                        'program_name' => $progA->name,
                    ],
                    [
                        'program_id' => $progSuspended->id,
                        'status' => 'unavailable',
                        'card_id' => null,
                    ],
                    [
                        'program_id' => 999999,
                        'status' => 'unavailable',
                        'card_id' => null,
                    ],
                ],
            ],
        ]);

    // ProgB card was created
    expect(StampCard::where('customer_id', $customer->id)->where('loyalty_program_id', $progB->id)->exists())->toBeTrue();
});

test('bulk join rejects more than 10 ids or duplicate ids with 422', function () {
    $customer = createJoinCustomer();

    // 1. More than 10 IDs
    $responseTooMany = $this->actingAs($customer)
        ->postJson('/api/customer/programs/join', [
            'program_ids' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        ]);
    $responseTooMany->assertStatus(422)
        ->assertJsonValidationErrors(['program_ids']);

    // 2. Duplicate IDs
    $responseDuplicates = $this->actingAs($customer)
        ->postJson('/api/customer/programs/join', [
            'program_ids' => [1, 2, 1],
        ]);
    $responseDuplicates->assertStatus(422)
        ->assertJsonValidationErrors(['program_ids']);

    // 3. Empty array
    $responseEmpty = $this->actingAs($customer)
        ->postJson('/api/customer/programs/join', [
            'program_ids' => [],
        ]);
    $responseEmpty->assertStatus(422)
        ->assertJsonValidationErrors(['program_ids']);
});

test('merchant gets 403 when attempting customer join', function () {
    [$merchant, $program, , , , $owner] = createJoinMerchantWithProgram();

    $this->actingAs($owner)
        ->postJson("/api/customer/programs/{$program->id}/join")
        ->assertStatus(403);

    $this->actingAs($owner)
        ->postJson('/api/customer/programs/join', ['program_ids' => [$program->id]])
        ->assertStatus(403);
});

test('logged-out user gets 401 when attempting customer join', function () {
    [$merchant, $program] = createJoinMerchantWithProgram();

    $this->postJson("/api/customer/programs/{$program->id}/join")
        ->assertStatus(401);

    $this->postJson('/api/customer/programs/join', ['program_ids' => [$program->id]])
        ->assertStatus(401);
});

test('no private fields in customer join response', function () {
    $customer = createJoinCustomer();
    [$merchant, $program] = createJoinMerchantWithProgram();

    $response = $this->actingAs($customer)
        ->postJson("/api/customer/programs/{$program->id}/join");

    $response->assertStatus(201);
    $json = $response->getContent();

    expect($json)->not->toContain('password')
        ->and($json)->not->toContain('token_hash')
        ->and($json)->not->toContain('remember_token')
        ->and($json)->not->toContain('user_id');
});
