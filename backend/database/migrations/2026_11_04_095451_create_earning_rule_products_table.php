
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('earning_rule_products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('earning_rule_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(
                ['earning_rule_id', 'product_id'],
                'earning_rule_product_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_rule_products');
    }
};
