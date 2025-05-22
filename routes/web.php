<?php

    use App\Http\Controllers\Dashboard\ControllerDashboard;
    use App\Http\Controllers\Settings\ControllerChangePassword;
    use App\Http\Helper\ExImage;
    use Illuminate\Support\Facades\Route;
    use Mcamara\LaravelLocalization\Facades\LaravelLocalization;

    //region Experiment
    Route::prefix('experiment')->group(function () {
        Route::prefix('datepicker')->group(function () {
            Route::get('/', function () {
                return view('experiment.datepicker');
            });
        });

        Route::prefix('select-box')->group(function () {
            Route::get('/', function () {
                return view('experiment.select-box');
            });
        });

        Route::prefix('expand-list')->group(function () {
            Route::get('/', function () {
                return view('experiment.expand-list');
            });
        });

        Route::prefix('emp-calendar')->group(function () {
            Route::get('/', function () {
                return view('experiment.employee-calendar');
            });
        });

        Route::prefix('ex-calendar')->group(function () {
            Route::get('/', function () {
                return view('experiment.ex-calendar');
            });
        });
    });
    //endregion

    Route::group([
        'prefix' => LaravelLocalization::setLocale(),
        'middleware' => ['localeSessionRedirect', 'localizationRedirect', 'localeViewPath']
    ], function () {

        Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('/', [ControllerDashboard::class, 'index'])->name('dashboard');

            Route::group(['prefix' => 'settings'], function () {
                //region Change Password
                Route::group(['prefix' => 'change-password'], function () {
                    Route::get('/', [ControllerChangePassword::class, 'index'])->name('settings.change-password');
                    Route::post('update', [ControllerChangePassword::class, 'updatePassword']);
                });
                //endregion
            });
        });

    });

    Route::prefix('recreate-image-url')->group(function () {
        Route::get('user/{id}', [ExImage::class, 'reCreateImageUrl'])->name('re-create-image-url');
        Route::get('company/{id}', [ExImage::class, 'reCreateImageLogoUrl'])->name('re-create-image-logo-url');
    });

    require __DIR__ . '/auth.php';
