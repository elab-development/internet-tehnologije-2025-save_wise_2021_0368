<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
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
            'Salary', 
            'Bonus',
            'Gifts Received',
            'Other Income',
        ];

       foreach ($categories as $name) {
            Category::firstOrCreate(['name' => $name]);
        } 
    }
}
