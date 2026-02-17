<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminMetricsController extends Controller
{
    public function index(Request $request)
{
    // admin check (po tvojoj migraciji ima user_type)
    $me = $request->user();
    if (!$me || ($me->user_type ?? null) !== 'admin') {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    // hardcoded godina - bez filtera
    $year = 2026;
    $start = Carbon::create($year, 1, 1, 0, 0, 0);
    $end   = Carbon::create($year + 1, 1, 1, 0, 0, 0);

    // ako neke tabele ne postoje, vrati “prazno” umesto 500
    if (!Schema::hasTable('users') || !Schema::hasTable('transactions')) {
        return response()->json([
            'year' => $year,
            'cards' => ['users' => 0, 'transactions' => 0, 'net' => 0],
            'charts' => [
                'pie_type' => [['Type', 'Amount'], ['Income', 0], ['Expense', 0]],
                'bar_expenses_by_month' => [['Month', 'Expense'],
                    ['Jan',0],['Feb',0],['Mar',0],['Apr',0],['May',0],['Jun',0],
                    ['Jul',0],['Aug',0],['Sep',0],['Oct',0],['Nov',0],['Dec',0],
                ],
            ],
            'top_categories' => [],
        ]);
    }

    // 3 kartice
    $usersCount = DB::table('users')->count();

    $txBase = DB::table('transactions')->whereBetween('date', [$start, $end]);
    $transactionsCount = (clone $txBase)->count();

    $incomeTotal  = (float) (clone $txBase)->where('type', 'income')->sum('amount');
    $expenseTotal = (float) (clone $txBase)->where('type', 'expense')->sum('amount');
    $net = round($incomeTotal - $expenseTotal, 2);

    // PIE: income vs expense
    $pie = [
        ['Type', 'Amount'],
        ['Income', round($incomeTotal, 2)],
        ['Expense', round($expenseTotal, 2)],
    ];

    // BAR: expenses by month (računamo u PHP, bez SQL funkcija)
    $labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    $byMonth = array_fill(1, 12, 0.0);

    $expenseTx = DB::table('transactions')
        ->whereBetween('date', [$start, $end])
        ->where('type', 'expense')
        ->get(['amount', 'date']);

    foreach ($expenseTx as $t) {
        $m = Carbon::parse($t->date)->month; // 1..12
        $byMonth[$m] += (float) $t->amount;
    }

    $bar = [['Month', 'Expense']];
    foreach ($labels as $i => $label) {
        $bar[] = [$label, round($byMonth[$i + 1], 2)];
    }

    // BONUS (nije chart): top 5 kategorija po expense (ako postoji categories)
    $topCategories = [];
    if (Schema::hasTable('categories') && Schema::hasColumn('transactions', 'category_id')) {
        $catMap = DB::table('categories')->pluck('name', 'id'); // id => name

        $sumByCat = [];
        $expenseTx2 = DB::table('transactions')
            ->whereBetween('date', [$start, $end])
            ->where('type', 'expense')
            ->get(['amount', 'category_id']);

        foreach ($expenseTx2 as $t) {
            $cid = (int) $t->category_id;
            $sumByCat[$cid] = ($sumByCat[$cid] ?? 0) + (float) $t->amount;
        }

        arsort($sumByCat);

        foreach (array_slice($sumByCat, 0, 5, true) as $cid => $sum) {
            $topCategories[] = [
                'category' => $catMap[$cid] ?? ("Category #".$cid),
                'expense' => round($sum, 2),
            ];
        }
    }

    return response()->json([
        'year' => $year,
        'cards' => [
            'users' => $usersCount,
            'transactions' => $transactionsCount,
            'net' => $net,
        ],
        'charts' => [
            'pie_type' => $pie,
            'bar_expenses_by_month' => $bar,
        ],
        'top_categories' => $topCategories,
    ]);
}

}
