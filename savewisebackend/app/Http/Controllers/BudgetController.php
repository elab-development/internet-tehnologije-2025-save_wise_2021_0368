<?php

namespace App\Http\Controllers;

use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BudgetController extends Controller
{
    // Pregled liste budžeta (samo budžeti ulogovanog korisnika)
    // Filteri: month, year, category_id ili category_name
    // Paginacija: 6 po strani 
    public function index(Request $request)
    {
        $validated = $request->validate([
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'min:2000'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'category_name' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = $validated['per_page'] ?? 6;

        $query = Budget::query()
            ->where('user_id', $request->user()->id)
            ->with('category'); 

        if (!empty($validated['month'])) {
            $query->where('month', $validated['month']);
        }

        if (!empty($validated['year'])) {
            $query->where('year', $validated['year']);
        }

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        } elseif (!empty($validated['category_name'])) {
            $query->whereHas('category', function ($q) use ($validated) {
                $q->where('name', $validated['category_name']);
            });
        }

        $budgets = $query
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return BudgetResource::collection($budgets);
    }

    //  Kreiranje budžeta (ulogovani korisnik).
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'min:2000'],
            'planned_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $budget = Budget::create([
            'user_id' => $request->user()->id,
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'month' => $validated['month'],
            'year' => $validated['year'],
            'planned_amount' => $validated['planned_amount'],
        ]);

        return (new BudgetResource($budget->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    // Ažuriranje budžeta (samo svoj budžet).
    public function update(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(403, 'Forbidden.');
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'month' => ['sometimes', 'integer', 'between:1,12'],
            'year' => ['sometimes', 'integer', 'min:2000'],
            'planned_amount' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $budget->update($validated);

        return new BudgetResource($budget->load('category'));
    }

    // Brisanje budžeta (samo svoj budžet).
    public function destroy(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(403, 'Forbidden.');
        }

        $budget->delete();

        return response()->json(['message' => 'Budget deleted.']);
    }
}
