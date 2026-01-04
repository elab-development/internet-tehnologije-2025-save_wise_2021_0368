<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccountResource;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    // Pregled liste naloga (samo nalozi ulogovanog korisnika)
    public function index(Request $request)
    {
        $accounts = Account::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return AccountResource::collection($accounts);
    }

    // Kreiranje naloga (ulogovani korisnik kreira svoj nalog)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'initial_balance' => ['required', 'numeric', 'min:0'],
            // current_balance ne tražimo od fronta, vec ga postavljamo na initial_balance
            'currency' => ['required', 'in:RSD,EUR'],
        ]);

        $initial = isset($validated['initial_balance']) ? (float) $validated['initial_balance'] : 0;

        $account = Account::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'initial_balance' => $initial,
            'current_balance' => $initial,
            'currency' => $validated['currency'] ?? 'RSD',
        ]);

        //vracamo status kod i kreiran nalog
        return (new AccountResource($account))->response()->setStatusCode(201);
    }
}
