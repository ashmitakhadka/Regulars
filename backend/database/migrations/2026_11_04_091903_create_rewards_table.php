
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();

            $table->foreignId('program_version_id')
                ->unique()
                ->constrained('loyalty_program_versions')
                ->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('reward_type');

            $table->decimal('reward_value', 12, 2)->nullable();

            $table->unsignedInteger('voucher_validity_days')->default(30);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};
