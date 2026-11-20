<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MerchantVoucherController extends Controller
{
    /**
     * Resolve the active merchant for the logged-in user, or null.
     */
    private function resolveMerchant(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'merchant') {
            return null;
        }

        $merchant = $user->merchant()->first();

        return ($merchant && $merchant->status === 'active') ? $merchant : null;
    }

    private function forbidden()
    {
        return response()->json([
            'success' => false,
            'message' => 'Active merchant account not found.',
        ], 403);
    }

    /**
     * Limit a voucher query to one tab: active, redeemed or expired.
     */
    private function applyStatus($query, string $status)
    {
        $now = now()->utc();

        return match ($status) {
            'redeemed' => $query->where('status', 'redeemed'),

            'expired' => $query->where(function ($q) use ($now) {
                $q->where('status', 'expired')
                    ->orWhere(function ($q2) use ($now) {
                        $q2->where('status', 'active')
                            ->whereNull('redeemed_at')
                            ->where('expires_at', '<=', $now);
                    });
            }),

            default => $query->where('status', 'active')
                ->whereNull('redeemed_at')
                ->where(function ($q) use ($now) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
                }),
        };
    }

    /**
     * GET /merchant/vouchers?status=active|redeemed|expired&search=&page=&per_page=
     */
    public function index(Request $request)
    {
        $merchant = $this->resolveMerchant($request);

        if (!$merchant) {
            return $this->forbidden();
        }

        $status = in_array($request->query('status'), ['active', 'redeemed', 'expired'], true)
            ? $request->query('status')
            : 'active';
        $search = trim((string) $request->query('search', ''));
        $perPage = max(1, min((int) $request->query('per_page', 10), 50));

        $query = Voucher::query()
            ->where('merchant_id', $merchant->id)
            ->with('customer');

        $this->applyStatus($query, $status);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query
            ->orderByDesc($status === 'redeemed' ? 'redeemed_at' : 'id')
            ->paginate($perPage);

        $now = now()->utc();

        return response()->json([
            'success' => true,
            'data' => $paginator->getCollection()->map(fn ($v) => [
                'id' => $v->id,
                'code' => $v->code,
                'customer_name' => $v->customer?->name,
                'reward_title' => $v->reward_title,
                'reward_type' => $v->reward_type,
                'reward_value' => $v->reward_value,
                'program_name' => null, // Fill in once the voucher has a program relationship.
                'status' => ($v->status === 'active' && $v->expires_at && $v->expires_at->lte($now))
                    ? 'expired'
                    : $v->status,
                'expires_at' => $v->expires_at,
                'redeemed_at' => $v->redeemed_at,
            ])->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * GET /merchant/vouchers/stats
     */
    public function stats(Request $request)
    {
        $merchant = $this->resolveMerchant($request);

        if (!$merchant) {
            return $this->forbidden();
        }

        $timezone = $merchant->timezone ?? 'Asia/Kathmandu';
        $now = now()->utc();
        $startOfDay = now($timezone)->startOfDay()->utc();
        $startOfMonth = now($timezone)->startOfMonth()->utc();

        $base = fn () => Voucher::query()->where('merchant_id', $merchant->id);
        $redeemed = fn () => $base()->where('status', 'redeemed');
        $active = fn () => $this->applyStatus($base(), 'active');

        return response()->json([
            'success' => true,
            'data' => [
                'redeemed_today' => $redeemed()->where('redeemed_at', '>=', $startOfDay)->count(),
                'active' => $active()->count(),
                'expiring_soon' => $active()
                    ->whereBetween('expires_at', [$now, $now->copy()->addDays(7)])
                    ->count(),
                'redeemed_this_month' => $redeemed()->where('redeemed_at', '>=', $startOfMonth)->count(),
            ],
        ]);
    }

    public function redeemVoucher(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();

        if (!$user || $user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Only merchants can redeem vouchers.',
            ], 403);
        }

        $merchant = $user->merchant()->first();

        if (!$merchant || $merchant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        return DB::transaction(function () use ($validated, $merchant, $user) {

            $voucher = Voucher::where('code', $validated['code'])
                ->where('merchant_id', $merchant->id)
                ->lockForUpdate()
                ->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher not found.',
                ], 404);
            }

            if ($voucher->status !== 'active' || $voucher->redeemed_at !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'This voucher has already been redeemed or is inactive.',
                ], 422);
            }

            $timezone = $merchant->timezone ?? 'Asia/Kathmandu';
            $now = now($timezone)->utc();

            if ($voucher->expires_at && $voucher->expires_at->lte($now)) {
                $voucher->update([
                    'status' => 'expired',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'This voucher has expired.',
                ], 422);
            }

            $voucher->update([
                'status' => 'redeemed',
                'redeemed_at' => $now,
            ]);

            VoucherRedemption::create([
                'voucher_id' => $voucher->id,
                'merchant_id' => $merchant->id,
                'redeemed_by' => $user->id,
                'redeemed_at' => $now,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Voucher redeemed successfully.',
                'data' => [
                    'voucher_id' => $voucher->id,
                    'code' => $voucher->code,
                    'customer_id' => $voucher->customer_id,
                    'reward_title' => $voucher->reward_title,
                    'reward_type' => $voucher->reward_type,
                    'reward_value' => $voucher->reward_value,
                    'status' => $voucher->status,
                    'redeemed_at' => $voucher->redeemed_at,
                ],
            ], 200);
        });
    }
}