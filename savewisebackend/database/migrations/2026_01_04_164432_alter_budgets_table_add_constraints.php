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
        Schema::table('budgets', function (Blueprint $table) {
            // FK
            $table->foreign('user_id', 'fk_budgets_user')
                ->references('id')->on('users')
                ->onDelete('cascade');

            $table->foreign('category_id', 'fk_budgets_category')
                ->references('id')->on('categories')
                ->onDelete('restrict');

            // Unique
            $table->unique(['user_id', 'category_id', 'month', 'year'], 'uniq_budget_user_cat_period');
        });

        // CHECK ogranicenja
        DB::statement("ALTER TABLE budgets ADD CONSTRAINT chk_budgets_month_range CHECK (month BETWEEN 1 AND 12)");
        DB::statement("ALTER TABLE budgets ADD CONSTRAINT chk_budgets_year_min CHECK (year >= 2000)");
        DB::statement("ALTER TABLE budgets ADD CONSTRAINT chk_budgets_planned_amount_nonneg CHECK (planned_amount >= 0)");
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         // DROP CHECK (MySQL)
        DB::statement("ALTER TABLE budgets DROP CHECK chk_budgets_month_range");
        DB::statement("ALTER TABLE budgets DROP CHECK chk_budgets_year_min");
        DB::statement("ALTER TABLE budgets DROP CHECK chk_budgets_planned_amount_nonneg");

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropForeign('fk_budgets_user');
            $table->dropForeign('fk_budgets_category');
            $table->dropUnique('uniq_budget_user_cat_period');
        });
    }
};
