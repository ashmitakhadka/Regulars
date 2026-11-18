<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('stamp_transactions', function (Blueprint $table) {
        $table->foreignId('earning_rule_product_id')
            ->nullable()
            ->after('program_version_id')
            ->constrained('earning_rule_products')
            ->nullOnDelete();

        $table->foreignId('earning_rule_tier_id')
            ->nullable()
            ->after('earning_rule_product_id')
            ->constrained('earning_rule_tiers')
            ->nullOnDelete();

        $table->foreignId('awarded_by_user_id')
            ->nullable()
            ->after('stamps_awarded')
            ->constrained('users')
            ->nullOnDelete();

        $table->uuid('idempotency_key')
            ->nullable()
            ->unique();
    });
}

public function down(): void
{
    Schema::table('stamp_transactions', function (Blueprint $table) {
        $table->dropUnique(['idempotency_key']);
        $table->dropConstrainedForeignId('awarded_by_user_id');
        $table->dropConstrainedForeignId('earning_rule_tier_id');
        $table->dropConstrainedForeignId('earning_rule_product_id');
    });
}
};
