<?php

use App\Models\EarningRule;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\User;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

uses(DatabaseTransactions::class);

function createMerchantAndCustomer(): array
{
    $merchantUser = User::create([
        'name' => 'Merchant Owner',
        'email' => 'merchant_' . Str::random(8) . '@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'merchant',
    ]);

    $merchant = Merchant::create([
        'user_id' => $merchantUser->id,
        'business_name' => 'Cafe Himalaya',
        'slug' => 'cafe-himalaya-' . Str::random(6),
        'timezone' => 'Asia/Kathmandu',
        'currency' => 'NPR',
        'status' => 'active',
    ]);

    $customerUser = User::create([
        'name' => 'John Customer',
        'email' => 'customer_' . Str::random(8) . '@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'customer',
        'customer_code' => 'RG-' . Str::upper(Str::random(6)),
    ]);

    return [$merchantUser, $merchant, $customerUser];
}

function createProgramWithVersion(
    Merchant $merchant,
    string $earningType,
    bool $issuesVoucher = true
): array {
    $program = LoyaltyProgram::create([
        'merchant_id' => $merchant->id,
        'name' => 'Himalaya Rewards ' . Str::random(4),
        'status' => 'active',
    ]);

    $version = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $program->id,
        'version_number' => 1,
        'status' => 'active',
        'effective_at' => now(),
        'issues_voucher' => $issuesVoucher,
    ]);

    return [$program, $version];
}

/*
|--------------------------------------------------------------------------
| Visit-Based Tests
|--------------------------------------------------------------------------
*/

test('visit reward completes after configured number of visits and issues voucher when enabled', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'visit', true);

    // Earning rule: 3 visits required, 2 stamps awarded per visit
    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'visit',
        'threshold' => 3, // 3 visits
        'stamps_awarded' => 2, // 2 stamps per visit
    ]);

    $reward = Reward::create([
        'program_version_id' => $version->id,
        'title' => 'Free Hot Cappuccino',
        'reward_type' => 'free_item',
        'reward_value' => 0,
        'voucher_validity_days' => 15,
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Visit 1: Awards 2 stamps, card remains active, no voucher
    $res1 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
    ]);
    $res1->assertStatus(201);
    expect($res1->json('stamps_awarded'))->toBe(2)
        ->and($res1->json('total_stamps'))->toBe(2)
        ->and($res1->json('card_status'))->toBe('active')
        ->and($res1->json('vouchers_issued'))->toBe(0);

    // Visit 2: Awards 2 stamps (total 4), card remains active, no voucher
    $res2 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
    ]);
    $res2->assertStatus(201);
    expect($res2->json('total_stamps'))->toBe(4)
        ->and($res2->json('card_status'))->toBe('active')
        ->and($res2->json('vouchers_issued'))->toBe(0);

    // Visit 3: 3rd visit reached! Total stamps 6. Card should complete and issue 1 voucher.
    $res3 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
    ]);
    $res3->assertStatus(201);
    expect($res3->json('total_stamps'))->toBe(6)
        ->and($res3->json('card_status'))->toBe('completed')
        ->and($res3->json('reward_completed'))->toBeTrue()
        ->and($res3->json('vouchers_issued'))->toBe(1);

    $card->refresh();
    expect($card->status)->toBe('completed')
        ->and($card->completed_at)->not->toBeNull();

    $voucher = Voucher::where('stamp_card_id', $card->id)->first();
    expect($voucher)->not->toBeNull()
        ->and($voucher->reward_title)->toBe('Free Hot Cappuccino')
        ->and($voucher->customer_id)->toBe($customer->id)
        ->and($voucher->status)->toBe('active');
});

test('visit program with issues_voucher = false completes card without generating vouchers', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'visit', false); // disabled

    EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'visit',
        'threshold' => 2,
        'stamps_awarded' => 1,
    ]);

    Reward::create([
        'program_version_id' => $version->id,
        'title' => 'VIP Handshake Perk',
        'reward_type' => 'custom',
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Visit 1
    $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
    ])->assertStatus(201);

    // Visit 2: Completes card
    $res2 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
    ])->assertStatus(201);

    expect($res2->json('card_status'))->toBe('completed')
        ->and($res2->json('reward_completed'))->toBeTrue()
        ->and($res2->json('vouchers_issued'))->toBe(0)
        ->and(Voucher::where('stamp_card_id', $card->id)->count())->toBe(0);

    $card->refresh();
    expect($card->status)->toBe('completed');
});

