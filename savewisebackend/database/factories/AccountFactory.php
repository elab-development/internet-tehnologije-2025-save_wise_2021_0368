<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Account;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Account>
 */
class AccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        //pocetni i trenutni balans na nalogu
        $initial = $this->faker->randomFloat(2, 0, 300000);
        $current = $this->faker->randomFloat(2, 0, 300000);

        return [
            'user_id' => User::factory(),
            'name' => $this->faker->word(),
            'initial_balance' => $initial,
            'current_balance' => $current,
            'currency' => 'RSD', // fiksno
        ];

    }

    //fja kada generisemo tekuci racun nalog
    public function tekuciRacun(): static
    {
        return $this->state(function () {
            $initial = $this->faker->randomFloat(2, 10000, 300000);
            $current = $this->faker->randomFloat(2, 0, 300000);

            return [
                'name' => 'Tekući račun',
                'initial_balance' => $initial,
                'current_balance' => $current,
                'currency' => 'RSD',
            ];
        });
    }

    //fja kada generisemo kes nalog
    public function kes(): static
    {
        return $this->state(function () {
            $initial = $this->faker->randomFloat(2, 0, 50000);
            $current = $this->faker->randomFloat(2, 0, 50000);

            return [
                'name' => 'Keš',
                'initial_balance' => $initial,
                'current_balance' => $current,
                'currency' => 'RSD',
            ];
        });
    }
}
