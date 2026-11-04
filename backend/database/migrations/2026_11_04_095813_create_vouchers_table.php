
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('merchant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('stamp_card_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('code')->unique();

            // Identifies how the voucher was issued.
            $table->string('source_type');

            // Snapshot of the reward when the voucher is issued.
            $table->string('reward_title');
            $table->text('reward_description')->nullable();
            $table->string('reward_type');
            $table->decimal('reward_value', 12, 2)->nullable();
            $table->string('currency', 3)->default('NPR');

            $table->string('status')->default('active');

           $table->dateTime('issued_at');
            
           $table->dateTime('expires_at');
            $table->timestamp('redeemed_at')->nullable();

            $table->timestamps();

            $table->index(
                ['merchant_id', 'customer_id', 'status'],
                'vouchers_merchant_customer_status_index'
            );

            $table->index(['merchant_id', 'expires_at']);
            $table->index('source_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