/*
|--------------------------------------------------------------------------
| Purchase-Based Tests
|--------------------------------------------------------------------------
*/

test('purchase reward completes using stamps_required target and issues voucher when enabled', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'purchase', true);

    // Minimum purchase NPR 500 awards 1 stamp
    EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'purchase',
        'threshold' => 500,
        'stamps_awarded' => 1,
    ]);

    // Requires 3 stamps to complete the reward
    Reward::create([
        'program_version_id' => $version->id,
        'title' => 'NPR 200 Discount Voucher',
        'reward_type' => 'fixed_discount',
        'reward_value' => 200,
        'stamps_required' => 3,
        'voucher_validity_days' => 30,
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Below threshold: rejected
    $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'purchase_amount' => 450,
    ])->assertStatus(422);

    // Purchase 1: NPR 600 -> 1 stamp
    $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'purchase_amount' => 600,
    ])->assertStatus(201);

    // Purchase 2: NPR 800 -> 1 stamp (total 2)
    $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'purchase_amount' => 800,
    ])->assertStatus(201);

    expect(StampCard::find($card->id)->status)->toBe('active');

    // Purchase 3: NPR 500 -> 1 stamp (total 3, reaches stamps_required = 3)
    $res3 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'purchase_amount' => 500,
    ]);
    $res3->assertStatus(201);

    expect($res3->json('card_status'))->toBe('completed')
        ->and($res3->json('reward_completed'))->toBeTrue()
        ->and($res3->json('vouchers_issued'))->toBe(1);

    $card->refresh();
    expect($card->status)->toBe('completed');
    expect(Voucher::where('stamp_card_id', $card->id)->count())->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Quantity-Based Tests (Cumulative Multi-Day & Multi-Voucher Deduplication)
|--------------------------------------------------------------------------
*/

test('quantity progress accumulates across multiple days without resetting at midnight', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'quantity', true);

    $product = Product::create([
        'merchant_id' => $merchant->id,
        'name' => 'Organic Green Tea',
        'price' => 120.00,
        'status' => 'active',
    ]);

    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'quantity',
        'threshold' => null,
        'stamps_awarded' => 1,
    ]);

    // Quantity required: 5 units for a free tea
    $productRule = $rule->productRules()->create([
        'product_id' => $product->id,
        'quantity_required' => 5,
    ]);

    $reward = $productRule->reward()->create([
        'program_version_id' => $version->id,
        'title' => 'Free Organic Green Tea',
        'reward_type' => 'free_item',
        'voucher_validity_days' => 30,
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Day 1: Purchase 2 teas (progress 2/5)
    Carbon::setTestNow(Carbon::parse('2026-11-15 10:00:00'));
    $res1 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertStatus(201);
    expect($res1->json('quantity_progress.cumulative_quantity'))->toBe(2)
        ->and($res1->json('quantity_progress.remaining_quantity'))->toBe(3)
        ->and($res1->json('vouchers_issued'))->toBe(0);

    // Day 2 (Next Day): Purchase 1 tea (cumulative progress 3/5)
    Carbon::setTestNow(Carbon::parse('2026-11-16 14:00:00'));
    $res2 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 1,
    ])->assertStatus(201);
    expect($res2->json('quantity_progress.cumulative_quantity'))->toBe(3)
        ->and($res2->json('quantity_progress.remaining_quantity'))->toBe(2)
        ->and($res2->json('vouchers_issued'))->toBe(0);

    // Day 3 (Two Days Later): Purchase 2 teas (cumulative progress 5/5 -> Reward 1 completed!)
    Carbon::setTestNow(Carbon::parse('2026-11-18 16:00:00'));
    $res3 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertStatus(201);
    expect($res3->json('quantity_progress.cumulative_quantity'))->toBe(5)
        ->and($res3->json('quantity_progress.remaining_quantity'))->toBe(0)
        ->and($res3->json('reward_completed'))->toBeTrue()
        ->and($res3->json('vouchers_issued'))->toBe(1);

    expect(Voucher::where('stamp_card_id', $card->id)->count())->toBe(1);

    Carbon::setTestNow(); // Reset time
});

