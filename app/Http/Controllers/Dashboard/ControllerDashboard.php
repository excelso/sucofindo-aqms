<?php

    namespace App\Http\Controllers\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\ProfileUpdateRequest;
    use App\Models\Master\AqiCategories;
    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use App\Models\Master\PlatformsHeartbeat;
    use Cache;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Pagination\LengthAwarePaginator;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\Log;
    use Illuminate\Support\Facades\Redirect;
    use Illuminate\View\View;
    use InvalidArgumentException;
    use OutOfRangeException;

    class ControllerDashboard extends Controller {

        protected string $viewPath;
        public function __construct() {
            $this->viewPath = 'main.dashboard';
        }

        public function index(Request $request): View {
            $env = config('app.env');
            return view($this->viewPath . '.index', [
                'env' => $env
            ]);
        }

        //region Handle Data Platforms
        public function getDataPlatforms(Request $request) {
            try {

                $platforms = Platforms::orderBy('created_at', 'ASC')->get();
                $dataPlatformsTemp = [];
                foreach ($platforms as $platform) {
                    $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');
                    if ($request->input('startDate')) {
                        $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                        $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                    }

                    $dataLastLogger = Loggers::loggerData5Minutes($platform->uid, $minDate, $maxDate, $platform->timezone)
                        ->orderBy('datetime_unix', 'DESC')
                        ->with('limit')->first();

                    $aqiCat = null;
                    $status = 'Unknown';
                    $emoji = mb_convert_encoding('&#x2753;', 'UTF-8', 'HTML-ENTITIES');
                    $colorCode = 'bg-gray-200';

                    if ($dataLastLogger && $dataLastLogger->pm_25 !== null) {
                        $aqiCat = AqiCategories::dataAqiPm25($dataLastLogger->pm_25)->first();
                        if (!$aqiCat) {
                            $aqiCat = AqiCategories::orderBy('pm25_max', 'desc')->first();
                        }

                        if ($aqiCat) {
                            $status = $aqiCat->category_name_en;
                            $emoji = mb_convert_encoding($aqiCat->emoji, 'UTF-8', 'HTML-ENTITIES');
                            $colorCode = $aqiCat->color_code;
                        }
                    }

                    $dataPlatformsTemp[] = [
                        'uid' => $platform->uid,
                        'siteName' => $platform->sites->site_name,
                        'status' => $status,
                        'emoji' => $emoji,
                        'colorCode' => $colorCode,
                        'metrics' => [
                            'pm10' => [
                                'value' => $dataLastLogger->pm_10 ?? 0,
                                'bml_min' => $dataLastLogger->limit->pm10_min ?? 0,
                                'bml_min_buffer' => $dataLastLogger->limit->pm10_min_buffer ?? 0,
                                'bml_max_buffer' => $dataLastLogger->limit->pm10_max_buffer ?? 0,
                                'bml_max' => $dataLastLogger->limit->pm10_max ?? 0,
                            ],
                            'pm25' => [
                                'value' => $dataLastLogger->pm_25 ?? 0,
                                'bml_min' => $dataLastLogger->limit->pm25_min ?? 0,
                                'bml_min_buffer' => $dataLastLogger->limit->pm25_min_buffer ?? 0,
                                'bml_max_buffer' => $dataLastLogger->limit->pm25_max_buffer ?? 0,
                                'bml_max' => $dataLastLogger->limit->pm25_max ?? 0,
                            ],
                            'tsp' => [
                                'value' => $dataLastLogger->tsp ?? 0,
                                'bml_min' => $dataLastLogger->limit->tsp_min ?? 0,
                                'bml_min_buffer' => $dataLastLogger->limit->tsp_min_buffer ?? 0,
                                'bml_max_buffer' => $dataLastLogger->limit->tsp_max_buffer ?? 0,
                                'bml_max' => $dataLastLogger->limit->tsp_max ?? 0,
                            ],
                            'noise' => [
                                'value' => $dataLastLogger->noise ?? 0,
                                'bml_min' => $dataLastLogger->limit->noise_min ?? 0,
                                'bml_min_buffer' => $dataLastLogger->limit->noise_min_buffer ?? 0,
                                'bml_max_buffer' => $dataLastLogger->limit->noise_max_buffer ?? 0,
                                'bml_max' => $dataLastLogger->limit->noise_max ?? 0,
                            ]
                        ],
                        'isOnline' => !!$dataLastLogger,
                        'cctvLink' => $platform->cctv_link,
                        'timezone' => $platform->timezone,
                        'locale' => 'en-US',
                        'forecastData' => $this->processLoggerData($platform->uid, $minDate, $maxDate, $platform->timezone),
                        'lastUpdated' => $dataLastLogger ? Carbon::createFromTimestampUTC($dataLastLogger->datetime_unix)->timezone('Asia/Jakarta')->format('d M Y H:i:s') : null,
                    ];
                }

                return response()->json([
                    'data' => $dataPlatformsTemp,
                    'responseTime' => Carbon::now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }

        private function processLoggerData($uid, $minDate, $maxDate, $timezone) {
            $loggers = Loggers::loggerData5Minutes($uid, $minDate, $maxDate, $timezone)->get();
            $dataLoggersTemp = [];

            foreach ($loggers as $logger) {
                try {
                    // 1. Ambil AQI value langsung dari database (sudah dihitung)
                    $aqiValue = $logger->aqi_index ?? 0;

                    // 2. Cari kategori AQI berdasarkan PM2.5 value untuk display
                    $aqiCatForDisplay = AqiCategories::where('pm25_min', '<=', $logger->pm_25)
                        ->where('pm25_max', '>=', $logger->pm_25)
                        ->first();

                    // Jika tidak ditemukan kategori (PM2.5 > 500), ambil kategori tertinggi
                    if (!$aqiCatForDisplay) {
                        $aqiCatForDisplay = AqiCategories::orderBy('pm25_max', 'desc')->first();

                        if (!$aqiCatForDisplay) {
                            throw new Exception("No AQI categories found in database");
                        }

                        Log::warning("PM2.5 value {$logger->pm_25} exceeds maximum category range. Using highest category for display.");
                    }

                    $dataLoggersTemp[] = [
                        'logger_id' => $logger->id,
                        'timestamp' => $logger->datetime_unix,
                        'value' => (float) number_format($aqiValue, 1), // AQI langsung dari DB
                        'link_video_id' => $logger->link_video_id ?? null,
                        'link_video_status' => $logger->link_video_status ?? null,
                        'link_video_recorded' => $logger->link_video_recorded ?? null,
                        'pm25' => $logger->pm_25,
                        'category' => $aqiCatForDisplay->category_name_en ?? 'Unknown',
                        'category_id' => $aqiCatForDisplay->id,
                        'category_range' => "[{$aqiCatForDisplay->pm25_min}, {$aqiCatForDisplay->pm25_max}]",
                    ];
                } catch (Exception $e) {
                    Log::error("AQI processing failed for logger {$logger->id}: " . $e->getMessage());

                    $dataLoggersTemp[] = [
                        'logger_id' => $logger->id,
                        'timestamp' => $logger->datetime_unix,
                        'value' => $logger->aqi_index ? (float) number_format($logger->aqi_index, 1) : null,
                        'link_video_id' => $logger->link_video_id ?? null,
                        'link_video_status' => $logger->link_video_status ?? null,
                        'link_video_recorded' => $logger->link_video_recorded ?? null,
                        'pm25' => $logger->pm_25,
                        'category' => 'Error',
                        'error' => $e->getMessage()
                    ];
                }
            }

            return $dataLoggersTemp;
        }

        private function calculateAQIFromPM25($pm25, AqiCategories $aqiCat) {
            // Validate input
            if (!is_numeric($pm25) || $pm25 < 0) {
                throw new InvalidArgumentException("Invalid PM2.5 value: {$pm25}");
            }

            // Check if PM2.5 is below minimum category range
            if ($pm25 < $aqiCat->pm25_min) {
                throw new OutOfRangeException(
                    "PM2.5 value {$pm25} is below category minimum [{$aqiCat->pm25_min}]"
                );
            }

            // Calculate PM range
            $pmRange = $aqiCat->pm25_max - $aqiCat->pm25_min;

            // Handle edge case where min and max are the same
            if ($pmRange == 0) {
                return $aqiCat->aqi_min;
            }

            // Linear interpolation formula (EPA standard)
            $aqiRange = $aqiCat->aqi_max - $aqiCat->aqi_min;
            $pmOffset = $pm25 - $aqiCat->pm25_min;

            $aqiValue = (($aqiRange / $pmRange) * $pmOffset) + $aqiCat->aqi_min;

            return round($aqiValue, 1);
        }
        //endregion

        //region Handle Detail Metric
        public function detailMetric(Request $request, $uid) {
            try {

                $dataLogger = Loggers::loggerData($uid)->get();
                $dataLoggerTemp = [];
                foreach ($dataLogger as $item) {
                    if ($request->input('metric') == 'pm10') {
                        $dataLoggerTemp[] = [
                            'timestamp' => $item->datetime_unix,
                            'value' => (float)number_format($item->pm_10, 1),
                        ];
                    }

                    if ($request->input('metric') == 'pm25') {
                        $dataLoggerTemp[] = [
                            'timestamp' => $item->datetime_unix,
                            'value' => (float)number_format($item->pm_25, 1),
                        ];
                    }

                    if ($request->input('metric') == 'tsp') {
                        $dataLoggerTemp[] = [
                            'timestamp' => $item->datetime_unix,
                            'value' => (float)number_format($item->tsp, 1),
                        ];
                    }

                    if ($request->input('metric') == 'noise') {
                        $dataLoggerTemp[] = [
                            'timestamp' => $item->datetime_unix,
                            'value' => (float)number_format($item->noise, 1),
                        ];
                    }
                }

                return response()->json([
                    'data' => $dataLoggerTemp,
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Detail Heartbeat Platform
        public function handleDetailPlatformHeartbeat(Request $request, $uid) {
            try {
                $platform = Platforms::where('uid', $uid)->first();
                $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                $platformHeartbeat = PlatformsHeartbeat::platformsHeartbeat($platform->uid, $minDate, $maxDate, $platform->timezone);
                $totalDataHeartbeat = $platformHeartbeat->count();
                $totalDataHeartbeatOnline = $platformHeartbeat->get()->where('heartbeat_status', '=', 'Online')->count();
                $totalDataHeartbeatOffline = $platformHeartbeat->get()->where('heartbeat_status', '=', 'Offline')->count();

                $totalOnlinePercentage = 0;
                $totalOfflinePercentage = 0;
                if ($totalDataHeartbeat > 0) {
                    $totalOnlinePercentage = round((($totalDataHeartbeatOnline / $totalDataHeartbeat) * 100));
                    $totalOfflinePercentage = round((($totalDataHeartbeatOffline / $totalDataHeartbeat) * 100));
                }

                $dataHeartbeat = $platformHeartbeat->paginate(20)->onEachSide(1);
                return response()->json([
                    'message' => 'Load Successfully',
                    'onlinePercent' => $totalOnlinePercentage,
                    'offlinePercent' => $totalOfflinePercentage,
                    'data' => $dataHeartbeat,
                    'responseTime' => Carbon::now()
                ], 200);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

    }
