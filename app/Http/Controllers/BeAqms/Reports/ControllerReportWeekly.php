<?php

    namespace App\Http\Controllers\BeAqms\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Controllers\WeekCalculator;
    use App\Models\BeAqms\Master\AqiCategories;
    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\File;
    use Illuminate\View\View;

    class ControllerReportWeekly extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/reports/data-weekly-report';
        }

        public function index(Request $request): View {
            $userPlatformId = null;
            $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->get();
            foreach ($userPlatformIds as $platformId) {
                $userPlatformId[] = $platformId->platform_id;
            }

            $dataPlatform = Platforms::dataPlatformByUserPlatform($userPlatformId)->first();
            $dataAllPlatform = Platforms::dataPlatformByUserPlatform($userPlatformId)
                ->with('sites')->get();

            return view($this->viewPath . '/index', [
                'platforms' => $dataPlatform,
                'dataAllPlatform' => $dataAllPlatform,
            ]);
        }

        //region Handle Data Average Logger
        public function handleAvgData(Request $request) {
            try {

                $dataPlatform = Platforms::where('uid', $request->input('uid'))->first();
                $dataAvg = Loggers::calculateAvgData($request->input('uid'), $dataPlatform->timezone, $request->input('month'), $request->input('year'))
                    ->first();

                return response()->json([
                    'message' => 'Load Successful!',
                    'data' => $dataAvg,
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500, [], JSON_PRETTY_PRINT);
            }
        }
        //endregion

        //region Handle Data Entry Charts
        public function handleDataEntryCharts(Request $request) {
            try {

                $dataPlatform = Platforms::where('uid', $request->input('uid'))->first();

                $weekCalculator = new WeekCalculator();
                $weekGroups = $weekCalculator->getWeekGroupings($request->input('year'), $request->input('month'));

                $dataCategories = [];
                $data = [];
                foreach ($weekGroups as $week => $dates) {
                    $dataCategories[] = $week;

                    $totalSample = $dates['totalDays'] * 1440;
                    $dataEntry = Loggers::dataPercentageEntryWeekly($request->input('uid'), $dates['startDate'], $dates['untilDate'], $dataPlatform->timezone, $totalSample)->first();
                    $data[] = [
                        'y' => round($dataEntry->percentage ?? 0, 2),
                        'weekDetail' => [
                            'startDate' => $dates['startDate'],
                            'untilDate' => $dates['untilDate'],
                            'totalDays' => $dates['totalDays']
                        ]
                    ];
                }

                return response()->json([
                    'message' => 'Load Successful!',
                    'dataCategories' => $dataCategories,
                    'data' => $data,
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500, [], JSON_PRETTY_PRINT);
            }
        }
        //endregion

        //region Handle Data Connectivity Charts
        public function handleDataConnectCharts(Request $request) {
            try {

                $dataPlatform = Platforms::where('uid', $request->input('uid'))->first();

                $weekCalculator = new WeekCalculator();
                $weekGroups = $weekCalculator->getWeekGroupings($request->input('year'), $request->input('month'));

                $dataWeek = [];
                $dataCategories = [];
                $data = [];
                foreach ($weekGroups as $week => $dates) {
                    $dataCategories[] = $week;
                    $dataWeek[] = $dates;

                    $totalSample = $dates['totalDays'] * 1440;
                    $dataEntry = PlatformsHeartbeat::dataPercentageConnectWeekly($request->input('uid'), $dates['startDate'], $dates['untilDate'], $dataPlatform->timezone, $totalSample)->first();
                    $data[] = [
                        'y' => round($dataEntry->percentage ?? 0, 2),
                        'weekDetail' => [
                            'startDate' => $dates['startDate'],
                            'untilDate' => $dates['untilDate'],
                            'totalDays' => $dates['totalDays']
                        ]
                    ];
                }

                return response()->json([
                    'message' => 'Load Successful!',
                    'dataWeek' => $dataWeek,
                    'dataCategories' => $dataCategories,
                    'data' => $data,
                    'responseTime' => Carbon::now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500, [], JSON_PRETTY_PRINT);
            }
        }
        //endregion

        public function handleDataSensorCharts(Request $request) {
            try {
                $dataPlatform = Platforms::where('uid', $request->input('uid'))->first();

                $weekCalculator = new WeekCalculator();
                $weekGroups = $weekCalculator->getWeekGroupings($request->input('year'), $request->input('month'));

                $dataX = [];
                foreach ($weekGroups as $week => $dates) {
                    $data = [];

                    $dataSensor = Loggers::dataSensorWeekly(
                        $request->input('uid'),
                        $dates['startDate'],
                        $dates['untilDate'],
                        $dataPlatform->timezone
                    )->get();

                    foreach ($dataSensor as $item) {
                        $param = '';
                        switch ($request->input('parameterId')) {
                            case 'pm_25':
                                $param = round($item->pm_25, 2);
                                break;
                            case 'pm_10':
                                $param = round($item->pm_10, 2);
                                break;
                            case 'tsp':
                                $param = round($item->tsp, 2);
                                break;
                            case 'noise':
                                $param = floor($item->noise);
                                break;
                        }

                        $data[] = [
                            'x' => ($item->datetime_unix_interval * 1000),
                            'y' => $param,
                            'format' => $item->datetime_format,
                        ];
                    }

                    $dataX[] = [
                        'type' => 'line',
                        'name' => $week,
                        'showInLegend' => true,
                        'data' => $data
                    ];
                }

                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataX,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500, [], JSON_PRETTY_PRINT);
            }
        }
    }
