
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_qr_codes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('merchant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('type');
            $table->string('token_hash')->unique();

            $table->boolean('is_active')->default(true);

            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_refreshed_at')->nullable();

            $table->timestamps();

            $table->index(['merchant_id', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_qr_codes');
    }
};
