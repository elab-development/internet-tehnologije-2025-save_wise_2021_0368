<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        //da znamo sta nam je expense a sta income iz cateogry tabele
        $expenseCategories = Category::whereIn('name', [
            'Food',
            'Housing',
            'Bills',
            'Transportation',
            'Health',
            'Clothing & Footwear',
            'Entertainment',
            'Travel',
            'Pets',
            'Gifts',
            'Subscriptions',
        ])->get();

        $incomeCategories = Category::whereIn('name', [
            'Salary',
            'Bonus',
            'Gifts Received',
            'Other Income',
        ])->get();

        foreach (User::all() as $user) {

            $tekuci = Account::where('user_id', $user->id)->where('name', 'Tekući račun')->first();
            $kes = Account::where('user_id', $user->id)->where('name', 'Keš')->first();

            if (!$tekuci || !$kes) {
                continue;
            }

            // 2 expense: 1 sa tekućeg + 1 sa keša
            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $tekuci->id,
                'category_id' => $expenseCategories->random()->id,
                'amount' => fake()->randomFloat(2, 500, 15000),
                'date' => fake()->dateTimeBetween('2026-02-01', '2026-03-31'),
                'description' => fake()->optional()->sentence(5),
                'type' => 'expense',
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $kes->id,
                'category_id' => $expenseCategories->random()->id,
                'amount' => fake()->randomFloat(2, 200, 8000),
                'date' => fake()->dateTimeBetween('2026-02-01', '2026-03-31'),
                'description' => fake()->optional()->sentence(5),
                'type' => 'expense',
            ]);

            // 2 income: oba na tekući račun, samo iz ove 4 kategorije
            $cat1 = $incomeCategories->random();
            $cat2 = $incomeCategories->count() > 1
                ? $incomeCategories->where('id', '!=', $cat1->id)->values()->random()
                : $cat1;

            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $tekuci->id,
                'category_id' => $cat1->id,
                'amount' => fake()->randomFloat(2, 60000, 200000),
                'date' => fake()->dateTimeBetween('2026-02-01', '2026-03-31'),
                'description' => fake()->optional()->sentence(5),
                'type' => 'income',
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'account_id' => $tekuci->id,
                'category_id' => $cat2->id,
                'amount' => fake()->randomFloat(2, 5000, 80000),
                'date' => fake()->dateTimeBetween('2026-02-01', '2026-03-31'),
                'description' => fake()->optional()->sentence(5),
                'type' => 'income',
            ]);
        }
    }
}
