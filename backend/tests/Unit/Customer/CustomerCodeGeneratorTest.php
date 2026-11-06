<?php

use App\Models\User;
use App\Services\Customer\CustomerCodeGenerator;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

test('generated code has correct prefix and length', function () {
    $generator = new CustomerCodeGenerator();
    $code = $generator->generate();

    expect($code)->toStartWith(CustomerCodeGenerator::PREFIX)
        ->and(strlen($code))->toBe(strlen(CustomerCodeGenerator::PREFIX) + CustomerCodeGenerator::CODE_LENGTH);
});

test('generated code only contains allowed characters', function () {
    $generator = new CustomerCodeGenerator();

    for ($i = 0; $i < 20; $i++) {
        $code = $generator->generate();
        $randomPart = substr($code, strlen(CustomerCodeGenerator::PREFIX));

        // Must not contain 0, O, 1, I, L
        expect($randomPart)->not->toMatch('/[0O1IL]/');

        // Must only match allowed alphabet
        for ($j = 0; $j < strlen($randomPart); $j++) {
            expect(str_contains(CustomerCodeGenerator::ALPHABET, $randomPart[$j]))->toBeTrue();
        }
    }
});

test('generated codes are unique across multiple runs', function () {
    $generator = new CustomerCodeGenerator();
    $codes = [];

    for ($i = 0; $i < 50; $i++) {
        $codes[] = $generator->generate();
    }

    expect(count(array_unique($codes)))->toBe(50);
});

test('generator retries on collision with existing user code', function () {
    $generator = new CustomerCodeGenerator();

    // Pre-create a user with a specific code
    $firstCode = $generator->generate();
    User::create([
        'name' => 'Collision Target',
        'email' => 'collision_' . uniqid() . '@example.com',
        'password' => 'secret',
        'role' => 'customer',
        'customer_code' => $firstCode,
    ]);

    // Subsequent generation must never return the existing code
    $secondCode = $generator->generate();
    expect($secondCode)->not->toBe($firstCode)
        ->and(User::where('customer_code', $secondCode)->exists())->toBeFalse();
});

test('isValid correctly validates allowed codes and rejects invalid formats', function () {
    $generator = new CustomerCodeGenerator();

    // Valid codes
    expect($generator->isValid('RG-4K7M2P'))->toBeTrue();
    expect($generator->isValid('RG-234567'))->toBeTrue();
    expect($generator->isValid('RG-ZYXWVU'))->toBeTrue();

    // Invalid codes
    expect($generator->isValid(null))->toBeFalse();
    expect($generator->isValid(''))->toBeFalse();
    expect($generator->isValid('XX-4K7M2P'))->toBeFalse(); // Wrong prefix
    expect($generator->isValid('RG-4K7M2'))->toBeFalse();  // Too short
    expect($generator->isValid('RG-4K7M2P9'))->toBeFalse(); // Too long
    expect($generator->isValid('RG-4K702P'))->toBeFalse(); // Contains 0
    expect($generator->isValid('RG-4K7O2P'))->toBeFalse(); // Contains O
    expect($generator->isValid('RG-4K712P'))->toBeFalse(); // Contains 1
    expect($generator->isValid('RG-4K7I2P'))->toBeFalse(); // Contains I
    expect($generator->isValid('RG-4K7L2P'))->toBeFalse(); // Contains L
    expect($generator->isValid('rg-4k7m2p'))->toBeFalse(); // Lowercase
});

