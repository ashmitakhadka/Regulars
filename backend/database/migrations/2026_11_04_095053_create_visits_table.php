
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();

            $table->foreignId('merchant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('merchant_qr_code_id')
                ->nullable()
                ->constrained('merchant_qr_codes')
                ->nullOnDelete();

            $table->timestamp('scanned_at');
            $table->date('local_date');
            $table->string('timezone');

            $table->string('status')->default('pending');
            $table->string('rejection_reason')->nullable();

            $table->timestamps();

            $table->index(['merchant_id', 'customer_id', 'local_date']);
            $table->index(['merchant_id', 'status', 'scanned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
