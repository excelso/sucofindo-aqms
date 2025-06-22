<?php

    namespace App\Http\Controllers\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\ProfileUpdateRequest;
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
                $dataPlatforms = $dataPlatforms->transform(function ($platform) {
                    $dataLoggers = Loggers::lastData($platform->uid)->first();

                    $platform->metrics = [
                        'pm10' => [
                            'value' => $dataLoggers->pm_10 ?? 0,
                            'bml' => 20,
                            'buffer' => 10
                        ],
                        'pm25' => [
                            'value' => $dataLoggers->pm_25 ?? 0,
                            'bml' => 20,
                            'buffer' => 10
                        ],
                        'pm1' => [
                            'value' => $dataLoggers->pm_1 ?? 0,
                            'bml' => 20,
                            'buffer' => 10
                        ],
                        'noise' => [
                            'value' => $dataLoggers->noise ?? 0,
                            'bml' => 20,
                            'buffer' => 10
                        ]
                    ];

                    $platform->isOnline = true;
                    $platform->cctvLink = $platform->cctv_link;

                    return $platform;
                });

                return response()->json([
                    'data' => $dataPlatforms,
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
