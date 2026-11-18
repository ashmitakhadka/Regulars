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
    Schema::table('vouchers', function (Blueprint $table) {
        $table->foreignId('reward_id')
            ->nullable()
            ->after('stamp_card_id')
            ->constrained('rewards')
            ->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('vouchers', function (Blueprint $table) {
        $table->dropConstrainedForeignId('reward_id');
    });
}
};
