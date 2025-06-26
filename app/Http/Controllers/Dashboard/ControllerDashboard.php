<?php

    namespace App\Http\Controllers\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\ProfileUpdateRequest;
    use App\Models\Master\AqiCategories;
    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
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

        public function getDataPlatforms(Request $request) {
            try {

                $dataPlatforms = Platforms::all();

                $dataPlatformsTemp = [];
                foreach ($dataPlatforms as $item) {
                    $dataLastLoggers = Loggers::loggerData($item->uid, 'DESC')->first();
                    $dataAqiPm25 = AqiCategories::dataAqiPm25($dataLastLoggers->pm_25 ?? 0)->first();

                    $dataLoggers = Loggers::loggerData($item->uid)->get();
                    $dataLoggersTemp = [];
                    foreach ($dataLoggers as $itemLogger) {
                        $aqiCat = AqiCategories::dataAqiPm25($itemLogger->pm_25)->first();

                        // (AQI max - AQI min / AQI PM2.5 max - AQI PM2.5 min) x (Curr PM2.5 - AQI PM2.5 min) + AQI min
                        $formula_1 = ($aqiCat->aqi_max - $aqiCat->aqi_min) / ($aqiCat->pm25_max - $aqiCat->pm25_min);
                        $formula_2 = ($itemLogger->pm_25 - $aqiCat->pm25_min) + $aqiCat->aqi_min;
                        $formula_3 = $formula_1 * $formula_2;

                        $dataLoggersTemp[] = [
                            'timestamp' => $itemLogger->datetime_unix,
                            'value' => (float) number_format($formula_3, 1),
                        ];
                    }

                    $dataPlatformsTemp[] = [
                        'status' => $dataAqiPm25->category_name_en,
                        'emoji' => $dataAqiPm25->emoji,
                        'colorCode' => $dataAqiPm25->color_code,
                        'metrics' => [
                            'pm10' => [
                                'value' => $dataLastLoggers->pm_10 ?? 0,
                                'bml' => 20,
                                'buffer' => 10
                            ],
                            'pm25' => [
                                'value' => $dataLastLoggers->pm_25 ?? 0,
                                'bml' => 20,
                                'buffer' => 10
                            ],
                            'tsp' => [
                                'value' => $dataLastLoggers->tsp ?? 0,
                                'bml' => 20,
                                'buffer' => 10
                            ],
                            'noise' => [
                                'value' => $dataLastLoggers->noise ?? 0,
                                'bml' => 20,
                                'buffer' => 10
                            ]
                        ],
                        'isOnline' => true,
                        'cctvLink' => $item->cctv_link,
                        'forecastData' => $dataLoggersTemp,
                    ];
                }

                return response()->json([
                    'data' => $dataPlatformsTemp,
                    'responseTime' => Carbon::now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
    }
