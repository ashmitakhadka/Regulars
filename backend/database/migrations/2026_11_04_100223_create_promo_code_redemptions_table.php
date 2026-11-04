
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_code_redemptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('promo_code_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('voucher_id')
                ->unique()
                ->constrained()
                ->restrictOnDelete();

            $table->timestamp('redeemed_at');

            $table->timestamps();

            $table->unique(
                ['promo_code_id', 'customer_id'],
                'promo_code_customer_unique'
            );

            $table->index(['customer_id', 'redeemed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_code_redemptions');
    }
};
