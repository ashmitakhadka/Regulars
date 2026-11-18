<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('earning_rule_products', function (Blueprint $table) {
            $table->unsignedInteger('quantity_required')
                ->nullable()
                ->after('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('earning_rule_products', function (Blueprint $table) {
            $table->dropColumn('quantity_required');
        });
    }
};
