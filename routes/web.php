<?php

    use App\Http\Controllers\ControllerNotification;
    use App\Http\Controllers\Dashboard\ControllerDashboard;
    use App\Http\Controllers\Dashboard\PlatformAirQualityController;
    use App\Http\Controllers\HikvisionPTZController;
    use App\Http\Controllers\Master\ControllerPlatformLoggers;
    use App\Http\Controllers\Master\ControllerSites;
    use App\Http\Controllers\Master\ControllerSitesLocation;
    use App\Http\Controllers\Master\ControllerUsers;
    use App\Http\Controllers\OnvifPTZController;
    use App\Http\Controllers\PTZController;
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
                Route::get('platforms', [PlatformAirQualityController::class, 'getPlatformsList']);
                Route::get('platform/{uid}/data', [PlatformAirQualityController::class, 'getPlatformData']);

                // Route::get('platforms', [ControllerDashboard::class, 'getDataPlatforms']);
                Route::get('detail-metric/{uid}', [ControllerDashboard::class, 'detailMetric']);
                Route::get('webrtc-proxy', [WebRTCProxyController::class, 'proxyGet']);
                Route::get('platform-heartbeat/{uid}', [ControllerDashboard::class, 'handleDetailPlatformHeartbeat']);
                Route::get('platform-report/{uid}', [ControllerDashboard::class, 'handleDetailPlatformReport']);
                Route::get('export-excel-heartbeat/{uid}', [ControllerDashboard::class, 'handleExportHeartbeat']);
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

                Route::group(['prefix' => 'sites-location'], function () {
                    Route::get('/', [ControllerSitesLocation::class, 'index']);
                    Route::post('store', [ControllerSitesLocation::class, 'store']);
                    Route::get('detail/{locationId}', [ControllerSitesLocation::class, 'handleDetailLocation']);
                    Route::put('update/{locationId}', [ControllerSitesLocation::class, 'update']);
                    Route::delete('delete/{locationId}', [ControllerSitesLocation::class, 'delete']);
                    Route::get('data-location', [ControllerSitesLocation::class, 'handleDataLocation']);
                });

                Route::group(['prefix' => 'platform-loggers'], function () {
                    Route::get('/', [ControllerPlatformLoggers::class, 'index'])->name('master.platform-loggers');
                    Route::post('store', [ControllerPlatformLoggers::class, 'store']);
                    Route::get('detail/{platformId}', [ControllerPlatformLoggers::class, 'handleDetailPlatform']);
                    Route::put('update/{platformId}', [ControllerPlatformLoggers::class, 'update']);
                    Route::delete('delete/{platformId}', [ControllerPlatformLoggers::class, 'delete']);

                    Route::group(['prefix' => 'calibration/{platformId}'], function () {
                        Route::get('/', [ControllerPlatformLoggers::class, 'calibration']);
                        Route::get('calibration-init', [ControllerPlatformLoggers::class, 'calibrationInit']);
                    });
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

            Route::prefix('onvif')->group(function () {
                // Main PTZ control endpoint
                Route::post('/onvif-ptz/control', [OnvifPTZController::class, 'control'])
                    ->name('onvif.ptz.control');

                // Camera status endpoints
                Route::get('/onvif-ptz/camera/{cameraId}/status', [OnvifPTZController::class, 'getStatus'])
                    ->name('onvif.ptz.status');

                Route::get('/onvif-ptz/camera/{cameraId}/test-connection', [OnvifPTZController::class, 'testConnection'])
                    ->name('onvif.ptz.test');

                // Absolute movement endpoints
                Route::post('/onvif-ptz/camera/{cameraId}/move/absolute', [OnvifPTZController::class, 'absoluteMove'])
                    ->name('onvif.ptz.absolute');

                Route::post('/onvif-ptz/camera/{cameraId}/move/degrees', [OnvifPTZController::class, 'moveToDegrees'])
                    ->name('onvif.ptz.degrees');

                // Preset endpoints
                Route::post('/onvif-ptz/camera/{cameraId}/preset/{presetToken}/goto', [OnvifPTZController::class, 'gotoPreset'])
                    ->name('onvif.ptz.preset.goto');

                Route::put('/onvif-ptz/camera/{cameraId}/preset/{presetToken}', [OnvifPTZController::class, 'setPreset'])
                    ->name('onvif.ptz.preset.set');

                Route::delete('/onvif-ptz/camera/{cameraId}/preset/{presetToken}', [OnvifPTZController::class, 'removePreset'])
                    ->name('onvif.ptz.preset.remove');

                Route::get('/onvif-ptz/camera/{cameraId}/presets', [OnvifPTZController::class, 'getPresets'])
                    ->name('onvif.ptz.presets');

                // Utility endpoints
                Route::get('/onvif-ptz/camera/{cameraId}/capabilities', [OnvifPTZController::class, 'getCapabilities'])
                    ->name('onvif.ptz.capabilities');

                Route::post('/onvif-ptz/camera/{cameraId}/debug', [OnvifPTZController::class, 'debugCommand'])
                    ->name('onvif.ptz.debug');
            });

        });

    });

    Route::prefix('recreate-image-url')->group(function () {
        Route::get('user/{id}', [ExImage::class, 'reCreateImageUrl'])->name('re-create-image-url');
        Route::get('company/{id}', [ExImage::class, 'reCreateImageLogoUrl'])->name('re-create-image-logo-url');
    });

    require __DIR__ . '/auth.php';
