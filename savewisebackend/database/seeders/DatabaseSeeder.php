<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
         $this->call([
            UserSeeder::class,       // 1 admin + 3 poznata + 6 random
            CategorySeeder::class,   // 15 fiksnih kategorija
            AccountSeeder::class,    // 2 accounta po user-u (Tekuci + Kes)
            BudgetSeeder::class,     // 4 budžeta po user-u za Feb/Mar 2026
            TransactionSeeder::class // 4 transakcije po user-u (2 exp, 2 inc)
        ]);
    }
}
