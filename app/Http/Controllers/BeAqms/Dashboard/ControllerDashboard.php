<?php

    namespace App\Http\Controllers\BeAqms\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\AqiCategories;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use File;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Cache;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;

    class ControllerDashboard extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.dashboard';
        }

        // region Index
        public function index(Request $request) {
            $env = config('app.env');
            return view($this->viewPath . '.index', [
                'env' => $env
            ]);
        }
        // endregion

        // region Handle Data Platforms dengan Pagination
        public function getDataPlatforms(Request $request) {
            try {
                $page = $request->input('page', 1);

                // User platform filtering
                $userPlatformId = null;
                $isTrial = 0;
                if (request()->user()->user_level != 'super_admin') {
                    $isTrial = 1;
                    $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->pluck('platform_id');
                    $userPlatformId = $userPlatformIds->toArray();
                }

                // Base query dengan eager loading
                $platformsQuery = Platforms::with(['sites', 'loggerLimit'])
                    ->dataPlatformByUserPlatform($userPlatformId, $isTrial);

                $platforms = $platformsQuery
                    ->paginate(20, ['*'], 'page', $page);

                // Process platform data
                $dataPlatformsTemp = [];
                foreach ($platforms->items() as $platform) {
                    $dataPlatformsTemp[] = $this->processPlatformData($platform, $request);
                }

                return response()->json([
                    'data' => $dataPlatformsTemp,
                    'pagination' => [
                        'current_page' => $platforms->currentPage(),
                        'last_page' => $platforms->lastPage(),
                        'per_page' => $platforms->perPage(),
                        'total' => $platforms->total(),
                        'has_more_pages' => $platforms->hasMorePages(),
                        'next_page_url' => $platforms->nextPageUrl(),
                        'prev_page_url' => $platforms->previousPageUrl()
                    ],
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => 'Failed to load platform data',
                    'error' => config('app.debug') ? $exception->getMessage() : 'Internal server error',
                    'responseTime' => Carbon::now()
                ], 500, [], JSON_PRETTY_PRINT);
            }
        }
        // endregion

        // region Process Platform Data
        private function processPlatformData($platform, $request = null) {
            // Cache key for platform data
            $cacheKey = "platform_data_{$platform->uid}_" . ($request?->input('date') ? Carbon::parse($request->input('date'))->format('Y-m-d') : Carbon::now()->timezone($platform->timezone)->format('Y-m-d'));

            return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($platform, $request) {

                // Date range setup
                $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');

                if ($request?->input('date')) {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                // Get latest logger data dengan efficient query
                $dataLastLogger = $this->getLatestLoggerData($platform->uid, $minDate, $maxDate, $platform->timezone);

                // Get heartbeat status
                $platformHeartbeat = $this->getPlatformHeartbeat($platform->uid, $minDate, $maxDate, $platform->timezone);

                // Process AQI status
                // [$status, $emoji, $colorCode] = $this->processAQIStatus($dataLastLogger);

                $status = 'Unknown';
                $statusColor = 'bg-gray-200';
                $statusEmo = mb_convert_encoding('&#x2753;', 'UTF-8', 'HTML-ENTITIES');
                if ($dataLastLogger) {
                    if ($dataLastLogger->max_tsp > $dataLastLogger->limit->tsp_max_buffer && $dataLastLogger->max_tsp < $dataLastLogger->limit->tsp_max) {
                        $status = 'Moderate';
                        $statusColor = 'bg-orange-200';
                        $statusEmo = mb_convert_encoding('&#x1F61E;', 'UTF-8', 'HTML-ENTITIES');
                    } else if ($dataLastLogger->max_tsp > $dataLastLogger->limit->tsp_max) {
                        $status = 'Not Good';
                        $statusColor = 'bg-red-300';
                        $statusEmo = mb_convert_encoding('&#x1F922;', 'UTF-8', 'HTML-ENTITIES');
                    } else {
                        $status = 'Good';
                        $statusColor = 'bg-green-200';
                        $statusEmo = mb_convert_encoding('&#x1F601;', 'UTF-8', 'HTML-ENTITIES');
                    }
                }

                return [
                    'uid' => $platform->uid,
                    'uid_alias' => $platform->uid_alias,
                    'siteName' => $platform->sitesLocation->location_name ?? 'Unknown',
                    'status' => $status,
                    'emoji' => $statusEmo,
                    'colorCode' => $statusColor,
                    'metrics' => $this->formatMetrics($dataLastLogger),
                    'isOnline' => $platformHeartbeat && $platformHeartbeat->heartbeat_status === 'Online',
                    'cctvLink1' => $platform->cctv_link_1,
                    'cctv1IsSupportPTZ' => $platform->cctv_1_support_ptz,
                    'cctvLink2' => $platform->cctv_link_2,
                    'cctv2IsSupportPTZ' => $platform->cctv_2_support_ptz,
                    'timezone' => $platform->timezone,
                    'locale' => 'en-US',
                    'lat' => $platform->lat,
                    'lng' => $platform->lng,
                    'airIndexData' => $this->getOptimizedLoggerData($platform->uid, $minDate, $maxDate, $platform->timezone),
                    'lastUpdated' => $dataLastLogger ?
                        Carbon::createFromTimestampUTC($dataLastLogger->datetime_unix)
                            ->timezone('Asia/Jakarta')
                            ->format('d M Y H:i:s') : null,
                ];
            });
        }
        // endregion

        // region Get Latest Logger Data
        private function getLatestLoggerData($uid, $minDate, $maxDate, $timezone) {
            return Cache::remember("latest_logger_{$uid}_{$minDate}_{$maxDate}", now()->addMinutes(2), function () use ($uid, $minDate, $maxDate, $timezone) {
                return Loggers::with('limit')
                    ->loggerData5Minutes($uid, $minDate, $maxDate, $timezone)
                    ->orderBy('datetime_unix', 'DESC')
                    ->first();
            });
        }
        // endregion

        // region Get Platform Heartbeat
        private function getPlatformHeartbeat($uid, $minDate, $maxDate, $timezone) {
            return Cache::remember("heartbeat_{$uid}_{$minDate}_{$maxDate}", now()->addMinutes(2), function () use ($uid, $minDate, $maxDate, $timezone) {
                return PlatformsHeartbeat::select(['heartbeat_status'])
                    ->platformsHeartbeat($uid, $minDate, $maxDate, $timezone)
                    ->first();
            });
        }
        // endregion

        // region Process AQI Status
        private function processAQIStatus($dataLastLogger) {
            $status = 'Unknown';
            $emoji = mb_convert_encoding('&#x2753;', 'UTF-8', 'HTML-ENTITIES');
            $colorCode = 'bg-gray-200';

            if ($dataLastLogger && $dataLastLogger->max_aqi_index !== null) {
                $aqiCat = Cache::remember("aqi_cat_{$dataLastLogger->max_aqi_index}", now()->addHours(1), function () use ($dataLastLogger) {
                    return AqiCategories::select(['category_name_en', 'emoji', 'color_code'])
                        ->dataAqiIndex($dataLastLogger->max_aqi_index)
                        ->first() ?: AqiCategories::select(['category_name_en', 'emoji', 'color_code'])
                        ->orderBy('aqi_max', 'desc')
                        ->first();
                });

                if ($aqiCat) {
                    $status = $aqiCat->category_name_en;
                    $emoji = mb_convert_encoding($aqiCat->emoji, 'UTF-8', 'HTML-ENTITIES');
                    $colorCode = $aqiCat->color_code;
                }
            }

            return [$status, $emoji, $colorCode];
        }
        // endregion

        // region Format Metrics
        private function formatMetrics($dataLastLogger) {
            if (!$dataLastLogger) {
                return [
                    'pm10' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0],
                    'pm25' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0],
                    'tsp' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0],
                    'noise' => ['value' => 0, 'bml_min' => 0, 'bml_min_buffer' => 0, 'bml_max_buffer' => 0, 'bml_max' => 0]
                ];
            }

            return [
                'pm10' => [
                    'value' => $dataLastLogger->max_pm_10 ?? 0,
                    'bml_min' => $dataLastLogger->limit->pm10_min ?? 0,
                    'bml_min_buffer' => $dataLastLogger->limit->pm10_min_buffer ?? 0,
                    'bml_max_buffer' => $dataLastLogger->limit->pm10_max_buffer ?? 0,
                    'bml_max' => $dataLastLogger->limit->pm10_max ?? 0,
                ],
                'pm25' => [
                    'value' => $dataLastLogger->max_pm_25 ?? 0,
                    'bml_min' => $dataLastLogger->limit->pm25_min ?? 0,
                    'bml_min_buffer' => $dataLastLogger->limit->pm25_min_buffer ?? 0,
                    'bml_max_buffer' => $dataLastLogger->limit->pm25_max_buffer ?? 0,
                    'bml_max' => $dataLastLogger->limit->pm25_max ?? 0,
                ],
                'tsp' => [
                    'value' => $dataLastLogger->max_tsp ?? 0,
                    'bml_min' => $dataLastLogger->limit->tsp_min ?? 0,
                    'bml_min_buffer' => $dataLastLogger->limit->tsp_min_buffer ?? 0,
                    'bml_max_buffer' => $dataLastLogger->limit->tsp_max_buffer ?? 0,
                    'bml_max' => $dataLastLogger->limit->tsp_max ?? 0,
                ],
                'noise' => [
                    'value' => $dataLastLogger->noise_leq ?? 0,
                    'bml_min' => $dataLastLogger->limit->noise_min ?? 0,
                    'bml_min_buffer' => $dataLastLogger->limit->noise_min_buffer ?? 0,
                    'bml_max_buffer' => $dataLastLogger->limit->noise_max_buffer ?? 0,
                    'bml_max' => $dataLastLogger->limit->noise_max ?? 0,
                ]
            ];
        }
        // endregion

        // region Get Optimized Logger Data
        private function getOptimizedLoggerData($uid, $minDate, $maxDate, $timezone) {
            return Cache::remember("logger_data_{$uid}_{$minDate}_{$maxDate}", now()->addMinutes(5), function () use ($uid, $minDate, $maxDate, $timezone) {
                $loggers = Loggers::select([
                    'id', 'datetime_unix', 'max_aqi_index', 'max_aqi_index_tsp',
                    'max_pm_25', 'max_pm_10', 'max_tsp', 'aqi_from',
                    'link_video_recorded'
                ])
                    ->loggerData5Minutes($uid, $minDate, $maxDate, $timezone)
                    ->orderBy('datetime_unix', 'ASC')
                    ->limit(288) // Limit to last 24 hours (5-minute intervals)
                    ->get();

                $dataLoggersTemp = [];
                $aqiCategories = $this->getCachedAQICategories();

                foreach ($loggers as $logger) {
                    try {
                        $aqiValue = $logger->max_aqi_index ?? 0;
                        $aqiValueTsp = $logger->max_aqi_index_tsp ?? 0;

                        $aqiCatForDisplay = $this->findAQICategory($logger->max_pm_25, $aqiCategories);

                        $dataLoggersTemp[] = [
                            'logger_id' => $logger->id,
                            'timestamp' => $logger->datetime_unix,
                            'value' => (float)$aqiValue,
                            'value_tsp' => (float)$aqiValueTsp,
                            'link_video_id' => $logger->link_video_id,
                            'link_video_status' => $logger->link_video_status,
                            'link_video_recorded' => $logger->link_video_recorded,
                            'pm25' => $logger->max_pm_25,
                            'pm10' => $logger->max_pm_10,
                            'tsp' => $logger->max_tsp,
                            'category' => $aqiCatForDisplay['category_name_en'] ?? 'Unknown',
                            'category_id' => $aqiCatForDisplay['id'] ?? null,
                            'aqi_from' => $logger->aqi_from,
                        ];
                    } catch (Exception $e) {
                        Log::error("AQI processing failed for logger {$logger->id}: " . $e->getMessage());
                        continue;
                    }
                }

                return $dataLoggersTemp;
            });
        }
        // endregion

        // region Get Cached AQI Categories
        private function getCachedAQICategories() {
            return Cache::remember('aqi_categories', now()->addHours(24), function () {
                return AqiCategories::select(['id', 'category_name_en', 'pm25_min', 'pm25_max'])
                    ->orderBy('pm25_min')
                    ->get()
                    ->toArray();
            });
        }
        // endregion

        // region Find AQI Category
        private function findAQICategory($pm25Value, $categories) {
            foreach ($categories as $category) {
                if ($pm25Value >= $category['pm25_min'] && $pm25Value <= $category['pm25_max']) {
                    return $category;
                }
            }

            // Return highest category if PM2.5 exceeds all ranges
            return end($categories);
        }
        // endregion

        // region Handle Detail Metric
        public function detailMetric(Request $request, $uid) {
            try {
                $platform = Platforms::select(['uid', 'timezone'])->where('uid', $uid)->first();

                if (!$platform) {
                    return response()->json(['message' => 'Platform not found'], 404);
                }

                $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');

                if ($request->input('date')) {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                $metricColumn = $this->getMetricColumn($request->input('metric'));

                $dataLogger = Loggers::select(['datetime_unix', $metricColumn])
                    ->loggerData5Minutes($uid, $minDate, $maxDate, $platform->timezone)
                    ->orderBy('datetime_unix', 'ASC')
                    ->get();

                $dataLoggerTemp = $dataLogger->map(function ($item) use ($metricColumn, $request) {
                    $value = (float)($item->{$metricColumn} ?? 0);
                    if ($request->input('metric') == 'pm10') {
                        $value = (float)($item->{$metricColumn} ? $item->{$metricColumn} * 0.4 : 0);
                    }

                    return [
                        'timestamp' => $item->datetime_unix,
                        'value' => $value,
                    ];
                });

                return response()->json([
                    'data' => $dataLoggerTemp,
                    'timezone' => $platform->timezone,
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                Log::error('Detail metric error: ' . $exception->getMessage());
                return response()->json([
                    'message' => 'Failed to load metric data',
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        // endregion

        // region Get Metric Column
        private function getMetricColumn($metric) {
            $columns = [
                'pm10' => 'max_tsp',
                'pm25' => 'max_tsp',
                'tsp' => 'max_tsp',
                'noise' => 'noise_leq'
            ];

            return $columns[$metric] ?? 'max_pm_25';
        }
        // endregion

        // region Handle Detail Platform Heartbeat
        public function handleDetailPlatformHeartbeat(Request $request, $uid) {
            try {
                $platform = Platforms::select(['uid', 'timezone'])->where('uid', $uid)->first();

                if (!$platform) {
                    return response()->json(['message' => 'Platform not found'], 404);
                }

                $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');

                if ($request->input('date')) {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                $platformHeartbeatCalc = PlatformsHeartbeat::platformsHeartbeat($platform->uid, $minDate, $maxDate, $platform->timezone);
                $platformHeartbeat = PlatformsHeartbeat::platformsHeartbeat($platform->uid, $minDate, $maxDate, $platform->timezone, $request->input('status') ?? null);

                $totalCounts = $this->getHeartbeatCounts($platformHeartbeatCalc);

                return response()->json([
                    'message' => 'Load Successfully',
                    'onlinePercent' => $totalCounts['online_percent'],
                    'offlinePercent' => $totalCounts['offline_percent'],
                    'data' => $platformHeartbeat->paginate(20)->onEachSide(1),
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);

            } catch (Exception $exception) {
                Log::error('Platform heartbeat error: ' . $exception->getMessage());
                return response()->json([
                    'message' => 'Failed to load heartbeat data',
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        // endregion

        // region Handle Detail Platform Report
        public function calculateAQIFromTSP($tspValue) {
            try {
                // Get AQI category based on TSP value
                $aqiCategory = DB::table('t_aqi_categories')
                    ->where('tsp_min', '<=', $tspValue)
                    ->where('tsp_max', '>=', $tspValue)
                    ->first();

                if (!$aqiCategory) {
                    // If TSP value exceeds all ranges, get the highest category
                    $aqiCategory = DB::table('t_aqi_categories')
                        ->orderBy('tsp_max', 'desc')
                        ->first();

                    if (!$aqiCategory) {
                        throw new Exception('No AQI categories found in database');
                    }

                    // For values exceeding the highest range, use maximum AQI
                    return [
                        'aqi_value' => $aqiCategory->aqi_max,
                        'category_name' => $aqiCategory->category_name,
                        'category_name_en' => $aqiCategory->category_name_en,
                        'color_code' => $aqiCategory->color_code,
                        'emoji' => $aqiCategory->emoji,
                        'health_advice' => $aqiCategory->health_advice,
                        'is_exceeded' => true,
                        'tsp_value' => $tspValue
                    ];
                }

                // Calculate AQI using linear interpolation formula
                // AQI = ((AQI_high - AQI_low) / (TSP_high - TSP_low)) * (TSP - TSP_low) + AQI_low

                $aqiHigh = $aqiCategory->aqi_max;
                $aqiLow = $aqiCategory->aqi_min;
                $tspHigh = $aqiCategory->tsp_max;
                $tspLow = $aqiCategory->tsp_min;

                $aqiValue = (($aqiHigh - $aqiLow) / ($tspHigh - $tspLow)) * ($tspValue - $tspLow) + $aqiLow;
                $aqiValue = round($aqiValue);

                return [
                    'aqi_value' => $aqiValue,
                    'category_name' => $aqiCategory->category_name,
                    'category_name_en' => $aqiCategory->category_name_en,
                    'color_code' => $aqiCategory->color_code,
                    'emoji' => $aqiCategory->emoji,
                    'health_advice' => $aqiCategory->health_advice,
                    'is_exceeded' => false,
                    'tsp_value' => $tspValue,
                    'tsp_range' => [
                        'min' => $tspLow,
                        'max' => $tspHigh
                    ],
                    'aqi_range' => [
                        'min' => $aqiLow,
                        'max' => $aqiHigh
                    ]
                ];

            } catch (Exception $e) {
                Log::error('AQI calculation error: ' . $e->getMessage());
                return [
                    'aqi_value' => 0,
                    'category_name' => 'Error',
                    'category_name_en' => 'Error',
                    'color_code' => '#000000',
                    'emoji' => '❌',
                    'health_advice' => 'Unable to calculate AQI',
                    'is_exceeded' => false,
                    'tsp_value' => $tspValue,
                    'error' => $e->getMessage()
                ];
            }
        }

        public function handleDetailPlatformReport(Request $request, $uid) {
            try {
                $platform = Platforms::select(['uid', 'timezone'])->where('uid', $uid)->first();

                if (!$platform) {
                    return response()->json(['message' => 'Platform not found'], 404);
                }

                $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');

                if ($request->input('date')) {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                $dataLoggerStatus = Loggers::reportLoggerData($platform->uid, $minDate, $maxDate, $platform->timezone, [
                    'search' => $request->input()
                ]);

                $dataLoggerStatus->selectRaw('COUNT(*) as total');
                $dataLoggerStatus->selectRaw('SUM(CASE WHEN summary.max_tsp < t_loggers_limit.tsp_max_buffer THEN 1 ELSE 0 END) as good_status');
                $dataLoggerStatus->selectRaw('SUM(CASE WHEN summary.max_tsp > t_loggers_limit.tsp_max_buffer AND summary.max_tsp < t_loggers_limit.tsp_max THEN 1 ELSE 0 END) as moderate_status');
                $dataLoggerStatus->selectRaw('SUM(CASE WHEN summary.max_tsp > t_loggers_limit.tsp_max THEN 1 ELSE 0 END) as not_good_status');
                $dataLoggerStatus->selectRaw('t_loggers_limit.tsp_min');
                $dataLoggerStatus->selectRaw('t_loggers_limit.tsp_max_buffer');
                $dataLoggerStatus->selectRaw('t_loggers_limit.tsp_max');
                $dataStatusCount = $dataLoggerStatus->first();

                $goodStatus = $dataStatusCount->total > 0 ? round(($dataStatusCount->good_status / $dataStatusCount->total) * 100) : 0;
                $modeStatus = $dataStatusCount->total > 0 ? round(($dataStatusCount->moderate_status / $dataStatusCount->total) * 100) : 0;
                $nogoStatus = $dataStatusCount->total > 0 ? round(($dataStatusCount->not_good_status / $dataStatusCount->total) * 100) : 0;

                $tspMinAQI = $this->calculateAQIFromTSP($dataStatusCount->tsp_min ?? 0);
                $tspMaxBufferAQI = $this->calculateAQIFromTSP($dataStatusCount->tsp_max_buffer ?? 0);
                $tspMaxAQI = $this->calculateAQIFromTSP($dataStatusCount->tsp_max ?? 0);

                $dataLogger = Loggers::reportLoggerData($platform->uid, $minDate, $maxDate, $platform->timezone, [
                    'search' => $request->input()
                ])->with('limit');

                return response()->json([
                    'message' => 'Load Successfully',
                    'limit_tsp_min' => $dataStatusCount->tsp_min ?? 0,
                    'limit_tsp_min_aqi' => $tspMinAQI['aqi_value'],
                    'limit_tsp_max_buffer' => $dataStatusCount->tsp_max_buffer ?? 0,
                    'limit_tsp_max_buffer_aqi' => $tspMaxBufferAQI['aqi_value'],
                    'limit_tsp_max' => $dataStatusCount->tsp_max ?? 0,
                    'limit_tsp_max_aqi' => $tspMaxAQI['aqi_value'],
                    'good_status' => $goodStatus,
                    'mode_status' => $modeStatus,
                    'nogo_status' => $nogoStatus,
                    'data' => $dataLogger->paginate(20)->onEachSide(1),
                    'responseTime' => Carbon::now()
                ], 200);

            } catch (Exception $exception) {
                Log::error('Platform heartbeat error: ' . $exception->getMessage());
                return response()->json([
                    'message' => 'Failed to load heartbeat data',
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        // endregion

        // region Get Heartbeat Counts
        private function getHeartbeatCounts($query) {
            $counts = $query->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN heartbeat_status = "Online" THEN 1 ELSE 0 END) as online_count,
                SUM(CASE WHEN heartbeat_status = "Offline" THEN 1 ELSE 0 END) as offline_count
            ')->first();

            $total = $counts->total;
            $onlinePercent = $total > 0 ? round(($counts->online_count / $total) * 100) : 0;
            $offlinePercent = $total > 0 ? round(($counts->offline_count / $total) * 100) : 0;

            return [
                'online_percent' => $onlinePercent,
                'offline_percent' => $offlinePercent
            ];
        }
        // endregion

        //region Handle Export Heartbeat Sensor
        public static function numToExcelAlpha($n): int|string {
            $r = 'A';
            while ($n-- > 1) {
                $r++;
            }
            return $r;
        }

        public function handleExportHeartbeat(Request $request, $uid) {
            try {

                $head = [
                    'UID' => [
                        'props' => [
                            'align' => 'center',
                            'width' => 8,
                        ]
                    ],
                    trans('Logger Status') => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                            'format' => '@text',
                        ]
                    ],
                    trans('Update Date') => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                            'format' => '@datetime',
                        ]
                    ],
                ];

                $excel = Excel::create(['Platform Status']);
                $sheet = $excel->getSheet(1);

                $headIndex = 0;
                $colsStyle = [];
                foreach ($head as $key => $value) {
                    $headIndex++;
                    $highColumn = $this->numToExcelAlpha($headIndex);

                    $header_prop_align = 'left';
                    $header_prop_width = 'auto';
                    $header_prop_format = '';
                    $header_prop_warp = '';
                    if (isset($value['props'])) {
                        $header_prop = $value['props'];
                        $header_prop_align = $header_prop['align'] ?? 'left';
                        $header_prop_width = $header_prop['width'] ?? 'auto';
                        $header_prop_format = $header_prop['format'] ?? '';
                        $header_prop_warp = $header_prop['warp'] ?? '';
                    }

                    $styles = [
                        $highColumn => [
                            'text-align' => $header_prop_align,
                            'width' => $header_prop_width,
                            'format' => $header_prop_format,
                            'text-wrap' => $header_prop_warp,
                            'vertical-align' => 'center',
                            'border' => [
                                Style::BORDER_BOTTOM => Style::BORDER_THIN
                            ]
                        ]
                    ];

                    $colsStyle[] = $styles;
                    $sheet->writeTo($highColumn . '1', $key, [
                        'text-align' => $header_prop_align,
                        'width' => $header_prop_width,
                        'vertical-align' => 'center',
                        'font' => [
                            'style' => 'bold'
                        ],
                        'border' => [
                            Style::BORDER_TOP => Style::BORDER_THIN,
                            Style::BORDER_BOTTOM => Style::BORDER_DOUBLE
                        ],
                        'height' => 24,
                    ]);
                }

                $sheet->nextRow();
                $sheet->setColOptions(array_merge([], ...$colsStyle));

                $platform = Platforms::where('uid', $uid)->first();
                $minDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($platform->timezone)->format('Y-m-d H:i');
                if ($request->input('date')) {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                PlatformsHeartbeat::platformsHeartbeat($platform->uid, $minDate, $maxDate, $platform->timezone, $request->input('status') ?? null)
                    ->chunk(50, function ($platformHeartbeatsChunk) use ($sheet) {
                        $rowNumber = 0;
                        $rows = [];
                        foreach ($platformHeartbeatsChunk as $data) {
                            $rowNumber++;

                            $rows[] = [
                                $data->uid,
                                $data->heartbeat_status ?? '',
                                $data->date_formated,
                            ];
                        }

                        foreach ($rows as $index => $r) {
                            $sheet->writeRow($r);
                        }
                    });

                $filename = 'platform-status_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
                $directory = storage_path('app/public/platform-status');

                if (!File::exists($directory)) {
                    File::makeDirectory($directory, 0755, true);
                }

                $filePath = $directory . '/' . $filename;
                $excel->save($filePath);

                return response()->download($filePath, $filename)
                    ->deleteFileAfterSend();

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
