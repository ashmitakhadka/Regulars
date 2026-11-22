<?php

use App\Models\EarningRule;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;

uses(DatabaseTransactions::class);

function createTestMerchantWithPrograms(): array
{
    $merchantUser = User::create([
        'name' => 'Cafe Merchant',
        'email' => 'merchant_' . Str::random(8) . '@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'merchant',
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    $merchant = Merchant::create([
        'user_id' => $merchantUser->id,
        'business_name' => 'Test Roastery',
        'slug' => 'test-roastery-' . Str::random(6),
        'timezone' => 'Asia/Kathmandu',
        'currency' => 'NPR',
        'status' => 'active',
    ]);

    // Program A
    $programA = LoyaltyProgram::create([
        'merchant_id' => $merchant->id,
        'name' => 'Coffee Club',
        'slug' => 'coffee-club-' . Str::random(6),
        'status' => 'active',
    ]);

    $versionA = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $programA->id,
        'version_number' => 1,
        'status' => 'active',
        'effective_at' => now(),
    ]);

    // Program B
    $programB = LoyaltyProgram::create([
        'merchant_id' => $merchant->id,
        'name' => 'Bakery Treats',
        'slug' => 'bakery-treats-' . Str::random(6),
        'status' => 'active',
    ]);

    $versionB = LoyaltyProgramVersion::create([
        'loyalty_program_id' => $programB->id,
        'version_number' => 1,
        'status' => 'active',
        'effective_at' => now(),
    ]);

    return [$merchantUser, $merchant, $programA, $versionA, $programB, $versionB];
}

test('merchant can filter customers by program_id to display only program-specific enrolled customers', function () {
    [$merchantUser, $merchant, $programA, $versionA, $programB, $versionB] = createTestMerchantWithPrograms();

    // Customer 1: Enrolled in Program A only
    $customer1 = User::create([
        'name' => 'Alice CoffeeLover',
        'email' => 'alice_' . Str::random(8) . '@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'customer',
        'customer_code' => 'RG-ALICE' . rand(10, 99),
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    StampCard::create([
        'customer_id' => $customer1->id,
        'loyalty_program_id' => $programA->id,
        'program_version_id' => $versionA->id,
        'stamps_earned' => 4,
        'status' => 'active',
        'started_at' => now(),
    ]);

    // Customer 2: Enrolled in Program B only
    $customer2 = User::create([
        'name' => 'Bob PastryFan',
        'email' => 'bob_' . Str::random(8) . '@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'customer',
        'customer_code' => 'RG-BOB' . rand(10, 99),
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    StampCard::create([
        'customer_id' => $customer2->id,
        'loyalty_program_id' => $programB->id,
        'program_version_id' => $versionB->id,
        'stamps_earned' => 2,
        'status' => 'active',
        'started_at' => now(),
    ]);

    // Customer 3: Enrolled in both Program A and Program B
    $customer3 = User::create([
        'name' => 'Charlie DualMember',
        'email' => 'charlie_' . Str::random(8) . '@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'customer',
        'customer_code' => 'RG-CHARLIE' . rand(10, 99),
        'phone' => '98' . rand(10000000, 99999999),
    ]);

    StampCard::create([
        'customer_id' => $customer3->id,
        'loyalty_program_id' => $programA->id,
        'program_version_id' => $versionA->id,
        'stamps_earned' => 8,
        'status' => 'active',
        'started_at' => now(),
    ]);

    StampCard::create([
        'customer_id' => $customer3->id,
        'loyalty_program_id' => $programB->id,
        'program_version_id' => $versionB->id,
        'stamps_earned' => 1,
        'status' => 'active',
        'started_at' => now(),
    ]);

    // 1. Unfiltered request should return all 3 customers
    $allResponse = $this->actingAs($merchantUser)
        ->getJson('/api/merchant/customers');

    $allResponse->assertStatus(200);
    $allCustomerIds = collect($allResponse->json('data'))->pluck('id')->all();
    expect($allCustomerIds)->toContain($customer1->id)
        ->and($allCustomerIds)->toContain($customer2->id)
        ->and($allCustomerIds)->toContain($customer3->id);

    // 2. Filtered by Program A: Should return Customer 1 and Customer 3, but NOT Customer 2
    $responseA = $this->actingAs($merchantUser)
        ->getJson('/api/merchant/customers?program_id=' . $programA->id);

    $responseA->assertStatus(200);
    $programACustomerIds = collect($responseA->json('data'))->pluck('id')->all();
    expect($programACustomerIds)->toContain($customer1->id)
        ->and($programACustomerIds)->toContain($customer3->id)
        ->and($programACustomerIds)->not->toContain($customer2->id);

    // Also verify that the returned programs for Customer 3 only contain Program A
    $charlieDataA = collect($responseA->json('data'))->firstWhere('id', $customer3->id);
    expect($charlieDataA['programs'])->toHaveCount(1)
        ->and($charlieDataA['programs'][0]['program_id'])->toBe($programA->id);

    // 3. Filtered by Program B: Should return Customer 2 and Customer 3, but NOT Customer 1
    $responseB = $this->actingAs($merchantUser)
        ->getJson('/api/merchant/customers?program_id=' . $programB->id);

    $responseB->assertStatus(200);
    $programBCustomerIds = collect($responseB->json('data'))->pluck('id')->all();
    expect($programBCustomerIds)->toContain($customer2->id)
        ->and($programBCustomerIds)->toContain($customer3->id)
        ->and($programBCustomerIds)->not->toContain($customer1->id);

    // 4. Combined search + program_id
    $searchResponse = $this->actingAs($merchantUser)
        ->getJson('/api/merchant/customers?program_id=' . $programA->id . '&search=Alice');

    $searchResponse->assertStatus(200);
    $searchIds = collect($searchResponse->json('data'))->pluck('id')->all();
    expect($searchIds)->toEqual([$customer1->id]);
});
