<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   
public function up(): void
{
    Schema::table('rewards', function (Blueprint $table) {
        // Keep an index available for the existing foreign key.
        $table->index('program_version_id');

        // Now the unique index can safely be removed.
        $table->dropUnique(['program_version_id']);

        $table->foreignId('earning_rule_product_id')
            ->nullable()
            ->after('program_version_id')
            ->constrained('earning_rule_products')
            ->nullOnDelete();

        $table->unique(
            'earning_rule_product_id',
            'rewards_earning_rule_product_unique'
        );
    });
}

public function down(): void
{
    Schema::table('rewards', function (Blueprint $table) {
        $table->dropUnique('rewards_earning_rule_product_unique');

        $table->dropConstrainedForeignId('earning_rule_product_id');

        // Restore the original unique constraint first.
        $table->unique('program_version_id');

        $table->dropIndex(['program_version_id']);
    });
}

};
