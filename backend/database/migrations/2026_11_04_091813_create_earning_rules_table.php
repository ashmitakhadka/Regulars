
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('earning_rules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('program_version_id')
                ->unique()
                ->constrained('loyalty_program_versions')
                ->cascadeOnDelete();

            $table->string('earning_type');

            $table->decimal('threshold', 12, 2);
            $table->unsignedInteger('stamps_awarded')->default(1);

            $table->unsignedInteger('daily_stamp_limit')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_rules');
    }
};
