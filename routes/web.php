<?php

    use App\Http\Controllers\ControllerNotification;
    use App\Http\Controllers\Dashboard\ControllerDashboard;
    use App\Http\Controllers\Master\ControllerPlatformLoggers;
    use App\Http\Controllers\Master\ControllerSites;
    use App\Http\Controllers\Master\ControllerUsers;
    use App\Http\Controllers\Reports\ControllerReportLogParameter;
    use App\Http\Controllers\Settings\ControllerChangePassword;
    use App\Http\Controllers\Settings\WebRTCProxyController;
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

        Route::middleware(['auth', 'verified', 'otp.verified'])->group(function () {
            Route::prefix('notifikasi')->group(function () {
                Route::get('data-notif', [ControllerNotification::class, 'getDataNotifikasi']);
            });

            Route::get('/', [ControllerDashboard::class, 'index'])->name('dashboard');
            Route::group(['prefix' => 'dashboard'], function () {
                Route::get('platforms', [ControllerDashboard::class, 'getDataPlatforms']);
                Route::get('detail-metric/{uid}', [ControllerDashboard::class, 'detailMetric']);
                Route::get('webrtc-proxy', [WebRTCProxyController::class, 'proxyGet']);
                Route::get('platform-heartbeat/{uid}', [ControllerDashboard::class, 'handleDetailPlatformHeartbeat']);
            });

            Route::group(['prefix' => 'reports'], function () {
                Route::group(['prefix' => 'logs-parameter'], function () {
                    Route::get('/', [ControllerReportLogParameter::class, 'index']);
                    Route::get('export-excel', [ControllerReportLogParameter::class, 'exportExcel'])->name('logs-parameter.export-excel');
                });
            });

            Route::group(['prefix' => 'master'], function () {
                Route::group(['prefix' => 'sites'], function () {
                    Route::get('/', [ControllerSites::class, 'index']);
                    Route::post('store', [ControllerSites::class, 'store']);
                    Route::get('detail/{siteId}', [ControllerSites::class, 'handleDetailSite']);
                    Route::put('update/{siteId}', [ControllerSites::class, 'update']);
                    Route::delete('delete/{siteId}', [ControllerSites::class, 'delete']);
                    Route::get('data-site', [ControllerSites::class, 'handleDataSite']);
                });

                Route::group(['prefix' => 'platform-loggers'], function () {
                    Route::get('/', [ControllerPlatformLoggers::class, 'index']);
                    Route::post('store', [ControllerPlatformLoggers::class, 'store']);
                    Route::get('detail/{platformId}', [ControllerPlatformLoggers::class, 'handleDetailPlatform']);
                    Route::put('update/{platformId}', [ControllerPlatformLoggers::class, 'update']);
                    Route::delete('delete/{platformId}', [ControllerPlatformLoggers::class, 'delete']);
                });

                Route::group(['prefix' => 'users'], function () {
                    Route::get('/', [ControllerUsers::class, 'index']);
                    Route::get('get-user-sso', [ControllerUsers::class, 'getUserSSO']);
                    Route::post('store', [ControllerUsers::class, 'store']);
                    Route::get('detail/{userId}', [ControllerUsers::class, 'handleDetailUser']);
                    Route::put('update/{userId}', [ControllerUsers::class, 'update']);
                    Route::delete('delete/{userId}', [ControllerUsers::class, 'delete']);
                });
            });

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
