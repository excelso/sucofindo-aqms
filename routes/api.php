<?php

    use App\Http\Controllers\Api\BeSparing\ControllerLogger;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;

    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    Route::prefix('platform')->group(function () {
        Route::prefix('re-engineer')->group(function () {
            Route::post('pull', [ControllerLogger::class, 'handlePullReEngineer']);
        });
    });
