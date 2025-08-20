<?php

    use App\Http\Controllers\ControllerNotification;
    use App\Http\Controllers\Dashboard\ControllerDashboard;
    use App\Http\Controllers\HikvisionPTZController;
    use App\Http\Controllers\Master\ControllerPlatformLoggers;
    use App\Http\Controllers\Master\ControllerSites;
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

            Route::prefix('hikvision-ptz')->group(function () {

                // Main PTZ control endpoint
                Route::post('control', [HikvisionPTZController::class, 'control']);

                // Camera capabilities
                Route::get('camera/{camera_id}/capabilities', [HikvisionPTZController::class, 'getCapabilities']);

                // Current PTZ status
                Route::get('camera/{camera_id}/status', [HikvisionPTZController::class, 'getStatus']);

                // Preset management
                Route::prefix('camera/{camera_id}/preset')->group(function () {
                    // Go to preset
                    Route::post('{preset_number}/goto', [HikvisionPTZController::class, 'gotoPreset'])
                        ->name('api.hikvision.ptz.goto_preset');

                    // Set preset
                    Route::put('{preset_number}', [HikvisionPTZController::class, 'setPreset'])
                        ->name('api.hikvision.ptz.set_preset');

                    // Delete preset
                    Route::delete('{preset_number}', [HikvisionPTZController::class, 'deletePreset'])
                        ->name('api.hikvision.ptz.delete_preset');

                    // List all presets
                    Route::get('list', [HikvisionPTZController::class, 'listPresets'])
                        ->name('api.hikvision.ptz.list_presets');
                });

                // Movement controls
                Route::prefix('camera/{camera_id}/move')->group(function () {
                    // Continuous movement
                    Route::post('continuous', [HikvisionPTZController::class, 'continuousMove'])
                        ->name('api.hikvision.ptz.continuous');

                    // Relative movement
                    Route::post('relative', [HikvisionPTZController::class, 'relativeMove'])
                        ->name('api.hikvision.ptz.relative');

                    // Absolute movement (enhanced)
                    Route::post('absolute', [HikvisionPTZController::class, 'absoluteMove'])
                        ->name('api.hikvision.ptz.absolute');

                    // Move to predefined position
                    Route::post('position/{position}', [HikvisionPTZController::class, 'moveToPosition'])
                        ->name('api.hikvision.ptz.move_to_position');

                    // Move using degrees (user-friendly)
                    Route::post('degrees', [HikvisionPTZController::class, 'moveToDegrees'])
                        ->name('api.hikvision.ptz.move_degrees');

                    // Batch absolute movements
                    Route::post('batch', [HikvisionPTZController::class, 'batchAbsoluteMove'])
                        ->name('api.hikvision.ptz.batch_move');

                    // Stop movement
                    Route::post('stop', [HikvisionPTZController::class, 'stopMovement'])
                        ->name('api.hikvision.ptz.stop');
                });

                // Get available positions
                Route::get('positions', [HikvisionPTZController::class, 'getAvailablePositions'])
                    ->name('api.hikvision.ptz.available_positions');

                // Zoom controls
                Route::prefix('camera/{camera_id}/zoom')->group(function () {
                    Route::post('in', [HikvisionPTZController::class, 'zoomIn'])
                        ->name('api.hikvision.ptz.zoom_in');

                    Route::post('out', [HikvisionPTZController::class, 'zoomOut'])
                        ->name('api.hikvision.ptz.zoom_out');

                    Route::post('stop', [HikvisionPTZController::class, 'stopZoom'])
                        ->name('api.hikvision.ptz.zoom_stop');
                });

                // Advanced features
                Route::prefix('camera/{camera_id}')->group(function () {
                    // Home position
                    Route::post('home', [HikvisionPTZController::class, 'goHome'])
                        ->name('api.hikvision.ptz.home');

                    // Auto focus
                    Route::post('focus/auto', [HikvisionPTZController::class, 'autoFocus'])
                        ->name('api.hikvision.ptz.auto_focus');

                    // Manual focus
                    Route::post('focus/manual', [HikvisionPTZController::class, 'manualFocus'])
                        ->name('api.hikvision.ptz.manual_focus');

                    // Iris control
                    Route::post('iris/{action}', [HikvisionPTZController::class, 'irisControl'])
                        ->where('action', 'open|close|auto')
                        ->name('api.hikvision.ptz.iris');

                    // Pattern recording and playback
                    Route::post('pattern/{pattern_id}/record', [HikvisionPTZController::class, 'recordPattern'])
                        ->name('api.hikvision.ptz.record_pattern');

                    Route::post('pattern/{pattern_id}/play', [HikvisionPTZController::class, 'playPattern'])
                        ->name('api.hikvision.ptz.play_pattern');

                    Route::post('pattern/{pattern_id}/stop', [HikvisionPTZController::class, 'stopPattern'])
                        ->name('api.hikvision.ptz.stop_pattern');

                    // Tour/Patrol
                    Route::post('tour/{tour_id}/start', [HikvisionPTZController::class, 'startTour'])
                        ->name('api.hikvision.ptz.start_tour');

                    Route::post('tour/stop', [HikvisionPTZController::class, 'stopTour'])
                        ->name('api.hikvision.ptz.stop_tour');
                });

                // Bulk operations
                Route::prefix('bulk')->group(function () {
                    // Control multiple cameras
                    Route::post('control', [HikvisionPTZController::class, 'bulkControl'])
                        ->name('api.hikvision.ptz.bulk_control');

                    // Get status of multiple cameras
                    Route::post('status', [HikvisionPTZController::class, 'bulkStatus'])
                        ->name('api.hikvision.ptz.bulk_status');

                    // Sync preset across cameras
                    Route::post('sync-preset', [HikvisionPTZController::class, 'syncPreset'])
                        ->name('api.hikvision.ptz.sync_preset');
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

    });

    Route::prefix('recreate-image-url')->group(function () {
        Route::get('user/{id}', [ExImage::class, 'reCreateImageUrl'])->name('re-create-image-url');
        Route::get('company/{id}', [ExImage::class, 'reCreateImageLogoUrl'])->name('re-create-image-logo-url');
    });

    require __DIR__ . '/auth.php';
