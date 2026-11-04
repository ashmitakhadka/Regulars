
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('merchant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->decimal('total_amount', 12, 2);
            $table->string('currency', 3)->default('NPR');

            $table->string('reference')->nullable();

            $table->string('status')->default('pending');
            $table->string('verification_method')->default('manual');

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('purchased_at');
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();

            $table->index(['merchant_id', 'customer_id', 'purchased_at']);
            $table->index(['merchant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_transactions');
    }
};
