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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('account_id');
            $table->unsignedBigInteger('category_id');

            $table->decimal('amount', 12, 2);
            $table->dateTime('date');
            $table->string('description')->nullable();

            $table->enum('type', ['income', 'expense']);

            $table->timestamps();

            //spoljni kljucevi za transakcije
            $table->foreign('user_id', 'fk_transactions_user')
                ->references('id')->on('users')
                ->onDelete('cascade');

            $table->foreign('account_id', 'fk_transactions_account')
                ->references('id')->on('accounts')
                ->onDelete('restrict');

            $table->foreign('category_id', 'fk_transactions_category')
                ->references('id')->on('categories')
                ->onDelete('restrict');
        });

        DB::statement("ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_gt_zero CHECK (amount > 0)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
