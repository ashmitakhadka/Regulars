<?php

use App\Models\EarningRule;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\MerchantQrCode;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\User;
use App\Models\UserMerchantStat;
use App\Models\Visit;
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
 * Helper to create a customer user.
 */
function createWalletCustomer(): User
{
    return User::create([
        'name' => 'Test Customer ' . uniqid(),
        'email' => 'cust_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'customer',
    ]);
}

/**
 * Helper to create a merchant, program, version, earning rule, reward, and QR code.
 */
function createWalletMerchantWithProgram(array $merchantAttrs = [], array $programAttrs = [], array $earningAttrs = []): array
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
        'business_name' => 'Test Merchant ' . uniqid(),
        'category' => 'cafe',
        'slug' => 'test-merchant-' . uniqid(),
        'description' => 'Test description',
        'address' => 'Kathmandu, Nepal',
        'timezone' => 'Asia/Kathmandu',
        'status' => 'active',
    ], $merchantAttrs));
    $merchant->save();

    MerchantQrCode::create([
        'merchant_id' => $merchant->id,
        'type' => 'business',
        'token_hash' => hash('sha256', 'secret-token-' . uniqid()),
        'is_active' => true,
    ]);

    $program = LoyaltyProgram::create(array_merge([
        'merchant_id' => $merchant->id,
        'name' => 'Card ' . uniqid(),
        'description' => 'Collect stamps for rewards',
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
        'title' => 'Reward ' . uniqid(),
        'description' => 'Reward description',
        'reward_type' => 'free_item',
        'reward_value' => 300.00,
        'voucher_validity_days' => 30,
    ]);

    return compact('owner', 'merchant', 'program', 'version', 'earningRule', 'reward');
}

/**
 * Helper to enroll a customer in a program and create streak stat.
 */
function createCardForCustomer(User $customer, array $data, array $cardAttrs = [], array $statAttrs = []): array
{
    $card = StampCard::create(array_merge([
        'customer_id' => $customer->id,
        'loyalty_program_id' => $data['program']->id,
        'program_version_id' => $data['version']->id,
        'stamps_earned' => 5,
        'status' => 'active',
        'started_at' => now()->subDays(10),
    ], $cardAttrs));

    $stat = UserMerchantStat::updateOrCreate(
        ['customer_id' => $customer->id, 'merchant_id' => $data['merchant']->id],
        array_merge([
            'current_streak' => 3,
            'longest_streak' => 7,
            'last_qualifying_visit_date' => now()->toDateString(),
        ], $statAttrs)
    );

    return compact('card', 'stat');
}

// --------------------------------------------------------------------------
// Feature Tests
// --------------------------------------------------------------------------

test('wallet shows only my cards', function () {
    $customerA = createWalletCustomer();
    $customerB = createWalletCustomer();

    $merchantA = createWalletMerchantWithProgram(['business_name' => 'Shop A']);
    $merchantB = createWalletMerchantWithProgram(['business_name' => 'Shop B']);

    $cardA = createCardForCustomer($customerA, $merchantA)['card'];
    $cardB = createCardForCustomer($customerB, $merchantB)['card'];

    $response = $this->actingAs($customerA)
        ->getJson('/api/customer/wallet');

    $response->assertStatus(200)
        ->assertJson(['success' => true]);

    $cardIds = collect($response->json('data.cards'))->pluck('id');
    expect($cardIds)->toContain($cardA->id)
        ->and($cardIds)->not->toContain($cardB->id);
});

test('cards from at least 3 businesses appear together with summary', function () {
    $customer = createWalletCustomer();

    $biz1 = createWalletMerchantWithProgram(['business_name' => 'Business One']);
    $biz2 = createWalletMerchantWithProgram(['business_name' => 'Business Two']);
    $biz3 = createWalletMerchantWithProgram(['business_name' => 'Business Three']);

    $card1 = createCardForCustomer($customer, $biz1, ['stamps_earned' => 2], ['current_streak' => 1])['card'];
    $card2 = createCardForCustomer($customer, $biz2, ['stamps_earned' => 4], ['current_streak' => 4])['card'];
    $card3 = createCardForCustomer($customer, $biz3, ['stamps_earned' => 6], ['current_streak' => 2])['card'];

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/wallet');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'summary' => [
                    'active_cards_count' => 3,
                    'businesses_joined_count' => 3,
                    'highest_current_streak' => 4,
                ],
            ],
        ]);

    $cards = collect($response->json('data.cards'));
    expect($cards)->toHaveCount(3);
    $bizNames = $cards->pluck('business.name');
    expect($bizNames)->toContain('Business One')
        ->and($bizNames)->toContain('Business Two')
        ->and($bizNames)->toContain('Business Three');
});

