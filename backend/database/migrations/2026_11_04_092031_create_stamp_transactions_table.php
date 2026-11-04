
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stamp_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('stamp_card_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('program_version_id')
                ->constrained('loyalty_program_versions')
                ->restrictOnDelete();

            $table->string('source_type');
            $table->unsignedBigInteger('source_id');

            $table->unsignedInteger('stamps_awarded');

            $table->timestamps();

            $table->unique(
                ['stamp_card_id', 'source_type', 'source_id'],
                'stamp_source_card_unique'
            );

            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stamp_transactions');
    }
};
