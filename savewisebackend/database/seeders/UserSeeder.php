<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         // Admin korisnik
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin Save Wise',
                'password' => Hash::make('admin'),
                'user_type' => 'admin',
            ]
        );

        // 3 poznata korisnika
        $knownUsers = [
            [
                'name' => 'Antonina Mihajlovic',
                'email' => 'antonina@gmail.com',
                'password' => 'antonina',
            ],
            [
                'name' => 'Nadja Antonic',
                'email' => 'nadja@gmail.com',
                'password' => 'nadja',
            ],
            [
                'name' => 'Jovana Ninkovic',
                'email' => 'jovana@gmail.com',
                'password' => 'jovana',
            ],
        ];

        //fja da prodjemo i kreiramo poznate korisnike
        foreach ($knownUsers as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make($u['password']),
                    'user_type' => 'user',
                ]
            );
        }

        // Jos 6 random user-a
        User::factory()
            ->count(6)
            ->state(['user_type' => 'user'])
            ->create();
    
    }
}
