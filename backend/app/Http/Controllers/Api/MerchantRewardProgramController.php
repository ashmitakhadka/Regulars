<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MerchantRewardProgramController extends Controller
{
    // 1. Get all programs belonging to the authenticated merchant
    public function getAllPrograms(Request $request)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $programs = $merchant->loyaltyPrograms()
            ->with(['versions.earningRule', 'versions.reward'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $programs,
        ]);
    }

    // 2. Create a program with its first version, earning rule, and reward
    public function createProgram(Request $request)
    {
        $merchant = $this->getAuthenticatedMerchant($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',

            'earning_type' => 'required|in:visit,purchase,quantity',
            'threshold' => 'required|numeric|min:0.01',
            'stamps_awarded' => 'required|integer|min:1',
            'daily_stamp_limit' => 'nullable|integer|min:1',

            'reward_title' => 'required|string|max:255',
            'reward_description' => 'nullable|string',
            'reward_type' => 'required|string|max:50',
            'reward_value' => 'nullable|numeric|min:0',
            'voucher_validity_days' => 'required|integer|min:1',
        ]);

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

            $version->earningRule()->create([
                'earning_type' => $validated['earning_type'],
                'threshold' => $validated['threshold'],
                'stamps_awarded' => $validated['stamps_awarded'],
                'daily_stamp_limit' => $validated['daily_stamp_limit'] ?? null,
            ]);

            $version->reward()->create([
                'title' => $validated['reward_title'],
                'description' => $validated['reward_description'] ?? null,
                'reward_type' => $validated['reward_type'],
                'reward_value' => $validated['reward_value'] ?? null,
                'voucher_validity_days' => $validated['voucher_validity_days'],
            ]);

            return $program->load(['versions.earningRule', 'versions.reward']);
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
            ->with(['versions.earningRule', 'versions.reward'])
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
