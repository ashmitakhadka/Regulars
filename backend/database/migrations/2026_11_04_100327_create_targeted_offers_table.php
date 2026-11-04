
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('targeted_offers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('merchant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            // Snapshot of the reward offered to the customer.
            $table->string('reward_type');
            $table->text('reward_description')->nullable();
            $table->decimal('reward_value', 12, 2)->nullable();
            $table->unsignedInteger('voucher_validity_days')->default(30);

            $table->string('status')->default('pending');

            $table->timestamp('offered_at');
            $table->timestamp('claim_expires_at')->nullable();
            $table->timestamp('claimed_at')->nullable();

            $table->foreignId('voucher_id')
                ->nullable()
                ->unique()
                ->constrained()
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['merchant_id', 'customer_id', 'status']);
            $table->index('claim_expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('targeted_offers');
    }
};
