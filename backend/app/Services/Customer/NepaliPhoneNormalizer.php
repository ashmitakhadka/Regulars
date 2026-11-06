<?php

namespace App\Services\Customer;

class NepaliPhoneNormalizer
{
    /**
     * Normalizes a Nepal mobile phone number into 10 digits (e.g. 98XXXXXXXX / 97XXXXXXXX).
     * Strips whitespace, dashes, brackets, +977, 00977, and leading 0.
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        // Remove all non-digits
        $digits = preg_replace('/\D+/', '', $phone);

        if (empty($digits)) {
            return null;
        }

        // Strip international prefix: 00977 or 977 (if followed by a 10-digit mobile number)
        if (str_starts_with($digits, '00977') && strlen($digits) === 15) {
            $digits = substr($digits, 5);
        } elseif (str_starts_with($digits, '977') && strlen($digits) === 13) {
            $digits = substr($digits, 3);
        }

        // Strip leading trunk 0 (e.g., 098XXXXXXXX -> 98XXXXXXXX)
        if (str_starts_with($digits, '0') && strlen($digits) === 11) {
            $digits = substr($digits, 1);
        }

        return $digits;
    }

    /**
     * Validates if the normalized number is a valid 10-digit Nepal mobile number.
     * Nepal mobile numbers start with 96, 97 or 98 and have 10 digits.
     */
    public static function isValid(?string $phone): bool
    {
        $normalized = self::normalize($phone);
        if (!$normalized) {
            return false;
        }

        return (bool) preg_match('/^9[678]\d{8}$/', $normalized);
    }
}

