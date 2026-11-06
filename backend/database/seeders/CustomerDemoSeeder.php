<?php

namespace Database\Seeders;

use App\Models\EarningRule;
use App\Models\LoyaltyProgram;
use App\Models\LoyaltyProgramVersion;
use App\Models\Merchant;
use App\Models\MerchantQrCode;
use App\Models\Reward;
use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\TargetedOffer;
use App\Models\User;
use App\Models\UserMerchantStat;
use App\Models\Visit;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerDemoSeeder extends Seeder
{
    /**
     * Run the customer demo database seeds.
     * Safe to run multiple times without creating duplicates.
     */
    public function run(): void
    {
        $timezone = 'Asia/Kathmandu';
        $todayNepal = Carbon::now($timezone)->toDateString();
        $yesterdayNepal = Carbon::now($timezone)->subDay()->toDateString();

        // -------------------------------------------------------------
        // 1. Create 3 Active Merchants (Cafe, Salon, Gym)
        // -------------------------------------------------------------
        $merchantsData = [
            [
                'email' => 'himalayan-java@example.com',
                'owner_name' => 'Bikash Shrestha',
                'business_name' => 'Himalayan Java Cafe',
                'slug' => 'himalayan-java',
                'description' => 'Locally sourced artisan coffee, handcrafted espresso, and fresh bakery in Kathmandu.',
                'phone' => '9851000001',
                'address' => 'Thamel, Kathmandu',
                'program_name' => 'Java Regulars Coffee Card',
                'program_description' => 'Collect 10 stamps on daily coffee visits and enjoy any specialty beverage on the house.',
                'threshold' => 10,
                'reward_title' => 'Free Specialty Beverage',
                'reward_description' => 'Enjoy any specialty coffee or handcrafted beverage of your choice.',
                'reward_value' => 380.00,
                'card_progress' => 9, // Nearly complete (9/10)
                'current_streak' => 5,
                'longest_streak' => 12,
                'last_visit' => $todayNepal,
            ],
            [
                'email' => 'glow-salon@example.com',
                'owner_name' => 'Sunita Rai',
                'business_name' => 'Glow Beauty Salon',
                'slug' => 'glow-beauty-salon',
                'description' => 'Modern hair styling, organic skincare, and nail art studio.',
                'phone' => '9851000002',
                'address' => 'Jhamsikhel, Lalitpur',
                'program_name' => 'Glow VIP Treatment Card',
                'program_description' => 'Visit for 8 beauty sessions and receive a complimentary hair spa & deep conditioning.',
                'threshold' => 8,
                'reward_title' => 'Free Hair Spa & Treatment',
                'reward_description' => 'Complimentary Moroccan oil hair spa and blow-dry styling.',
                'reward_value' => 1500.00,
                'card_progress' => 4, // Mid-level progress (4/8)
                'current_streak' => 1,
                'longest_streak' => 3,
                'last_visit' => $todayNepal,
            ],
            [
                'email' => 'kavre-fitness@example.com',
                'owner_name' => 'Rabin Tamang',
                'business_name' => 'Kavre Fitness & Gym',
                'slug' => 'kavre-fitness-gym',
                'description' => 'State of the art strength training, cardio floor, and functional training zone.',
                'phone' => '9851000003',
                'address' => 'Banepa, Kavre',
                'program_name' => 'Iron Streak Workout Card',
                'program_description' => 'Log 12 workout visits to earn a free protein smoothie and an exclusive guest day pass.',
                'threshold' => 12,
                'reward_title' => 'Protein Shake & Guest Day Pass',
                'reward_description' => 'Whey protein shake plus 1 all-access guest day pass for a friend.',
                'reward_value' => 650.00,
                'card_progress' => 2, // Early progress (2/12)
                'current_streak' => 0,
                'longest_streak' => 7,
                'last_visit' => Carbon::now($timezone)->subDays(3)->toDateString(),
            ],
        ];

        // -------------------------------------------------------------
        // 2. Create the Demo Customer
        // -------------------------------------------------------------
        $customer = User::updateOrCreate(
            ['email' => 'demo-customer@example.com'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'customer_code' => 'RG-DEM789',
                'phone' => '9801234567',
                'email_verified_at' => now(),
            ]
        );

        $seededMerchants = [];
        $seededPrograms = [];
        $seededVersions = [];

        foreach ($merchantsData as $data) {
            // 2a. Merchant User
            $owner = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['owner_name'],
                    'password' => Hash::make('secret123'),
                    'role' => 'merchant',
                    'email_verified_at' => now(),
                ]
            );

            // 2b. Merchant Profile
            $merchant = Merchant::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'user_id' => $owner->id,
                    'business_name' => $data['business_name'],
                    'description' => $data['description'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                    'timezone' => $timezone,
                    'currency' => 'NPR',
                    'status' => 'active',
                    'is_pro' => true,
                ]
            );
            $seededMerchants[$data['slug']] = $merchant;

            // 2c. Merchant Permanent QR Code
            $qr = MerchantQrCode::updateOrCreate(
                ['merchant_id' => $merchant->id, 'type' => 'permanent'],
                [
                    'token_hash' => hash('sha256', "permanent-qr-{$data['slug']}"),
                    'is_active' => true,
                    'expires_at' => null,
                    'last_refreshed_at' => now(),
                ]
            );

            // 2d. Active Loyalty Program
            $program = LoyaltyProgram::updateOrCreate(
                ['merchant_id' => $merchant->id, 'name' => $data['program_name']],
                [
                    'description' => $data['program_description'],
                    'status' => 'active',
                ]
            );
            $seededPrograms[$data['slug']] = $program;

            // 2e. Loyalty Program Version
            $version = LoyaltyProgramVersion::updateOrCreate(
                ['loyalty_program_id' => $program->id, 'version_number' => 1],
                [
                    'status' => 'active',
                    'effective_at' => Carbon::now($timezone)->subMonths(2),
                ]
            );
            $seededVersions[$data['slug']] = $version;

            // 2f. Earning Rule
            EarningRule::updateOrCreate(
                ['program_version_id' => $version->id],
                [
                    'earning_type' => 'visit',
                    'threshold' => $data['threshold'],
                    'stamps_awarded' => 1,
                    'daily_stamp_limit' => 1,
                ]
            );

            // 2g. Reward
            Reward::updateOrCreate(
                ['program_version_id' => $version->id],
                [
                    'title' => $data['reward_title'],
                    'description' => $data['reward_description'],
                    'reward_type' => 'free_item',
                    'reward_value' => $data['reward_value'],
                    'voucher_validity_days' => 30,
                ]
            );

            // 2h. User Merchant Stats (Streak)
            UserMerchantStat::updateOrCreate(
                ['customer_id' => $customer->id, 'merchant_id' => $merchant->id],
                [
                    'current_streak' => $data['current_streak'],
                    'longest_streak' => $data['longest_streak'],
                    'last_qualifying_visit_date' => $data['last_visit'],
                ]
            );

            // 2i. Stamp Card with progress
            $stampCard = StampCard::updateOrCreate(
                [
                    'customer_id' => $customer->id,
                    'loyalty_program_id' => $program->id,
                    'status' => 'active',
                ],
                [
                    'program_version_id' => $version->id,
                    'stamps_earned' => $data['card_progress'],
                    'started_at' => Carbon::now($timezone)->subDays(20),
                    'completed_at' => null,
                ]
            );

            // 2j. Clean & recreate Stamp Transactions for idempotency
            StampTransaction::where('stamp_card_id', $stampCard->id)->delete();
            for ($stamp = 1; $stamp <= $data['card_progress']; $stamp++) {
                StampTransaction::create([
                    'stamp_card_id' => $stampCard->id,
                    'program_version_id' => $version->id,
                    'source_type' => 'visit',
                    'source_id' => $stamp,
                    'stamps_awarded' => 1,
                    'created_at' => Carbon::now($timezone)->subDays($data['card_progress'] - $stamp + 1),
                ]);
            }
        }

        // -------------------------------------------------------------
        // 3. Customer Visits (Successful and Rejected)
        // -------------------------------------------------------------
        $cafe = $seededMerchants['himalayan-java'];
        $cafeQr = MerchantQrCode::where('merchant_id', $cafe->id)->where('type', 'permanent')->first();

        // Clear existing demo visits for idempotency
        Visit::where('customer_id', $customer->id)->delete();

        // 3a. Successful visit yesterday
        Visit::create([
            'merchant_id' => $cafe->id,
            'customer_id' => $customer->id,
            'merchant_qr_code_id' => $cafeQr->id,
            'scanned_at' => Carbon::now($timezone)->subDay()->setTime(9, 30),
            'local_date' => $yesterdayNepal,
            'timezone' => $timezone,
            'status' => 'successful',
            'rejection_reason' => null,
        ]);

        // 3b. Successful visit today
        Visit::create([
            'merchant_id' => $cafe->id,
            'customer_id' => $customer->id,
            'merchant_qr_code_id' => $cafeQr->id,
            'scanned_at' => Carbon::now($timezone)->setTime(10, 15),
            'local_date' => $todayNepal,
            'timezone' => $timezone,
            'status' => 'successful',
            'rejection_reason' => null,
        ]);

        // 3c. Rejected visit today (Rule 8: attempt recorded with rejection reason)
        Visit::create([
            'merchant_id' => $cafe->id,
            'customer_id' => $customer->id,
            'merchant_qr_code_id' => $cafeQr->id,
            'scanned_at' => Carbon::now($timezone)->setTime(14, 45),
            'local_date' => $todayNepal,
            'timezone' => $timezone,
            'status' => 'rejected',
            'rejection_reason' => 'Already stamped today',
        ]);

        // -------------------------------------------------------------
        // 4. Vouchers (1 Active, 1 Expired, 1 Used/Redeemed)
        // -------------------------------------------------------------
        // 4a. Active Voucher (Himalayan Java)
        $cafeCard = StampCard::where('customer_id', $customer->id)
            ->where('loyalty_program_id', $seededPrograms['himalayan-java']->id)
            ->first();

        Voucher::updateOrCreate(
            ['code' => 'VCH-ACTIVE-992'],
            [
                'merchant_id' => $cafe->id,
                'customer_id' => $customer->id,
                'stamp_card_id' => $cafeCard->id,
                'source_type' => 'stamp_card',
                'reward_title' => 'Free Specialty Beverage',
                'reward_description' => 'Enjoy any specialty coffee or handcrafted beverage on the house.',
                'reward_type' => 'free_item',
                'reward_value' => 380.00,
                'currency' => 'NPR',
                'status' => 'active',
                'issued_at' => Carbon::now($timezone)->subDays(5),
                'expires_at' => Carbon::now($timezone)->addDays(25),
                'redeemed_at' => null,
            ]
        );

        // 4b. Expired Voucher (Kavre Fitness)
        $gym = $seededMerchants['kavre-fitness-gym'];
        $gymCard = StampCard::where('customer_id', $customer->id)
            ->where('loyalty_program_id', $seededPrograms['kavre-fitness-gym']->id)
            ->first();

        Voucher::updateOrCreate(
            ['code' => 'VCH-EXPIRED-114'],
            [
                'merchant_id' => $gym->id,
                'customer_id' => $customer->id,
                'stamp_card_id' => $gymCard->id,
                'source_type' => 'stamp_card',
                'reward_title' => 'Free 1-Day Guest Pass',
                'reward_description' => 'All-access day pass for a workout buddy.',
                'reward_type' => 'free_item',
                'reward_value' => 500.00,
                'currency' => 'NPR',
                'status' => 'expired',
                'issued_at' => Carbon::now($timezone)->subDays(45),
                'expires_at' => Carbon::now($timezone)->subDays(15),
                'redeemed_at' => null,
            ]
        );

        // 4c. Used / Redeemed Voucher (Glow Beauty Salon)
        $salon = $seededMerchants['glow-beauty-salon'];
        $salonOwner = User::where('email', 'glow-salon@example.com')->first();
        $salonCard = StampCard::where('customer_id', $customer->id)
            ->where('loyalty_program_id', $seededPrograms['glow-beauty-salon']->id)
            ->first();

        $redeemedVoucher = Voucher::updateOrCreate(
            ['code' => 'VCH-REDEEMED-773'],
            [
                'merchant_id' => $salon->id,
                'customer_id' => $customer->id,
                'stamp_card_id' => $salonCard->id,
                'source_type' => 'stamp_card',
                'reward_title' => 'Express Manicure Treatment',
                'reward_description' => 'Complimentary express nail shaping and polish.',
                'reward_type' => 'free_item',
                'reward_value' => 600.00,
                'currency' => 'NPR',
                'status' => 'redeemed',
                'issued_at' => Carbon::now($timezone)->subDays(20),
                'expires_at' => Carbon::now($timezone)->addDays(10),
                'redeemed_at' => Carbon::now($timezone)->subDays(2),
            ]
        );

        // Add corresponding VoucherRedemption record
        VoucherRedemption::updateOrCreate(
            ['voucher_id' => $redeemedVoucher->id],
            [
                'merchant_id' => $salon->id,
                'redeemed_by' => $salonOwner->id,
                'redeemed_at' => Carbon::now($timezone)->subDays(2),
            ]
        );

        // -------------------------------------------------------------
        // 5. Targeted Offer (1 Unclaimed / Pending)
        // -------------------------------------------------------------
        TargetedOffer::updateOrCreate(
            [
                'merchant_id' => $cafe->id,
                'customer_id' => $customer->id,
                'title' => 'Weekend Croissant Delight',
            ],
            [
                'description' => 'Special invitation: 50% discount on freshly baked almond or butter croissants this weekend!',
                'reward_type' => 'discount',
                'reward_description' => '50% off all artisanal bakery items.',
                'reward_value' => 50.00,
                'voucher_validity_days' => 7,
                'status' => 'pending',
                'offered_at' => Carbon::now($timezone)->subDay(),
                'claim_expires_at' => Carbon::now($timezone)->addDays(4),
                'claimed_at' => null,
                'voucher_id' => null,
            ]
        );
    }
}