test('quantity program awards multiple vouchers in one transaction when crossing multiple thresholds and preserves remainder', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'quantity', true);

    $product = Product::create([
        'merchant_id' => $merchant->id,
        'name' => 'Croissant',
        'price' => 150.00,
        'status' => 'active',
    ]);

    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'quantity',
        'threshold' => null,
        'stamps_awarded' => 1,
    ]);

    $productRule = $rule->productRules()->create([
        'product_id' => $product->id,
        'quantity_required' => 5, // 5 croissants = 1 free
    ]);

    $productRule->reward()->create([
        'program_version_id' => $version->id,
        'title' => 'Free Croissant',
        'reward_type' => 'free_item',
        'voucher_validity_days' => 30,
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Customer buys 12 croissants in one go: 12 / 5 = 2 rewards completed, 2 remaining
    $res = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 12,
    ])->assertStatus(201);

    expect($res->json('quantity_progress.cumulative_quantity'))->toBe(12)
        ->and($res->json('quantity_progress.remaining_quantity'))->toBe(3) // 5 - (12 % 5) = 3 remaining to reach 15
        ->and($res->json('reward_completed'))->toBeTrue()
        ->and($res->json('vouchers_issued'))->toBe(2);

    expect(Voucher::where('stamp_card_id', $card->id)->count())->toBe(2);
});

test('retrying identical request with same idempotency_key returns existing transaction and does not issue duplicate vouchers', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'visit', true);

    EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'visit',
        'threshold' => 1, // completes in 1 visit
        'stamps_awarded' => 1,
    ]);

    Reward::create([
        'program_version_id' => $version->id,
        'title' => 'Instant Reward',
        'reward_type' => 'free_item',
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    $idempotencyKey = Str::uuid()->toString();

    // First attempt: issues 1 voucher
    $res1 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => $idempotencyKey,
    ])->assertStatus(201);

    expect($res1->json('vouchers_issued'))->toBe(1);
    expect(Voucher::where('stamp_card_id', $card->id)->count())->toBe(1);

    // Second attempt with SAME idempotency key (e.g. network retry):
    $res2 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => $idempotencyKey,
    ]);

    $res2->assertStatus(200);
    expect($res2->json('message'))->toBe('This stamp award has already been processed.')
        ->and($res2->json('vouchers_issued'))->toBe(1)
        ->and(Voucher::where('stamp_card_id', $card->id)->count())->toBe(1); // STILL EXACTLY 1!
});

test('merchant cannot award stamps to another merchants stamp card', function () {
    [$merchantUserA, $merchantA, $customer] = createMerchantAndCustomer();
    [$merchantUserB, $merchantB] = createMerchantAndCustomer();

    [$programA, $versionA] = createProgramWithVersion($merchantA, 'visit', true);
    EarningRule::create([
        'program_version_id' => $versionA->id,
        'earning_type' => 'visit',
        'threshold' => 5,
        'stamps_awarded' => 1,
    ]);

    $cardA = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $programA->id,
        'program_version_id' => $versionA->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    // Merchant B attempts to award stamps to Merchant A's card
    Sanctum::actingAs($merchantUserB);

    $res = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $cardA->id,
        'idempotency_key' => Str::uuid()->toString(),
    ]);

    $res->assertStatus(403);
});

test('completed stamp card cannot receive further stamps', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'visit', true);

    EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'visit',
        'threshold' => 1,
        'stamps_awarded' => 1,
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 1,
        'status' => 'completed',
        'started_at' => now()->subDays(5),
        'completed_at' => now()->subDay(),
    ]);

    Sanctum::actingAs($merchantUser);

    $res = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
    ]);

    $res->assertStatus(422)
        ->assertJson([
            'message' => 'This stamp card is not active.',
        ]);
});

