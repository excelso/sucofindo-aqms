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
                    $dataLastLogger = Loggers::loggerData5Minutes($platform->uid)
                        ->with('limit')->first();

                    $aqiCat = AqiCategories::dataAqiPm25($dataLastLogger->pm_25 ?? 0)->first();

                    $dataPlatformsTemp[] = [
                        'uid' => $platform->uid,
                        'siteName' => $platform->sites->site_name,
                        'status' => $dataLastLogger != null ? $aqiCat->category_name_en : 'Unknown',
                        'emoji' => $dataLastLogger ? mb_convert_encoding($aqiCat->emoji, 'UTF-8', 'HTML-ENTITIES') : mb_convert_encoding('&#x2753;', 'UTF-8', 'HTML-ENTITIES'),
                        'colorCode' => $dataLastLogger ? $aqiCat->color_code : 'bg-gray-200',
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
                        'forecastData' => $this->processLoggerData($platform->uid),
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

        private function processLoggerData($uid) {
            $loggers = Loggers::loggerData5Minutes($uid)->get();
            $dataLoggersTemp = [];

            foreach ($loggers as $logger) {
                try {
                    $aqiCat = AqiCategories::where('pm25_min', '<=', $logger->pm_25)
                        ->where('pm25_max', '>=', $logger->pm_25)
                        ->first();

                    if (!$aqiCat) {
                        throw new Exception("No AQI category found for PM2.5: {$logger->pm_25}");
                    }

                    $aqiValue = $this->calculateAQIFromPM25($logger->pm_25, $aqiCat);

                    $dataLoggersTemp[] = [
                        'logger_id' => $logger->id,
                        'timestamp' => $logger->datetime_unix,
                        'value' => (float) number_format($aqiValue, 1),
                        'link_video_id' => $logger->link_video_id ?? null,
                        'link_video_status' => $logger->link_video_status ?? null,
                        'link_video_recorded' => $logger->link_video_recorded ?? null,
                        'pm25' => $logger->pm_25,
                        'category' => $aqiCat->category_name_en ?? 'Unknown',
                        'category_id' => $aqiCat->id,
                        'category_range' => "[{$aqiCat->pm25_min}, {$aqiCat->pm25_max}]",
                    ];
                } catch (Exception $e) {
                    Log::error("AQI calculation failed for logger {$logger->id}: " . $e->getMessage());

                    $dataLoggersTemp[] = [
                        'logger_id' => $logger->id,
                        'timestamp' => $logger->datetime_unix,
                        'value' => null,
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

            // Check if PM2.5 is within category range
            if ($pm25 < $aqiCat->pm25_min || $pm25 > $aqiCat->pm25_max) {
                throw new OutOfRangeException(
                    "PM2.5 value {$pm25} is outside category range [{$aqiCat->pm25_min}, {$aqiCat->pm25_max}]"
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

            // Ensure result is within expected AQI range
            $aqiValue = max($aqiCat->aqi_min, min($aqiCat->aqi_max, $aqiValue));

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

        public function handleDetailPlatformHeartbeat(Request $request, $uid) {
            try {

                $page = $request->get('page', 1);
                $perPage = 20;

                // Ambil semua data dulu
                $allData = PlatformsHeartbeat::getHeartbeatWithGap($uid);

                // Manual pagination
                $currentPageItems = $allData->slice(($page - 1) * $perPage, $perPage)->values();

                $platformHeartbeat = new LengthAwarePaginator(
                    $currentPageItems,
                    $allData->count(),
                    $perPage,
                    $page,
                    [
                        'path' => $request->url(),
                        'pageName' => 'page',
                    ]
                );

                // Add query parameters for pagination links
                $platformHeartbeat->appends($request->query());

                return response()->json([
                    'message' => 'Load Successfully',
                    'data' => $platformHeartbeat,
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

    }