test('completed cards are not in the wallet list', function () {
    $customer = createWalletCustomer();

    $bizActive = createWalletMerchantWithProgram(['business_name' => 'Active Shop']);
    $bizCompleted = createWalletMerchantWithProgram(['business_name' => 'Completed Shop']);

    $activeCard = createCardForCustomer($customer, $bizActive, ['status' => 'active'])['card'];
    $completedCard = createCardForCustomer($customer, $bizCompleted, [
        'status' => 'completed',
        'stamps_earned' => 10,
        'completed_at' => now(),
    ])['card'];

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/wallet');

    $response->assertStatus(200);
    $cardIds = collect($response->json('data.cards'))->pluck('id');

    expect($cardIds)->toContain($activeCard->id)
        ->and($cardIds)->not->toContain($completedCard->id);
});

test('streak values come from user_merchant_stats', function () {
    $customer = createWalletCustomer();
    $biz = createWalletMerchantWithProgram();

    $card = createCardForCustomer($customer, $biz, [], [
        'current_streak' => 6,
        'longest_streak' => 14,
        'last_qualifying_visit_date' => Carbon::now('Asia/Kathmandu')->toDateString(),
    ])['card'];

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/wallet');

    $response->assertStatus(200);
    $retrievedCard = collect($response->json('data.cards'))->firstWhere('id', $card->id);

    expect($retrievedCard['current_streak'])->toBe(6)
        ->and($retrievedCard['longest_streak'])->toBe(14)
        ->and($retrievedCard['last_visit_date'])->toBe(Carbon::now('Asia/Kathmandu')->toDateString())
        ->and($retrievedCard['streak_active'])->toBeTrue();
});

test('streak_active is true for visit yesterday and today, false for three days ago, regardless of server timezone UTC', function () {
    // Force PHP server default timezone to UTC
    $originalTimezone = date_default_timezone_get();
    date_default_timezone_set('UTC');
    config(['app.timezone' => 'UTC']);

    try {
        $customer = createWalletCustomer();
        $tz = 'Asia/Kathmandu';

        $bizToday = createWalletMerchantWithProgram(['business_name' => 'Visit Today Shop', 'timezone' => $tz]);
        $bizYesterday = createWalletMerchantWithProgram(['business_name' => 'Visit Yesterday Shop', 'timezone' => $tz]);
        $bizThreeDaysAgo = createWalletMerchantWithProgram(['business_name' => 'Visit Old Shop', 'timezone' => $tz]);

        $todayKathmandu = Carbon::now($tz)->toDateString();
        $yesterdayKathmandu = Carbon::now($tz)->subDay()->toDateString();
        $threeDaysAgoKathmandu = Carbon::now($tz)->subDays(3)->toDateString();

        $cardToday = createCardForCustomer($customer, $bizToday, [], [
            'current_streak' => 5,
            'last_qualifying_visit_date' => $todayKathmandu,
        ])['card'];

        $cardYesterday = createCardForCustomer($customer, $bizYesterday, [], [
            'current_streak' => 3,
            'last_qualifying_visit_date' => $yesterdayKathmandu,
        ])['card'];

        $cardThreeDays = createCardForCustomer($customer, $bizThreeDaysAgo, [], [
            'current_streak' => 4, // Stored number preserved!
            'last_qualifying_visit_date' => $threeDaysAgoKathmandu,
        ])['card'];

        $response = $this->actingAs($customer)
            ->getJson('/api/customer/wallet');

        $response->assertStatus(200);
        $cards = collect($response->json('data.cards'));

        $resToday = $cards->firstWhere('id', $cardToday->id);
        $resYesterday = $cards->firstWhere('id', $cardYesterday->id);
        $resThreeDays = $cards->firstWhere('id', $cardThreeDays->id);

        expect($resToday['streak_active'])->toBeTrue()
            ->and($resToday['current_streak'])->toBe(5)
            ->and($resYesterday['streak_active'])->toBeTrue()
            ->and($resYesterday['current_streak'])->toBe(3)
            ->and($resThreeDays['streak_active'])->toBeFalse()
            ->and($resThreeDays['current_streak'])->toBe(4); // Stored streak number returned unchanged!
    } finally {
        date_default_timezone_set($originalTimezone);
        config(['app.timezone' => $originalTimezone]);
    }
});

