
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stamp_cards', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('loyalty_program_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('program_version_id')
                ->constrained('loyalty_program_versions')
                ->restrictOnDelete();

            $table->unsignedInteger('stamps_earned')->default(0);

            $table->string('status')->default('active');

            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(
                ['customer_id', 'loyalty_program_id', 'status'],
                'stamp_cards_customer_program_status_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stamp_cards');
    }
};
