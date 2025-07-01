<?php

    namespace App\Http\Controllers\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\ProfileUpdateRequest;
    use App\Models\Master\AqiCategories;
    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use Cache;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\Redirect;
    use Illuminate\View\View;

    class ControllerDashboard extends Controller {

        protected string $viewPath;
        public function __construct() {
            $this->viewPath = 'main.dashboard';
        }

        public function index(Request $request): View {
            return view($this->viewPath . '.index');
        }

        //region Handle Data Platforms
        public function getDataPlatforms(Request $request) {
            try {

                $platforms = Platforms::orderBy('created_at', 'ASC')->get();
                $dataPlatformsTemp = [];
                foreach ($platforms as $platform) {
                    $dataLastLogger = Loggers::loggerData($platform->uid, 'DESC')
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
                        'forecastData' => $this->processLoggerData($platform->uid, $aqiCat),
                        'lastUpdated' => $dataLastLogger ? Carbon::createFromTimestampUTC($dataLastLogger->datetime_unix)->timezone('Asia/Jakarta')->format('d M Y H:i:s') : null
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

        private function processLoggerData($uid, AqiCategories $aqiCat) {
            $loggers = Loggers::loggerData($uid)->get();
            $dataLoggersTemp = [];
            foreach ($loggers as $logger) {
                // Optimized AQI calculation dengan pengecekan division by zero
                $pmRange = $aqiCat->pm25_max - $aqiCat->pm25_min;
                if ($pmRange == 0) {
                    $aqiValue = $aqiCat->aqi_min;
                } else {
                    $formula_1 = ($aqiCat->aqi_max - $aqiCat->aqi_min) / $pmRange;
                    $formula_2 = ($logger->pm_25 - $aqiCat->pm25_min);
                    $aqiValue = ($formula_1 * $formula_2) + $aqiCat->aqi_min;
                }

                $dataLoggersTemp[] = [
                    'timestamp' => $logger->datetime_unix,
                    'value' => (float) number_format($aqiValue, 1),
                ];
            }

            return $dataLoggersTemp;
        }
        //endregion

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

    }