test('a card keeps its own version requirement after the program changes', function () {
    $customer = createWalletCustomer();
    $biz = createWalletMerchantWithProgram([], [], ['threshold' => 8]);

    // Card created on Version 1 (threshold 8)
    $card = createCardForCustomer($customer, $biz)['card'];

    // Merchant releases Version 2 with higher threshold (12)
    $version2 = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $biz['program']->id,
        'version_number' => 2,
        'status' => 'active',
        'effective_at' => now(),
    ]);
    EarningRule::create([
        'program_version_id' => $version2->id,
        'earning_type' => 'visit',
        'threshold' => 12,
        'stamps_awarded' => 1,
        'daily_stamp_limit' => 1,
    ]);
    Reward::create([
        'program_version_id' => $version2->id,
        'title' => 'New Deluxe Reward',
        'description' => 'New description',
        'reward_type' => 'free_item',
        'reward_value' => 500.00,
        'voucher_validity_days' => 45,
    ]);

    // Wallet check
    $walletRes = $this->actingAs($customer)->getJson('/api/customer/wallet');
    $walletCard = collect($walletRes->json('data.cards'))->firstWhere('id', $card->id);
    expect($walletCard['stamps_required'])->toBe(8);

    // Card Detail check
    $detailRes = $this->actingAs($customer)->getJson('/api/customer/stamp-cards/' . $card->id);
    $detailRes->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $card->id,
                'stamps_required' => 8,
                'reward' => [
                    'title' => $biz['reward']->title,
                ],
            ],
        ]);
});

test('card detail can open completed card', function () {
    $customer = createWalletCustomer();
    $biz = createWalletMerchantWithProgram();

    $completedCard = createCardForCustomer($customer, $biz, [
        'status' => 'completed',
        'stamps_earned' => 10,
        'completed_at' => now(),
    ])['card'];

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/stamp-cards/' . $completedCard->id);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $completedCard->id,
                'status' => 'completed',
                'stamps_earned' => 10,
            ],
        ]);
});

test('card detail includes rejected visit with its reason and stamps_awarded', function () {
    $customer = createWalletCustomer();
    $tz = 'Asia/Kathmandu';
    $biz = createWalletMerchantWithProgram(['timezone' => $tz]);

    $card = createCardForCustomer($customer, $biz)['card'];

    // Successful visit with stamp awarded
    $visitSuccess = Visit::create([
        'merchant_id' => $biz['merchant']->id,
        'customer_id' => $customer->id,
        'scanned_at' => Carbon::now($tz)->subHours(3),
        'local_date' => Carbon::now($tz)->toDateString(),
        'timezone' => $tz,
        'status' => 'successful',
        'rejection_reason' => null,
    ]);

    StampTransaction::create([
        'stamp_card_id' => $card->id,
        'program_version_id' => $biz['version']->id,
        'source_type' => 'visit',
        'source_id' => $visitSuccess->id,
        'stamps_awarded' => 1,
    ]);

    // Rejected visit
    $visitRejected = Visit::create([
        'merchant_id' => $biz['merchant']->id,
        'customer_id' => $customer->id,
        'scanned_at' => Carbon::now($tz)->subHour(),
        'local_date' => Carbon::now($tz)->toDateString(),
        'timezone' => $tz,
        'status' => 'rejected',
        'rejection_reason' => 'Already stamped today',
    ]);

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/stamp-cards/' . $card->id);

    $response->assertStatus(200);
    $history = collect($response->json('data.visit_history'));

    expect($history)->toHaveCount(2);

    $recRejected = $history->firstWhere('id', $visitRejected->id);
    expect($recRejected['result'])->toBe('rejected')
        ->and($recRejected['rejection_reason'])->toBe('Already stamped today')
        ->and($recRejected['stamps_awarded'])->toBeNull();

    $recSuccess = $history->firstWhere('id', $visitSuccess->id);
    expect($recSuccess['result'])->toBe('successful')
        ->and($recSuccess['rejection_reason'])->toBeNull()
        ->and($recSuccess['stamps_awarded'])->toBe(1);
});

