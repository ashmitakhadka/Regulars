<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminStatsService;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    public function __construct(
        protected AdminStatsService $statsService
    ) {}

    public function stats(): JsonResponse
    {
        return $this->statsService->getStats();
    }
}
