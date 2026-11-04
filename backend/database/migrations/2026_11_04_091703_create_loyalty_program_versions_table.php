
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_program_versions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('loyalty_program_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('version_number');
            $table->string('status')->default('active');
            $table->timestamp('effective_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['loyalty_program_id', 'version_number'],
                'program_version_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_program_versions');
    }
};
