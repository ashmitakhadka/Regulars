<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('earning_rule_tiers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('earning_rule_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->decimal('min_amount', 12, 2);
            $table->decimal('max_amount', 12, 2)->nullable();

            $table->unsignedInteger('stamps_awarded')->default(1);

            $table->timestamps();

            $table->unique(
                ['earning_rule_id', 'min_amount'],
                'earning_rule_tier_min_unique'
            );

            $table->index(['earning_rule_id', 'max_amount']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_rule_tiers');
    }
};
