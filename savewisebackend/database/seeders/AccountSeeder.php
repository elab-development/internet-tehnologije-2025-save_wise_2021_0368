<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::query()->get();

        foreach ($users as $user) {
            // Tekući račun - pozivamo za svakog korisnika da se napravi 1 nalog 
            // tekuceg racuna sa random podacima
            if (!Account::where('user_id', $user->id)->where('name', 'Tekući račun')->exists()) {
                Account::factory()
                    ->for($user)
                    ->tekuciRacun()
                    ->create();
            }

            // Keš - pozivamo za svakog korisnika da se napravi 1 kes nalog sa random podacima
            if (!Account::where('user_id', $user->id)->where('name', 'Keš')->exists()) {
                Account::factory()
                    ->for($user)
                    ->kes()
                    ->create();
            }
        }
    }
}
