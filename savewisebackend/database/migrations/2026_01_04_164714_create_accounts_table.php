<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
             $table->unsignedBigInteger('user_id');

            $table->string('name');

            $table->decimal('initial_balance', 12, 2)->default(0);
            $table->decimal('current_balance', 12, 2)->default(0);

            $table->enum('currency', ['RSD', 'EUR', ])->default('RSD');

            $table->timestamps();

            //dodavanje spoljnog kljuca 
            $table->foreign('user_id', 'fk_accounts_user')
                ->references('id')->on('users')
                ->onDelete('cascade');
        });

        DB::statement("ALTER TABLE accounts ADD CONSTRAINT chk_accounts_initial_balance_nonneg CHECK (initial_balance >= 0)");
        DB::statement("ALTER TABLE accounts ADD CONSTRAINT chk_accounts_current_balance_nonneg CHECK (current_balance >= 0)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