test('purchase tier-based earning completes when reaching stamps_required', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'purchase', true);

    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'purchase',
        'threshold' => null,
        'stamps_awarded' => 1,
    ]);

    // Tier 1: 1000 - 1999 -> 1 stamp
    $rule->tiers()->create([
        'min_amount' => 1000,
        'max_amount' => 1999,
        'stamps_awarded' => 1,
    ]);

    // Tier 2: 2000+ -> 3 stamps
    $rule->tiers()->create([
        'min_amount' => 2000,
        'max_amount' => null,
        'stamps_awarded' => 3,
    ]);

    // Reward requires 4 stamps
    Reward::create([
        'program_version_id' => $version->id,
        'title' => 'Tier Completion Reward',
        'reward_type' => 'free_item',
        'stamps_required' => 4,
        'voucher_validity_days' => 30,
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Spend NPR 1500 (Tier 1) -> 1 stamp
    Carbon::setTestNow(Carbon::parse('2026-11-15 10:00:00'));
    $res1 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'purchase_amount' => 1500,
    ])->assertStatus(201);
    expect($res1->json('stamps_awarded'))->toBe(1)
        ->and($res1->json('total_stamps'))->toBe(1)
        ->and($res1->json('card_status'))->toBe('active');

    // Spend NPR 2500 (Tier 2, next day) -> 3 stamps (total 4, completes reward target of 4)
    Carbon::setTestNow(Carbon::parse('2026-11-16 11:00:00'));
    $res2 = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'purchase_amount' => 2500,
    ])->assertStatus(201);

    expect($res2->json('stamps_awarded'))->toBe(3)
        ->and($res2->json('total_stamps'))->toBe(4)
        ->and($res2->json('card_status'))->toBe('completed')
        ->and($res2->json('reward_completed'))->toBeTrue()
        ->and($res2->json('vouchers_issued'))->toBe(1);

    Carbon::setTestNow();
});

test('quantity program with issues_voucher = false completes reward without generating vouchers', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'quantity', false); // disabled

    $product = Product::create([
        'merchant_id' => $merchant->id,
        'name' => 'Bagel',
        'price' => 80.00,
        'status' => 'active',
    ]);

    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'quantity',
        'stamps_awarded' => 1,
    ]);

    $productRule = $rule->productRules()->create([
        'product_id' => $product->id,
        'quantity_required' => 2,
    ]);

    $productRule->reward()->create([
        'program_version_id' => $version->id,
        'title' => 'Free Bagel Perk',
        'reward_type' => 'free_item',
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    $res = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertStatus(201);

    expect($res->json('reward_completed'))->toBeTrue()
        ->and($res->json('vouchers_issued'))->toBe(0)
        ->and(Voucher::where('stamp_card_id', $card->id)->count())->toBe(0);
});

test('quantities from different products are strictly isolated', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'quantity', true);

    $coffee = Product::create([
        'merchant_id' => $merchant->id,
        'name' => 'Coffee',
        'price' => 100.00,
        'status' => 'active',
    ]);

    $tea = Product::create([
        'merchant_id' => $merchant->id,
        'name' => 'Tea',
        'price' => 50.00,
        'status' => 'active',
    ]);

    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'quantity',
        'stamps_awarded' => 1,
    ]);

    $coffeeRule = $rule->productRules()->create([
        'product_id' => $coffee->id,
        'quantity_required' => 3,
    ]);
    $coffeeRule->reward()->create([
        'program_version_id' => $version->id,
        'title' => 'Free Coffee',
        'reward_type' => 'free_item',
    ]);

    $teaRule = $rule->productRules()->create([
        'product_id' => $tea->id,
        'quantity_required' => 3,
    ]);
    $teaRule->reward()->create([
        'program_version_id' => $version->id,
        'title' => 'Free Tea',
        'reward_type' => 'free_item',
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Buy 2 coffees (2/3)
    $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $coffee->id,
        'quantity' => 2,
    ])->assertStatus(201);

    // Buy 1 tea (tea is 1/3, coffee remains 2/3)
    $resTea = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $tea->id,
        'quantity' => 1,
    ])->assertStatus(201);

    expect($resTea->json('quantity_progress.cumulative_quantity'))->toBe(1)
        ->and($resTea->json('quantity_progress.remaining_quantity'))->toBe(2)
        ->and($resTea->json('vouchers_issued'))->toBe(0);

    // Buy 1 more coffee (coffee reaches 3/3 -> Free Coffee voucher)
    $resCoffee = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $coffee->id,
        'quantity' => 1,
    ])->assertStatus(201);

    expect($resCoffee->json('quantity_progress.cumulative_quantity'))->toBe(3)
        ->and($resCoffee->json('vouchers_issued'))->toBe(1);

    $voucher = Voucher::where('stamp_card_id', $card->id)->first();
    expect($voucher->reward_title)->toBe('Free Coffee');
});