test('visit history is limited to 30 and ordered newest first', function () {
    $customer = createWalletCustomer();
    $tz = 'Asia/Kathmandu';
    $biz = createWalletMerchantWithProgram(['timezone' => $tz]);

    $card = createCardForCustomer($customer, $biz)['card'];

    // Create 35 visits across 35 days
    for ($i = 35; $i >= 1; $i--) {
        Visit::create([
            'merchant_id' => $biz['merchant']->id,
            'customer_id' => $customer->id,
            'scanned_at' => Carbon::now($tz)->subDays($i),
            'local_date' => Carbon::now($tz)->subDays($i)->toDateString(),
            'timezone' => $tz,
            'status' => 'successful',
        ]);
    }

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/stamp-cards/' . $card->id);

    $response->assertStatus(200);
    $history = $response->json('data.visit_history');

    expect($history)->toHaveCount(30);

    // Verify ordered newest first
    $firstDate = Carbon::parse($history[0]['datetime']);
    $lastDate = Carbon::parse($history[29]['datetime']);
    expect($firstDate->greaterThan($lastDate))->toBeTrue();
});

test('dates use the merchant timezone', function () {
    $customer = createWalletCustomer();
    $tz = 'Asia/Kathmandu'; // UTC+05:45
    $biz = createWalletMerchantWithProgram(['timezone' => $tz]);

    $card = createCardForCustomer($customer, $biz)['card'];

    // 10:30 PM UTC on May 1st is 4:15 AM on May 2nd in Kathmandu (+05:45)
    $utcTime = Carbon::create(2026, 5, 1, 22, 30, 0, 'UTC');

    Visit::create([
        'merchant_id' => $biz['merchant']->id,
        'customer_id' => $customer->id,
        'scanned_at' => $utcTime,
        'local_date' => '2026-05-02',
        'timezone' => $tz,
        'status' => 'successful',
    ]);

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/stamp-cards/' . $card->id);

    $response->assertStatus(200);
    $visit = $response->json('data.visit_history.0');

    expect($visit['date'])->toBe('2026-05-02')
        ->and($visit['time'])->toBe('04:15:00')
        ->and($visit['timezone'])->toBe('Asia/Kathmandu');
});

test('another customers card gives 404', function () {
    $customerA = createWalletCustomer();
    $customerB = createWalletCustomer();

    $biz = createWalletMerchantWithProgram();
    $cardB = createCardForCustomer($customerB, $biz)['card'];

    // Customer A tries to access Customer B's card
    $this->actingAs($customerA)
        ->getJson('/api/customer/stamp-cards/' . $cardB->id)
        ->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Stamp card not found.',
        ]);
});

test('cards of suspended businesses are marked with business status suspended', function () {
    $customer = createWalletCustomer();

    $suspendedBiz = createWalletMerchantWithProgram([
        'business_name' => 'Suspended Shop',
        'status' => 'suspended',
    ]);

    $card = createCardForCustomer($customer, $suspendedBiz)['card'];

    $response = $this->actingAs($customer)
        ->getJson('/api/customer/wallet');

    $response->assertStatus(200);
    $retrieved = collect($response->json('data.cards'))->firstWhere('id', $card->id);

    expect($retrieved['business']['status'])->toBe('suspended');
});

test('no private fields are exposed in wallet or card detail responses', function () {
    $customer = createWalletCustomer();
    $biz = createWalletMerchantWithProgram();
    $card = createCardForCustomer($customer, $biz)['card'];

    // 1. Wallet
    $walletJson = json_encode($this->actingAs($customer)->getJson('/api/customer/wallet')->json());
    expect($walletJson)->not->toContain('token_hash')
        ->and($walletJson)->not->toContain('password')
        ->and($walletJson)->not->toContain($biz['owner']->email);

    // 2. Card Detail
    $detailJson = json_encode($this->actingAs($customer)->getJson('/api/customer/stamp-cards/' . $card->id)->json());
    expect($detailJson)->not->toContain('token_hash')
        ->and($detailJson)->not->toContain('password')
        ->and($detailJson)->not->toContain($biz['owner']->email);
});

test('merchant gets 403 when accessing customer wallet or card detail', function () {
    $merchantUser = User::create([
        'name' => 'Merchant User',
        'email' => 'merchant_' . uniqid() . '@example.com',
        'password' => 'secret1234',
        'phone' => '98' . rand(10000000, 99999999),
        'role' => 'merchant',
    ]);

    $this->actingAs($merchantUser)
        ->getJson('/api/customer/wallet')
        ->assertStatus(403);

    $this->actingAs($merchantUser)
        ->getJson('/api/customer/stamp-cards/1')
        ->assertStatus(403);
});

test('logged-out user gets 401 when accessing customer wallet or card detail', function () {
    $this->getJson('/api/customer/wallet')
        ->assertStatus(401);

    $this->getJson('/api/customer/stamp-cards/1')
        ->assertStatus(401);
});
