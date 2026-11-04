
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('promotion_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('code')->unique();

            $table->unsignedInteger('usage_limit')->default(1);
            $table->unsignedInteger('usage_count')->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['promotion_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_codes');
    }
};