test('quantity program enforces daily stamp limit per local day', function () {
    [$merchantUser, $merchant, $customer] = createMerchantAndCustomer();
    [$program, $version] = createProgramWithVersion($merchant, 'quantity', true);

    $product = Product::create([
        'merchant_id' => $merchant->id,
        'name' => 'Muffin',
        'price' => 90.00,
        'status' => 'active',
    ]);

    // Daily limit of 4 stamps
    $rule = EarningRule::create([
        'program_version_id' => $version->id,
        'earning_type' => 'quantity',
        'daily_stamp_limit' => 4,
        'stamps_awarded' => 1,
    ]);

    $productRule = $rule->productRules()->create([
        'product_id' => $product->id,
        'quantity_required' => 5,
    ]);
    $productRule->reward()->create([
        'program_version_id' => $version->id,
        'title' => 'Free Muffin',
        'reward_type' => 'free_item',
    ]);

    $card = StampCard::create([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $program->id,
        'program_version_id' => $version->id,
        'stamps_earned' => 0,
        'status' => 'active',
        'started_at' => now(),
    ]);

    Sanctum::actingAs($merchantUser);

    // Buy 3 on Day 1 -> Allowed
    $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 3,
    ])->assertStatus(201);

    // Buy 2 more on Day 1 (total 5 > daily limit 4) -> Rejected with 422
    $resReject = $this->postJson('/api/merchant/stamps/award', [
        'stamp_card_id' => $card->id,
        'idempotency_key' => Str::uuid()->toString(),
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $resReject->assertStatus(422)
        ->assertJson(['message' => 'The customer has reached the daily stamp limit.']);
});

test('create loyalty program API validates stamps_required for purchase programs and stores issues_voucher', function () {
    [$merchantUser, $merchant] = createMerchantAndCustomer();
    Sanctum::actingAs($merchantUser);

    // Missing stamps_required for purchase program -> 422
    $resFail = $this->postJson('/api/merchant/reward-programs', [
        'name' => 'Spend & Win',
        'earning_type' => 'purchase',
        'threshold' => 500,
        'stamps_awarded' => 1,
        'reward_title' => 'NPR 100 Voucher',
        'reward_type' => 'fixed_discount',
        'reward_value' => 100,
        'voucher_validity_days' => 30,
        'issues_voucher' => true,
    ]);
    $resFail->assertStatus(422)
        ->assertJsonValidationErrors(['stamps_required']);

    // Valid purchase program with stamps_required and issues_voucher = false
    $resSuccess = $this->postJson('/api/merchant/reward-programs', [
        'name' => 'Spend & Win',
        'earning_type' => 'purchase',
        'threshold' => 500,
        'stamps_awarded' => 1,
        'stamps_required' => 8,
        'reward_title' => 'VIP Status',
        'reward_type' => 'custom',
        'issues_voucher' => false,
    ]);
    $resSuccess->assertStatus(201);

    $programId = $resSuccess->json('data.id');
    $program = LoyaltyProgram::with(['versions.earningRule', 'versions.reward'])->find($programId);

    expect($program)->not->toBeNull()
        ->and($program->versions[0]->issues_voucher)->toBeFalse()
        ->and($program->versions[0]->reward->stamps_required)->toBe(8);
});

