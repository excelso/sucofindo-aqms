<?php

    use App\Http\Controllers\Auth\AuthenticatedSessionController;
    use App\Http\Controllers\BeAqms\ControllerNotification;
    use App\Http\Controllers\BeAqms\Dashboard\ControllerDashboard;
    use App\Http\Controllers\BeAqms\Dashboard\PlatformAirQualityController;
    use App\Http\Controllers\BeAqms\Master\ControllerPlatformLoggers;
    use App\Http\Controllers\BeAqms\Master\ControllerSites;
    use App\Http\Controllers\BeAqms\Master\ControllerSitesLocation;
    use App\Http\Controllers\BeAqms\Master\ControllerUsers;
    use App\Http\Controllers\BeAqms\Reports\ControllerReportLogParameter;
    use App\Http\Controllers\BeEnviro\BeEnviroControllerDashboard;
    use App\Http\Controllers\BeSparing\BeSparingControllerNotifikasi;
    use App\Http\Controllers\BeSparing\Dashboard\BeSparingControllerHasilPengukuran;
    use App\Http\Controllers\BeSparing\Dashboard\BeSparingControllerMaps;
    use App\Http\Controllers\BeSparing\Dashboard\BeSparingControllerSummary;
    use App\Http\Controllers\BeSparing\Master\BeSparingControllerCustomer;
    use App\Http\Controllers\BeSparing\Master\BeSparingControllerCustomerLokasi;
    use App\Http\Controllers\BeSparing\Master\BeSparingControllerLogger;
    use App\Http\Controllers\BeSparing\Master\BeSparingControllerPlatform;
    use App\Http\Controllers\BeSparing\Master\BeSparingControllerSite;
    use App\Http\Controllers\BeSparing\Reports\BeSparingControllerLogsParameter;
    use App\Http\Controllers\BeSparing\Reports\BeSparingControllerWaterQuality;
    use App\Http\Controllers\BeSparing\Reports\BeSparingControllerWeeklyReport;
    use App\Http\Controllers\OnvifPTZController;
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

    Route::redirect('/', '/login')->name('home');
    // Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('landing-page');

    Route::middleware(['auth', 'verified', 'otp.verified'])->group(function () {
        Route::group([
            'prefix' => LaravelLocalization::setLocale(),
            'middleware' => ['localeSessionRedirect', 'localizationRedirect', 'localeViewPath']
        ], function () {

            Route::prefix('enviro')->group(function () {
                Route::get('/', [BeEnviroControllerDashboard::class, 'index'])->name('enviro.dashboard');
            });

            //region Sparing Routing
            Route::prefix('sparing')->group(function () {
                Route::get('/', [BeSparingControllerMaps::class, 'index'])->name('sparing.dashboard');
                Route::prefix('dashboard')->group(function () {
                    Route::prefix('hasil-pengukuran')->group(function () {
                        Route::get('/', [BeSparingControllerHasilPengukuran::class, 'index'])->name('sparing.dashboard.hasil-pengukuran');
                        Route::get('data-info-platform', [BeSparingControllerHasilPengukuran::class, 'handleInfoPlatform']);
                        Route::get('data-platforms', [BeSparingControllerHasilPengukuran::class, 'handleDataPlatforms']);
                        Route::post('data-charts', [BeSparingControllerHasilPengukuran::class, 'getPeriodicParameterChart']);
                        Route::post('data-charts-last-param', [BeSparingControllerHasilPengukuran::class, 'getLastPeriodicParameterChart']);
                        Route::get('data-detail-platform', [BeSparingControllerHasilPengukuran::class, 'handleDetailPlatform']);
                        Route::get('data-lost-platform', [BeSparingControllerHasilPengukuran::class, 'handleLostPlatform']);
                    });

                    Route::prefix('maps')->group(function () {
                        Route::get('/', [BeSparingControllerMaps::class, 'index'])->name('sparing.dashboard.maps');
                        Route::post('data-platform', [BeSparingControllerMaps::class, 'handleDataPlatform']);
                        Route::post('data-platform-marker', [BeSparingControllerMaps::class, 'handleDataPlatformMarker']);

                        Route::prefix('summary')->group(function () {
                            Route::get('detail/{uid}/{tipeLogger}', [BeSparingControllerSummary::class, 'index']);
                            Route::post('data-platform', [BeSparingControllerSummary::class, 'handleDataPlatform']);
                            Route::post('data-last-parameter', [BeSparingControllerSummary::class, 'handleDataLastParameter']);
                            Route::post('data-persentase', [BeSparingControllerSummary::class, 'handleDataPersentase']);
                            Route::post('data-charts', [BeSparingControllerSummary::class, 'handleDataCharts']);
                            Route::post('data-charts-last-param', [BeSparingControllerSummary::class, 'handleDataChartsLastParam']);
                            Route::post('data-power-status', [BeSparingControllerSummary::class, 'handleDataChartPower']);
                            Route::post('data-power-status-charts', [BeSparingControllerSummary::class, 'handleDataChartPowerStatus']);
                            Route::get('data-table', [BeSparingControllerSummary::class, 'handleDataTable']);
                            Route::post('data-dokumen', [BeSparingControllerSummary::class, 'handleDataDokumen']);
                        });
                    });
                });

                Route::prefix('reports')->group(function () {
                    Route::prefix('logs-parameter')->group(function () {
                        Route::get('/', [BeSparingControllerLogsParameter::class, 'index'])->name('sparing.reports.logs-parameter');
                        Route::get('export-excel', [BeSparingControllerLogsParameter::class, 'handleExportExcel'])->name('sparing.reports.logs-parameter.export-excel');
                    });

                    Route::prefix('water-quality')->group(function () {
                        Route::get('/', [BeSparingControllerWaterQuality::class, 'index'])->name('sparing.reports.water-quality');
                        Route::post('data-charts', [BeSparingControllerWaterQuality::class, 'handleDataCharts']);
                        Route::post('data-persentase', [BeSparingControllerWaterQuality::class, 'handleDataPersentase']);
                        Route::get('data-table', [BeSparingControllerWaterQuality::class, 'handleDataTable']);
                        Route::get('export-excel', [BeSparingControllerWaterQuality::class, 'handleExportExcel'])->name('sparing.reports.water-quality.export-excel');
                    });

                    Route::prefix('weekly-report')->group(function () {
                        Route::get('/', [BeSparingControllerWeeklyReport::class, 'index'])->name('sparing.reports.weekly-report');
                        Route::post('data-avg-parameter', [BeSparingControllerWeeklyReport::class, 'handleDataAvgParameterWeekly']);
                        Route::post('data-entry-charts', [BeSparingControllerWeeklyReport::class, 'handleDataEntryCharts']);
                        Route::post('data-comply-charts', [BeSparingControllerWeeklyReport::class, 'handleDataComplyCharts']);
                        Route::post('data-sensor-charts', [BeSparingControllerWeeklyReport::class, 'handleDataSensorCharts']);
                    });
                });

                Route::prefix('master')->group(function () {
                    Route::prefix('customer')->group(function () {
                        Route::post('data-customer-by-id', [BeSparingControllerCustomer::class, 'handleCustomerById']);
                    });

                    Route::prefix('lokasi')->group(function () {
                        Route::get('/', [BeSparingControllerCustomerLokasi::class, 'index'])->name('sparing.master.lokasi');
                        Route::post('store', [BeSparingControllerCustomerLokasi::class, 'store']);
                        Route::post('update', [BeSparingControllerCustomerLokasi::class, 'update']);
                        Route::delete('delete', [BeSparingControllerCustomerLokasi::class, 'delete']);
                        Route::get('data-lokasi-by-customer', [BeSparingControllerCustomerLokasi::class, 'handleLokasiByCustomer']);
                    });

                    Route::prefix('site')->group(function () {
                        Route::get('/', [BeSparingControllerSite::class, 'index'])->name('sparing.master.site');
                        Route::post('store', [BeSparingControllerSite::class, 'store']);
                        Route::post('update', [BeSparingControllerSite::class, 'update']);
                        Route::delete('delete', [BeSparingControllerSite::class, 'delete']);
                        Route::get('data-site-by-customer-lokasi', [BeSparingControllerSite::class, 'handleSiteByCustomerLokasi']);
                    });

                    Route::prefix('logger')->group(function () {
                        Route::get('/', [BeSparingControllerLogger::class, 'index'])->name('sparing.master.logger');
                        Route::post('store', [BeSparingControllerLogger::class, 'store']);
                        Route::post('update', [BeSparingControllerLogger::class, 'update']);
                        Route::delete('delete', [BeSparingControllerLogger::class, 'delete']);
                    });

                    Route::prefix('platform')->group(function () {
                        Route::get('data-platform-by-industri', [BeSparingControllerPlatform::class, 'handlePlatformParamByIndustri']);
                    });

                    Route::group(['prefix' => 'users'], function () {
                        Route::get('/', [ControllerUsers::class, 'index'])->name('sparing.master.users');
                        Route::get('get-user-sso', [ControllerUsers::class, 'getUserSSO']);
                        Route::post('store', [ControllerUsers::class, 'store']);
                        Route::get('detail/{userId}', [ControllerUsers::class, 'handleDetailUser']);
                        Route::put('update/{userId}', [ControllerUsers::class, 'update']);
                        Route::delete('delete/{userId}', [ControllerUsers::class, 'delete']);
                    });
                });

                Route::prefix('notifikasi')->group(function () {
                    Route::get('data-notif', [BeSparingControllerNotifikasi::class, 'getDataNotifikasi']);
                    Route::get('count-data-notif', [BeSparingControllerNotifikasi::class, 'getCountNotifikasi']);
                    Route::get('mark-all-read', [BeSparingControllerNotifikasi::class, 'markAllReadNotifikasi']);
                    Route::post('read-notif', [BeSparingControllerNotifikasi::class, 'readNotifikasi']);
                    Route::prefix('firebase')->group(function () {
                        Route::post('save-token', [BeSparingControllerNotifikasi::class, 'saveFirebaseRegToken']);
                    });
                });

                Route::group(['prefix' => 'settings'], function () {
                    Route::group(['prefix' => 'change-password'], function () {
                        Route::get('/', [ControllerChangePassword::class, 'index'])->name('sparing.settings.change-password');
                        Route::post('update', [ControllerChangePassword::class, 'updatePassword']);
                    });
                });
            });
            //endregion

            //region AQMS Routing
            Route::prefix('aqms')->group(function () {
                Route::prefix('notifikasi')->group(function () {
                    Route::get('data-notif', [ControllerNotification::class, 'getDataNotifikasi']);
                    Route::get('count-data-notif', [ControllerNotification::class, 'getCountNotifikasi']);
                });

                Route::get('/', [ControllerDashboard::class, 'index'])->name('aqms.dashboard');
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
                        Route::get('/', [ControllerReportLogParameter::class, 'index'])->name('reports.logs-parameter');
                        Route::get('export-excel', [ControllerReportLogParameter::class, 'exportExcel'])->name('logs-parameter.export-excel');
                    });
                });

                Route::group(['prefix' => 'master'], function () {
                    Route::group(['prefix' => 'sites'], function () {
                        Route::get('/', [ControllerSites::class, 'index'])->name('master.sites');
                        Route::post('store', [ControllerSites::class, 'store']);
                        Route::get('detail/{siteId}', [ControllerSites::class, 'handleDetailSite']);
                        Route::put('update/{siteId}', [ControllerSites::class, 'update']);
                        Route::delete('delete/{siteId}', [ControllerSites::class, 'delete']);
                        Route::get('data-site', [ControllerSites::class, 'handleDataSite']);
                    });

                    Route::group(['prefix' => 'sites-location'], function () {
                        Route::get('/', [ControllerSitesLocation::class, 'index'])->name('master.sites-location');
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
                            Route::get('/', [ControllerPlatformLoggers::class, 'calibration'])->name('master.platform-loggers.calibration');
                            Route::get('calibration-init', [ControllerPlatformLoggers::class, 'calibrationInit']);
                        });
                    });

                    Route::group(['prefix' => 'users'], function () {
                        Route::get('/', [ControllerUsers::class, 'index'])->name('master.users');
                        Route::get('get-user-sso', [ControllerUsers::class, 'getUserSSO']);
                        Route::post('store', [ControllerUsers::class, 'store']);
                        Route::get('detail/{userId}', [ControllerUsers::class, 'handleDetailUser']);
                        Route::put('update/{userId}', [ControllerUsers::class, 'update']);
                        Route::delete('delete/{userId}', [ControllerUsers::class, 'delete']);
                    });
                });

                Route::group(['prefix' => 'settings'], function () {
                    Route::group(['prefix' => 'change-password'], function () {
                        Route::get('/', [ControllerChangePassword::class, 'index'])->name('settings.change-password');
                        Route::post('update', [ControllerChangePassword::class, 'updatePassword']);
                    });
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
            //endregion

        });

    });

    Route::prefix('recreate-image-url')->group(function () {
        Route::get('user/{id}', [ExImage::class, 'reCreateImageUrl'])->name('re-create-image-url');
        Route::get('company/{id}', [ExImage::class, 'reCreateImageLogoUrl'])->name('re-create-image-logo-url');
    });

    require __DIR__ . '/auth.php';
