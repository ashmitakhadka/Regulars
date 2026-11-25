<?php

namespace App\Services\Admin;

use App\Http\Requests\Admin\UpdateMerchantProRequest;
use App\Http\Requests\Admin\UpdateMerchantStatusRequest;
use App\Http\Resources\Admin\AdminMerchantDetailResource;
use App\Http\Resources\Admin\AdminMerchantResource;
use App\Models\LoyaltyProgram;
use App\Models\Merchant;
use App\Models\StampTransaction;
use App\Models\UserMerchantStat;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminMerchantService
{
    /**
     * List merchants with search, filters, and pagination.
     */
    public function listMerchants(Request $request): JsonResponse
    {
        $query = Merchant::query()
            ->with('user:id,name,email')
            ->withCount([
                'loyaltyPrograms as programs_count',
                'customerStats as customers_count',
            ]);

        // Search: trim, cap at 100 chars, escape LIKE special characters
        $rawSearch = $request->query('search');
        if ($rawSearch !== null && $rawSearch !== '') {
            $trimmed = mb_substr(trim((string) $rawSearch), 0, 100);
            if ($trimmed !== '') {
                $escaped = addcslashes($trimmed, '%_\\');
                $query->where(function ($q) use ($escaped) {
                    $q->where('business_name', 'like', "%{$escaped}%")
                        ->orWhereHas('user', function ($uq) use ($escaped) {
                            $uq->where('email', 'like', "%{$escaped}%");
                        });
                });
            }
        }

        // Status filter: all | active | suspended
        $status = $request->query('status');
        if (in_array($status, ['active', 'suspended'], true)) {
            $query->where('status', $status);
        }

        // Pro filter: all | yes | no
        $pro = $request->query('pro');
        if ($pro === 'yes' || $pro === '1' || $pro === 'true') {
            $query->where('is_pro', true);
        } elseif ($pro === 'no' || $pro === '0' || $pro === 'false') {
            $query->where('is_pro', false);
        }

        // Pagination: default 15, max 50, newest first
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 1) {
            $perPage = 15;
        } elseif ($perPage > 50) {
            $perPage = 50;
        }

        $paginated = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'merchants' => AdminMerchantResource::collection($paginated->items()),
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'last_page' => $paginated->lastPage(),
                ],
            ],
            'message' => 'Merchants retrieved successfully.',
        ], 200);
    }

    /**
     * Retrieve single merchant details with counts and recent activity (stamp_transactions only).
     */
    public function getMerchant(int $id): JsonResponse
    {
        $merchant = Merchant::with('user:id,name,email')->find($id);

        if (! $merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Merchant not found.',
            ], 404);
        }

        $programsTotal = LoyaltyProgram::where('merchant_id', $merchant->id)->count();
        $programsActive = LoyaltyProgram::where('merchant_id', $merchant->id)->where('status', 'active')->count();
        $customersCount = UserMerchantStat::where('merchant_id', $merchant->id)->count();

        $stampsAwarded = (int) StampTransaction::whereHas('stampCard.loyaltyProgram', function ($q) use ($merchant) {
            $q->where('merchant_id', $merchant->id);
        })->sum('stamps_awarded');

        $vouchersIssued = Voucher::where('merchant_id', $merchant->id)->count();
        $vouchersRedeemed = Voucher::where('merchant_id', $merchant->id)->whereNotNull('redeemed_at')->count();

        // 10 newest stamp_transactions only, eager loaded
        $recentTransactions = StampTransaction::query()
            ->whereHas('stampCard.loyaltyProgram', function ($q) use ($merchant) {
                $q->where('merchant_id', $merchant->id);
            })
            ->with([
                'stampCard.customer:id,name,customer_code',
                'stampCard.loyaltyProgram:id,name',
            ])
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(function ($tx) {
                return [
                    'id' => $tx->id,
                    'occurred_at' => $tx->created_at?->toISOString(),
                    'customer' => [
                        'name' => $tx->stampCard?->customer?->name,
                        'customer_code' => $tx->stampCard?->customer?->customer_code,
                    ],
                    'program_name' => $tx->stampCard?->loyaltyProgram?->name,
                    'stamps_awarded' => (int) $tx->stamps_awarded,
                    'description' => "{$tx->stamps_awarded} stamp(s) awarded",
                ];
            });

        $merchant->additional_stats = [
            'programs_total' => $programsTotal,
            'programs_active' => $programsActive,
            'customers_count' => $customersCount,
            'stamps_awarded' => $stampsAwarded,
            'vouchers_issued' => $vouchersIssued,
            'vouchers_redeemed' => $vouchersRedeemed,
        ];
        $merchant->recent_activity = $recentTransactions;

        return response()->json([
            'success' => true,
            'data' => new AdminMerchantDetailResource($merchant),
            'message' => 'Merchant details retrieved successfully.',
        ], 200);
    }

    /**
     * Update merchant status (active | suspended).
     * Modifies ONLY the status column.
     */
    public function updateStatus(int $id, UpdateMerchantStatusRequest $request): JsonResponse
    {
        $merchant = Merchant::with('user:id,name,email')->find($id);

        if (! $merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Merchant not found.',
            ], 404);
        }

        $oldStatus = $merchant->status;
        $newStatus = $request->validated()['status'];

        $merchant->status = $newStatus;
        $merchant->save();

        Log::info('[admin.merchant.status_updated] Merchant status updated', [
            'admin_id' => $request->user()->id,
            'merchant_id' => $merchant->id,
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new AdminMerchantResource($merchant),
            'message' => 'Merchant status updated successfully.',
        ], 200);
    }

    /**
     * Update merchant is_pro flag.
     * Modifies ONLY the is_pro column.
     */
    public function updatePro(int $id, UpdateMerchantProRequest $request): JsonResponse
    {
        $merchant = Merchant::with('user:id,name,email')->find($id);

        if (! $merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Merchant not found.',
            ], 404);
        }

        $oldPro = (bool) $merchant->is_pro;
        $newPro = (bool) $request->validated()['is_pro'];

        $merchant->is_pro = $newPro;
        $merchant->save();

        Log::info('[admin.merchant.pro_updated] Merchant pro status updated', [
            'admin_id' => $request->user()->id,
            'merchant_id' => $merchant->id,
            'old_value' => $oldPro,
            'new_value' => $newPro,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new AdminMerchantResource($merchant),
            'message' => 'Merchant pro status updated successfully.',
        ], 200);
    }
}
