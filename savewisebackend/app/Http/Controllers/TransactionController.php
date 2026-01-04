<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    // listTransactions: lista transakcija + filteri + sortiranje + paginacija
   public function index(Request $request)
    {
        $validated = $request->validate([
            'type' => ['nullable', Rule::in(['income', 'expense'])],

            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'category_name' => ['nullable', 'string', 'max:120'],

            // filtriranje po amount opsegu
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'max_amount' => ['nullable', 'numeric', 'min:0'],

            // sortiranje po datumu: newest / oldest
            'date_sort' => ['nullable', Rule::in(['newest', 'oldest'])],

            // paginacija
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $userId = $request->user()->id;

        $query = Transaction::query()->where('user_id', $userId);

        if (!empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        } elseif (!empty($validated['category_name'])) {
            $query->whereHas('category', function ($q) use ($validated) {
                $q->where('name', $validated['category_name']);
            });
        }

        if (isset($validated['min_amount'])) {
            $query->where('amount', '>=', $validated['min_amount']);
        }

        if (isset($validated['max_amount'])) {
            $query->where('amount', '<=', $validated['max_amount']);
        }

        $dateSort = $validated['date_sort'] ?? 'newest';
        $query->orderBy('date', $dateSort === 'newest' ? 'desc' : 'asc');

        //ako korisnik sam ne stavi koji je per page, 10 je default
        $perPage = $validated['per_page'] ?? 10;

        $transactions = $query->paginate($perPage)->withQueryString();

        return TransactionResource::collection($transactions);
    }

    // createTransaction: kreiranje transakcije + update current_balance (bez minusa)
     public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(['income', 'expense'])],
        ]);

        $userId = $request->user()->id;

        return DB::transaction(function () use ($validated, $userId) {

            $account = Account::where('id', $validated['account_id'])
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if (!$account) {
                abort(403, 'Forbidden.');
            }

            // kategorija samo mora postojati (sistemska je)
            Category::where('id', $validated['category_id'])->firstOrFail();

            $amount = (float) $validated['amount'];

            $newBalance = $account->current_balance;
            if ($validated['type'] === 'income') {
                $newBalance = (float) $account->current_balance + $amount;
            } else {
                $newBalance = (float) $account->current_balance - $amount;

                if ($newBalance < 0) {
                    return response()->json([
                        'message' => 'Insufficient funds. Transaction would make account balance negative.',
                    ], 422);
                }
            }

            $transaction = Transaction::create([
                'user_id' => $userId,
                'account_id' => $account->id,
                'category_id' => $validated['category_id'],
                'amount' => $amount,
                'date' => $validated['date'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
            ]);

            $account->update(['current_balance' => $newBalance]);

            return (new TransactionResource($transaction))->response()->setStatusCode(201);
        });
    }


    // updateTransaction: izmena transakcije + korekcija current_balance (bez minusa)
   public function update(Request $request, Transaction $transaction)
    {
        $userId = $request->user()->id;

        if ($transaction->user_id !== $userId) {
            abort(403, 'Forbidden.');
        }

        $validated = $request->validate([
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'amount' => ['sometimes', 'numeric', 'gt:0'],
            'date' => ['sometimes', 'date'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'type' => ['sometimes', Rule::in(['income', 'expense'])],
        ]);

        return DB::transaction(function () use ($transaction, $validated, $userId) {

            // lock account koji je vezan za transakciju (account_id se ne menja)
            $account = Account::where('id', $transaction->account_id)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if (!$account) {
                abort(403, 'Forbidden.');
            }

            // stari podaci
            $oldType = $transaction->type;
            $oldAmount = (float) $transaction->amount;

            // novi podaci (fallback na stare)
            $newType = $validated['type'] ?? $oldType;
            $newAmount = isset($validated['amount']) ? (float) $validated['amount'] : $oldAmount;

            // poništi efekat stare transakcije na balans
            $balance = (float) $account->current_balance;

            if ($oldType === 'income') {
                $balance -= $oldAmount;
            } else {
                $balance += $oldAmount;
            }

            // primeni novu transakciju na balans
            if ($newType === 'income') {
                $balance += $newAmount;
            } else {
                $balance -= $newAmount;
                if ($balance < 0) {
                    return response()->json([
                        'message' => 'Insufficient funds. Update would make account balance negative.',
                    ], 422);
                }
            }

            //snimi balans i update transakcije
            $account->update(['current_balance' => $balance]);

            $transaction->update($validated);

            return new TransactionResource($transaction);
        });
    }

 // deleteTransaction: brisanje transakcije + vraćanje current_balance
    public function destroy(Request $request, Transaction $transaction)
    {
        $userId = $request->user()->id;

        if ($transaction->user_id !== $userId) {
            abort(403, 'Forbidden.');
        }

        return DB::transaction(function () use ($transaction, $userId) {

            $account = Account::where('id', $transaction->account_id)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

                //ako nema taj account ili hoce tudji da azurira
            if (!$account) {
                abort(403, 'Forbidden.');
            }

            $amount = (float) $transaction->amount;

            // poništi efekat transakcije
            $balance = (float) $account->current_balance;
            if ($transaction->type === 'income') {
                $balance -= $amount;
            } else {
                $balance += $amount;
            }

            // u slucaju kada bismo obrisali tu transakciju, a balans je u minusu, ne radimo brisanje
            if ($balance < 0) {
                return response()->json([
                    'message' => 'Cannot delete. Account balance would become negative (data inconsistency).',
                ], 409);
            }

            $account->update(['current_balance' => $balance]);
            $transaction->delete();

            return response()->json(['message' => 'Transaction deleted.']);
        });
    }
   
}
