<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MerchantRewardProgramController extends Controller
{
    // 1. Get all programs belonging to the authenticated merchant
    public function getAllPrograms(Request $request)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $programs = $merchant->loyaltyPrograms()
            ->with([
                'versions.earningRule.tiers',
                'versions.earningRule.productRules.product',
                'versions.earningRule.productRules.reward',
                'versions.reward',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $programs,
        ]);
    }

    // 2. Create a program with its earning configuration and rewards
    public function createProgram(Request $request)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',

            'earning_type' => 'required|in:visit,purchase,quantity',

            'threshold' => 'nullable|numeric|min:0.01',
            'stamps_awarded' => 'nullable|integer|min:1',
            'daily_stamp_limit' => 'nullable|integer|min:1',

            // Purchase tiers
            'tiers' => 'sometimes|array|min:1',
            'tiers.*.min_amount' => 'required_with:tiers|numeric|min:0.01',
            'tiers.*.max_amount' => 'nullable|numeric|gt:tiers.*.min_amount',
            'tiers.*.stamps_awarded' => 'required_with:tiers|integer|min:1',

            // Quantity-based products
            'product_rules' => 'required_if:earning_type,quantity|array|min:1',
            'product_rules.*.product_id' => 'required|integer|exists:products,id',
            'product_rules.*.quantity_required' => 'required|integer|min:1',
            'product_rules.*.reward_title' => 'required|string|max:255',
            'product_rules.*.reward_description' => 'nullable|string',
            'product_rules.*.reward_type' => 'required|string|max:50',
            'product_rules.*.reward_value' => 'nullable|numeric|min:0',
            'product_rules.*.voucher_validity_days' => 'required|integer|min:1',

            // Shared reward for visit and purchase
            'reward_title' => 'required_unless:earning_type,quantity|string|max:255',
            'reward_description' => 'nullable|string',
            'reward_type' => 'required_unless:earning_type,quantity|string|max:50',
            'reward_value' => 'nullable|numeric|min:0',
            'voucher_validity_days' => 'required_unless:earning_type,quantity|integer|min:1',
        ]);

        // Validate the earning configuration.
        if ($validated['earning_type'] === 'visit') {
            if (empty($validated['threshold']) || empty($validated['stamps_awarded'])) {
                throw ValidationException::withMessages([
                    'threshold' => 'Visit threshold and stamps awarded are required.',
                ]);
            }
        }

        if ($validated['earning_type'] === 'purchase') {
            $hasTiers = !empty($validated['tiers']);

            if (!$hasTiers && (
                empty($validated['threshold']) ||
                empty($validated['stamps_awarded'])
            )) {
                throw ValidationException::withMessages([
                    'threshold' => 'A purchase threshold and stamp count are required when tiers are not configured.',
                ]);
            }
        }

        // Ensure all selected products belong to this merchant.
        if ($validated['earning_type'] === 'quantity') {
            $productIds = collect($validated['product_rules'])
                ->pluck('product_id')
                ->unique();

            $ownedProducts = Product::where('merchant_id', $merchant->id)
                ->whereIn('id', $productIds)
                ->where('status', 'active')
                ->count();

            if ($ownedProducts !== $productIds->count()) {
                throw ValidationException::withMessages([
                    'product_rules' => 'One or more selected products do not belong to your merchant account or are inactive.',
                ]);
            }

            if ($productIds->count() !== count($validated['product_rules'])) {
                throw ValidationException::withMessages([
                    'product_rules' => 'A product cannot be added more than once.',
                ]);
            }
        }

        $program = DB::transaction(function () use ($merchant, $validated) {

            $program = $merchant->loyaltyPrograms()->create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => 'active',
            ]);

            $version = $program->versions()->create([
                'version_number' => 1,
                'status' => 'active',
                'effective_at' => now(),
            ]);

            $earningRule = $version->earningRule()->create([
                'earning_type' => $validated['earning_type'],
                'threshold' => $validated['threshold'] ?? null,
                'stamps_awarded' => $validated['stamps_awarded'] ?? 1,
                'daily_stamp_limit' => $validated['daily_stamp_limit'] ?? null,
            ]);

            // Purchase-based tier configuration
            if (
                $validated['earning_type'] === 'purchase' &&
                !empty($validated['tiers'])
            ) {
                foreach ($validated['tiers'] as $tier) {
                    $earningRule->tiers()->create([
                        'min_amount' => $tier['min_amount'],
                        'max_amount' => $tier['max_amount'] ?? null,
                        'stamps_awarded' => $tier['stamps_awarded'],
                    ]);
                }
            }

            // Quantity-based product configuration
            if ($validated['earning_type'] === 'quantity') {
                foreach ($validated['product_rules'] as $productRule) {

                    $ruleProduct = $earningRule->productRules()->create([
                        'product_id' => $productRule['product_id'],
                        'quantity_required' => $productRule['quantity_required'],
                    ]);

                    $ruleProduct->reward()->create([
                        'program_version_id' => $version->id,
                        'title' => $productRule['reward_title'],
                        'description' => $productRule['reward_description'] ?? null,
                        'reward_type' => $productRule['reward_type'],
                        'reward_value' => $productRule['reward_value'] ?? null,
                        'voucher_validity_days' => $productRule['voucher_validity_days'],
                    ]);
                }
            }

            // Shared reward for visit and purchase programs
            if ($validated['earning_type'] !== 'quantity') {
                $version->reward()->create([
                    'title' => $validated['reward_title'],
                    'description' => $validated['reward_description'] ?? null,
                    'reward_type' => $validated['reward_type'],
                    'reward_value' => $validated['reward_value'] ?? null,
                    'voucher_validity_days' => $validated['voucher_validity_days'],
                ]);
            }

            return $program->load([
                'versions.earningRule.tiers',
                'versions.earningRule.productRules.product',
                'versions.earningRule.productRules.reward',
                'versions.reward',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Reward program created successfully.',
            'data' => $program,
        ], 201);
    }

    // 3. Get details of one merchant-owned program
    public function getProgramDetails(Request $request, $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $program = $merchant->loyaltyPrograms()
            ->with([
                'versions.earningRule.tiers',
                'versions.earningRule.productRules.product',
                'versions.earningRule.productRules.reward',
                'versions.reward',
            ])
            ->find($id);

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Reward program not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $program,
        ]);
    }

    // 4. Update basic program details
    public function updateProgram(Request $request, $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $program = $merchant->loyaltyPrograms()->find($id);

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Reward program not found.',
            ], 404);
        }

        if ($program->status === 'archived') {
            return response()->json([
                'success' => false,
                'message' => 'Archived programs cannot be edited.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
        ]);

        if (empty($validated)) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide program details to update.',
            ], 422);
        }

        $program->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward program updated successfully.',
            'data' => $program,
        ]);
    }

    // 5. Activate or deactivate a program
    public function updateProgramStatus(Request $request, $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $program = $merchant->loyaltyPrograms()->find($id);

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Reward program not found.',
            ], 404);
        }

        if ($program->status === 'archived') {
            return response()->json([
                'success' => false,
                'message' => 'Archived programs cannot be reactivated.',
            ], 422);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $program->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reward program status updated successfully.',
            'data' => $program,
        ]);
    }

    // 6. Archive a program without permanently deleting its history
    public function archiveProgram(Request $request, $id)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $program = $merchant->loyaltyPrograms()->find($id);

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Reward program not found.',
            ], 404);
        }

        $program->update([
            'status' => 'archived',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reward program archived successfully.',
        ]);
    }

    // 7. Reusable merchant authentication and status check
    private function getAuthenticatedMerchant(Request $request): Merchant
    {
        $user = $request->user();
        $merchant = $user?->merchant;

        abort_unless(
            $user &&
            $user->role === 'merchant' &&
            $merchant &&
            $merchant->status === 'active',
            403,
            'Unauthorized merchant access.'
        );

        return $merchant;
    }
}
