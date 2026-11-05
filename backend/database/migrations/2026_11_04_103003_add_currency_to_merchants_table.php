<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('merchants', 'currency')) {
            Schema::table('merchants', function (Blueprint $table) {
                $table->string('currency', 3)->default('NPR');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('merchants', 'currency')) {
            Schema::table('merchants', function (Blueprint $table) {
                $table->dropColumn('currency');
            });
        }
    }
};