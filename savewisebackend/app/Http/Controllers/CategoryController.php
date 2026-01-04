<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Database\QueryException;

class CategoryController extends Controller
{
    // Pregled liste kategorija (svima dostupno)
    public function index()
    {
        return response()->json(Category::orderBy('name')->get());
    }

    // Pregled jedne kategorije
    public function show(Category $category)
    {
        return response()->json($category);
    }

    // Kreiranje kategorije - admin
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:categories,name'],
        ]);

        $category = Category::create([
            'name' => $validated['name'],
        ]);

        return response()->json($category, 201);
    }

    // Izmena kategorije - admin
    public function update(Request $request, Category $category)
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
        ]);

        $category->update([
            'name' => $validated['name'],
        ]);

        return response()->json($category);
    }

    // Brisanje kategorije - admin
    public function destroy(Request $request, Category $category)
    {
        $this->ensureAdmin($request);

        try {
            $category->delete();
            return response()->json(['message' => 'Category deleted.']);
        } catch (QueryException $e) {
            // Ako kategorija ima povezane transakcije/budžete, FK restrict će baciti grešku
            return response()->json([
                'message' => 'Category cannot be deleted because it is used in budgets/transactions.',
            ], 409);
        }
    }

    //pomocna fja da samo admin moze neke stvari da radi
    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();

        if (!$user || $user->user_type !== 'admin') {
            abort(403, 'Forbidden.');
        }
    }
}
