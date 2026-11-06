<?php

namespace App\Services\Customer;

use App\Models\User;

class CustomerCodeGenerator
{
    public const PREFIX = 'RG-';
    public const CODE_LENGTH = 6;
    // Base31 alphabet without confusing characters: no 0, O, 1, I, L
    public const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    public function generate(): string
    {
        $alphabetLength = strlen(self::ALPHABET);

        do {
            $randomString = '';
            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $randomString .= self::ALPHABET[random_int(0, $alphabetLength - 1)];
            }
            $candidate = self::PREFIX . $randomString;
        } while (User::where('customer_code', $candidate)->exists());

        return $candidate;
    }

    public function isValid(?string $code): bool
    {
        if (!$code) {
            return false;
        }

        $pattern = '/^' . preg_quote(self::PREFIX, '/') . '[' . self::ALPHABET . ']{' . self::CODE_LENGTH . '}$/';
        return (bool) preg_match($pattern, $code);
    }
}

