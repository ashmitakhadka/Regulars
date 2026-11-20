<?php

namespace App\Services\Customer;

use App\Models\LoyaltyProgram;
use App\Models\Merchant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class CustomerBusinessService
{
    /**
     * List active businesses that have at least one active loyalty program.
     */
    public function listBusinesses(Request $request): LengthAwarePaginator
    {
        $query = Merchant::query()
            ->where('status', 'active')
            ->whereHas('loyaltyPrograms', function ($q) {
                $q->where('status', 'active');
            })
            ->withCount(['loyaltyPrograms as active_programs_count' => function ($q) {
                $q->where('status', 'active');
            }]);

        // Search by business name
        if ($search = trim((string) $request->input('search', ''))) {
            $query->where('business_name', 'like', '%' . $search . '%');
        }

        // Filter by category (safely ignores merchants with null category)
        if ($category = trim((string) $request->input('category', ''))) {
            $query->whereNotNull('category')
                ->where('category', $category);
        }

        $perPage = min(max((int) $request->input('per_page', 12), 1), 30);
        $page = max((int) $request->input('page', 1), 1);

        return $query->orderBy('business_name', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Retrieve details for an active business and its active programs.
     * Returns null if business is suspended or does not exist.
     */
    public function getBusinessBySlug(string $slug, int $customerId): ?Merchant
    {
        return Merchant::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->with([
                'loyaltyPrograms' => function ($q) use ($customerId) {
                    $q->where('status', 'active')
                        ->with([
                            'versions' => function ($v) {
                                $v->where('status', 'active')->with(['earningRule', 'reward']);
                            },
                            'stampCards' => function ($sc) use ($customerId) {
                                $sc->where('customer_id', $customerId)
                                    ->where('status', 'active');
                            },
                        ]);
                },
            ])
            ->first();
    }

    /**
     * Retrieve details for a single active loyalty program.
     * Returns null if program is inactive/paused/archived or merchant is suspended/not found.
     */
    public function getProgramById(int $programId, int $customerId): ?LoyaltyProgram
    {
        return LoyaltyProgram::query()
            ->where('id', $programId)
            ->where('status', 'active')
            ->whereHas('merchant', function ($m) {
                $m->where('status', 'active');
            })
            ->with([
                'merchant',
                'versions' => function ($v) {
                    $v->where('status', 'active')->with(['earningRule', 'reward']);
                },
                'stampCards' => function ($sc) use ($customerId) {
                    $sc->where('customer_id', $customerId)
                        ->where('status', 'active');
                },
            ])
            ->first();
    }
}
