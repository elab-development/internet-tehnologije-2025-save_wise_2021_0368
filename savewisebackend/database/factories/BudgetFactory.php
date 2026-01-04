<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Budget;
use App\Models\User;
use App\Models\Category;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Budget>
 */
class BudgetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $month = $this->faker->numberBetween(1, 12);
        $year = $this->faker->numberBetween(2020, 2030);

        return [
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
            'name' => "Budžet {$month}/{$year}",
            'month' => $month,
            'year' => $year,
            'planned_amount' => $this->faker->randomFloat(2, 0, 300000),
        ];
    }
}
