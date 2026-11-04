
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voucher_redemptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('voucher_id')
                ->unique()
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('merchant_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('redeemed_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamp('redeemed_at');

            $table->timestamps();

            $table->index(['merchant_id', 'redeemed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_redemptions');
    }
};
