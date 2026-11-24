<?php

namespace App\Http\Resources\Customer;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerProfileResource extends JsonResource
{
    /**
     * Disable data wrapping on the resource level since custom response format is used.
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     * Returns strictly: id, name, email, phone, customer_code, and member_since (Asia/Kathmandu date).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $memberSince = null;
        if ($this->created_at) {
            $memberSince = Carbon::parse($this->created_at)->setTimezone('Asia/Kathmandu')->format('Y-m-d');
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'customer_code' => $this->customer_code,
            'member_since' => $memberSince,
        ];
    }
}
