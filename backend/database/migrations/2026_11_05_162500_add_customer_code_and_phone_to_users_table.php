<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('customer_code', 16)->nullable()->unique()->after('role');
            $table->string('phone', 20)->nullable()->unique()->after('customer_code');
        });

        // Backfill existing customer accounts using only DB queries inside the migration
        $customers = DB::table('users')
            ->where('role', 'customer')
            ->whereNull('customer_code')
            ->select('id')
            ->get();

        if ($customers->isNotEmpty()) {
            $prefix = 'RG-';
            $length = 6;
            $alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
            $alphabetLength = strlen($alphabet);
            $assignedCodes = [];

            foreach ($customers as $customer) {
                do {
                    $random = '';
                    for ($i = 0; $i < $length; $i++) {
                        $random .= $alphabet[random_int(0, $alphabetLength - 1)];
                    }
                    $candidate = $prefix . $random;
                } while (
                    isset($assignedCodes[$candidate]) ||
                    DB::table('users')->where('customer_code', $candidate)->exists()
                );

                $assignedCodes[$candidate] = true;

                DB::table('users')
                    ->where('id', $customer->id)
                    ->update([
                        'customer_code' => $candidate,
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['customer_code']);
            $table->dropUnique(['phone']);
            $table->dropColumn(['customer_code', 'phone']);
        });
    }
};

