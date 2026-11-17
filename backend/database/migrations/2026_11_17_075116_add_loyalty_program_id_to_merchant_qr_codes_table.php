
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant_qr_codes', function (Blueprint $table) {
            $table->foreignId('loyalty_program_id')
                ->nullable()
                ->after('merchant_id')
                ->constrained('loyalty_programs')
                ->cascadeOnDelete();

            $table->unique('loyalty_program_id');
        });
    }

    public function down(): void
    {
        Schema::table('merchant_qr_codes', function (Blueprint $table) {
            $table->dropUnique(['loyalty_program_id']);
            $table->dropConstrainedForeignId('loyalty_program_id');
        });
    }
};
