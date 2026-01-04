<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Hrana',
            'Stanovanje',
            'Računi',
            'Prevoz',
            'Gorivo',
            'Zdravlje',
            'Obrazovanje',
            'Odeća i obuća',
            'Zabava',
            'Putovanja',
            'Kućni ljubimci',
            'Pokloni',
            'Lična nega',
            'Pretplate',
            'Stednja',
        ];

       foreach ($categories as $name) {
            Category::firstOrCreate(['name' => $name]);
        } 
    }
}
