<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\TransactionController;

use App\Http\Controllers\AdminMetricsController;
use App\Http\Controllers\FxRatesController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::get('/admin/metrics', [AdminMetricsController::class, 'index']);

    Route::get('/accounts', [AccountController::class, 'index']);   
    Route::post('/accounts', [AccountController::class, 'store']);

    Route::get('/budgets', [BudgetController::class, 'index']);        
    Route::post('/budgets', [BudgetController::class, 'store']);       
    Route::put('/budgets/{budget}', [BudgetController::class, 'update']); 
    Route::delete('/budgets/{budget}', [BudgetController::class, 'destroy']); 

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);

    Route::get('/fx/kurs/{currency}', [FxRatesController::class, 'today']);

    Route::post('/logout', [AuthController::class, 'logout']);
});
