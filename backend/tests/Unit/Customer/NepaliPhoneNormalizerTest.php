<?php

use App\Services\Customer\NepaliPhoneNormalizer;

test('normalizes plain 10 digit number', function () {
    expect(NepaliPhoneNormalizer::normalize('9812345678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('9712345678'))->toBe('9712345678');
    expect(NepaliPhoneNormalizer::normalize('9612345678'))->toBe('9612345678');
});

test('normalizes numbers with spaces, hyphens, and parentheses', function () {
    expect(NepaliPhoneNormalizer::normalize('981-234-5678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('981 234 5678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('(981) 234-5678'))->toBe('9812345678');
});

test('normalizes international country codes +977 and 00977', function () {
    expect(NepaliPhoneNormalizer::normalize('+977-9812345678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('+977 981 234 5678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('009779812345678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('00977 9812345678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('9779812345678'))->toBe('9812345678');
});

test('normalizes trunk 0 prefix', function () {
    expect(NepaliPhoneNormalizer::normalize('09812345678'))->toBe('9812345678');
    expect(NepaliPhoneNormalizer::normalize('09712345678'))->toBe('9712345678');
});

test('handles null and empty input gracefully', function () {
    expect(NepaliPhoneNormalizer::normalize(null))->toBeNull();
    expect(NepaliPhoneNormalizer::normalize(''))->toBeNull();
    expect(NepaliPhoneNormalizer::normalize('   '))->toBeNull();
    expect(NepaliPhoneNormalizer::normalize('abc'))->toBeNull();
});

test('validates 96, 97, and 98 prefixes as valid mobile numbers', function () {
    expect(NepaliPhoneNormalizer::isValid('9812345678'))->toBeTrue();
    expect(NepaliPhoneNormalizer::isValid('+977 9841234567'))->toBeTrue();
    expect(NepaliPhoneNormalizer::isValid('9741234567'))->toBeTrue();
    expect(NepaliPhoneNormalizer::isValid('9612345678'))->toBeTrue();
});

test('rejects landlines, short numbers, and invalid formats', function () {
    expect(NepaliPhoneNormalizer::isValid('014234567'))->toBeFalse(); // Kathmandu landline
    expect(NepaliPhoneNormalizer::isValid('+977-1-4234567'))->toBeFalse();
    expect(NepaliPhoneNormalizer::isValid('9812345'))->toBeFalse();    // Too short (7 digits)
    expect(NepaliPhoneNormalizer::isValid('98123456789'))->toBeFalse();  // Too long (11 digits)
    expect(NepaliPhoneNormalizer::isValid('9512345678'))->toBeFalse();  // Invalid prefix 95
    expect(NepaliPhoneNormalizer::isValid('invalid'))->toBeFalse();
    expect(NepaliPhoneNormalizer::isValid(null))->toBeFalse();
});

