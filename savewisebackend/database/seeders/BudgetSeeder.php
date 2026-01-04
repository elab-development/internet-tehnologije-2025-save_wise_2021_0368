<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Budget;
use App\Models\User;
use App\Models\Category;

class BudgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
       $categories = Category::whereIn('name', ['Food', 'Housing', 'Transportation', 'Entertainment'])
            ->take(4)
            ->get();

        foreach (User::all() as $user) {

            foreach ($categories as $category) {

                $amount = fake()->randomFloat(2, 5000, 80000);

                // Februar 2026
                Budget::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'category_id' => $category->id,
                        'month' => 2,
                        'year' => 2026,
                    ],
                    [
                        'planned_amount' => $amount,
                        'name' => "Budžet za {$category->name} - Februar 2026",
                    ]
                );

                // Mart 2026 (isti amount, drugo ime)
                Budget::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'category_id' => $category->id,
                        'month' => 3,
                        'year' => 2026,
                    ],
                    [
                        'planned_amount' => $amount,
                        'name' => "Budžet za {$category->name} - Mart 2026",
                    ]
                );
            }
        }
    }
}
