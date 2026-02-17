<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class FxRatesController extends Controller
{
    // GET /api/fx/kurs/{currency}  npr. eur
    public function today(string $currency)
    {
        $currency = strtolower($currency);

        if (!in_array($currency, ['eur'])) {
            return response()->json(['message' => 'Unsupported currency.'], 422);
        }

        $cacheKey = "kurs_api:{$currency}:today";

        $data = Cache::remember($cacheKey, 60 * 60, function () use ($currency) {
            $url = "https://kurs.resenje.org/api/v1/currencies/{$currency}/rates/today";
            $res = Http::timeout(10)->get($url);

            if (!$res->ok()) {
                abort(502, 'FX provider unavailable.');
            }

            $json = $res->json();

            // Kurs API vraća exchange_middle + parity (ne vraća "middle")
            $exchangeMiddle = isset($json['exchange_middle']) ? (float) $json['exchange_middle'] : null;
            $parity = isset($json['parity']) ? (float) $json['parity'] : 1.0;

            if (!$exchangeMiddle || $parity <= 0) {
                abort(502, 'FX provider returned invalid data.');
            }

            // želimo: "middle" kao RSD za 1 EUR (ako parity nije 1)
            $middle = $exchangeMiddle / $parity;

            return [
                'provider' => 'kurs.resenje.org',
                'base' => 'RSD',
                'currency' => strtoupper($currency),
                'date' => $json['date'] ?? null,
                'date_from' => $json['date_from'] ?? null,
                'middle' => $middle, 
            ];
        });

        return response()->json($data);
    }
}
