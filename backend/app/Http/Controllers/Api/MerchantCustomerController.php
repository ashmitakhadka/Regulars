<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\LoyaltyProgram;
use App\Models\StampCard;
use App\Models\UserMerchantStat;
use Illuminate\Support\Facades\DB;

class MerchantCustomerController extends Controller
{
    public function getCustomers(Request $request)
    {
        // Get the authenticated merchant's business.
        $user = $request->user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized merchant access.',
            ], 403);
        }

        $merchant = $user->merchant()->first();

        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Merchant business not found.',
            ], 404);
        }

        // Validate search and pagination parameters.
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = $validated['per_page'] ?? 15;

        // Retrieve customers who have joined this merchant's programs.
        $customers = User::query()
            ->where('role', 'customer')
            ->whereHas('stampCards', function ($query) use ($merchant) {
                $query->whereHas('loyaltyProgram', function ($programQuery) use ($merchant) {
                    $programQuery->where('merchant_id', $merchant->id);
                });
            })
            // Search by customer details.
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('customer_code', 'like', "%{$search}%");
                });
            })
            // Load only this merchant's stamp cards and statistics.
            ->with([
                'stampCards' => function ($query) use ($merchant) {
                    $query->whereHas('loyaltyProgram', function ($programQuery) use ($merchant) {
                        $programQuery->where('merchant_id', $merchant->id);
                    })->with('loyaltyProgram:id,name');
                },
                'merchantStats' => function ($query) use ($merchant) {
                    $query->where('merchant_id', $merchant->id);
                },
            ])
            ->orderBy('name')
            ->paginate($perPage);

        // Format customer information for the API response.
        $data = $customers->getCollection()->map(function ($customer) {
            $stats = $customer->merchantStats->first();

            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'customer_code' => $customer->customer_code,

                'current_streak' => $stats?->current_streak ?? 0,
                'longest_streak' => $stats?->longest_streak ?? 0,

                'programs' => $customer->stampCards->map(function ($card) {
                    return [
                        'stamp_card_id' => $card->id,
                        'program_id' => $card->loyalty_program_id,
                        'program_name' => $card->loyaltyProgram->name,
                        'stamps_earned' => $card->stamps_earned,
                        'status' => $card->status,
                        'started_at' => $card->started_at,
                    ];
                })->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'last_page' => $customers->lastPage(),
            ],
        ]);
    }



public function enrollCustomer(Request $request)
{
    $user = $request->user();

    // Verify merchant account.
    if ($user->role !== 'merchant') {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized merchant access.',
        ], 403);
    }

    $merchant = $user->merchant()->first();

    if (!$merchant || $merchant->status !== 'active') {
        return response()->json([
            'success' => false,
            'message' => 'Active merchant business not found.',
        ], 403);
    }

    // Validate request data.
    $validated = $request->validate([
        'loyalty_program_id' => ['required', 'integer'],
        'identifier_type' => ['required', 'in:customer_code,phone'],
        'identifier' => ['required', 'string', 'max:100'],
    ]);

    return DB::transaction(function () use ($validated, $merchant) {

        // Find existing customer.
        $customer = User::query()
            ->where('role', 'customer')
            ->where($validated['identifier_type'], $validated['identifier'])
            ->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found.',
            ], 404);
        }

        // Verify that the program belongs to this merchant.
        $program = LoyaltyProgram::query()
            ->where('id', $validated['loyalty_program_id'])
            ->where('merchant_id', $merchant->id)
            ->where('status', 'active')
            ->lockForUpdate()
            ->first();

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Active loyalty program not found.',
            ], 404);
        }

        // Find the applicable active program version.
        $programVersion = $program->versions()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('effective_at')
                    ->orWhere('effective_at', '<=', now());
            })
            ->orderByDesc('version_number')
            ->first();

        if (!$programVersion) {
            return response()->json([
                'success' => false,
                'message' => 'No active program version available.',
            ], 422);
        }

        // Prevent duplicate active enrollment.
        $existingCard = StampCard::query()
            ->where('customer_id', $customer->id)
            ->where('loyalty_program_id', $program->id)
            ->where('status', 'active')
            ->exists();

        if ($existingCard) {
            return response()->json([
                'success' => false,
                'message' => 'Customer is already enrolled in this program.',
            ], 409);
        }

        // Create stamp card.
        $stampCard = StampCard::create([
            'customer_id' => $customer->id,
            'loyalty_program_id' => $program->id,
            'program_version_id' => $programVersion->id,
            'stamps_earned' => 0,
            'status' => 'active',
            'started_at' => now(),
        ]);

        // Initialize merchant-specific streak statistics.
        UserMerchantStat::firstOrCreate(
            [
                'customer_id' => $customer->id,
                'merchant_id' => $merchant->id,
            ],
            [
                'current_streak' => 0,
                'longest_streak' => 0,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Customer enrolled successfully.',
            'data' => [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'stamp_card_id' => $stampCard->id,
                'program_id' => $program->id,
                'program_name' => $program->name,
                'stamps_earned' => $stampCard->stamps_earned,
                'status' => $stampCard->status,
                'started_at' => $stampCard->started_at,
            ],
        ], 201);
    });
}

}