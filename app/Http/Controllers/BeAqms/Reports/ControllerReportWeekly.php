<?php

    namespace App\Http\Controllers\BeAqms\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Controllers\WeekCalculator;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class ControllerReportWeekly extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/reports/data-weekly-report';
        }

        public function index(): View {
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
                $totalDaysInWeeks = 0; // Tambahkan ini

                foreach ($weekGroups as $week => $dates) {
                    $dataCategories[] = $week;

                    $totalSample = $dates['totalDays'] * 1440;
                    $dataEntry = Loggers::dataPercentageEntryWeekly($request->input('uid'), $dates['startDate'] . ' 00:00', $dates['untilDate'] . ' 23:59', $dataPlatform->timezone, $totalSample)->first();
                    $data[] = [
                        'y' => round($dataEntry->percentage ?? 0, 2),
                        'weekDetail' => [
                            'startDate' => $dates['startDate'],
                            'untilDate' => $dates['untilDate'],
                            'totalDays' => $dates['totalDays']
                        ]
                    ];

                    $totalDaysInWeeks += $dates['daysInMonth'];
                }

                // Ambil tanggal dari week pertama dan terakhir
                $firstWeek = reset($weekGroups); // Ambil week pertama
                $lastWeek = end($weekGroups);     // Ambil week terakhir

                $startDateWeeks = $firstWeek['startDate'] . ' 00:00';
                $untilDateWeeks = $lastWeek['untilDate'] . ' 23:59';

                $dataEntry = Loggers::dataPercentageEntryMonthly(
                    $request->input('uid'),
                    $startDateWeeks,
                    $untilDateWeeks,
                    $dataPlatform->timezone,
                    ($totalDaysInWeeks * 1440) // Gunakan total days dari weeks
                )->first();

                return response()->json([
                    'message' => 'Load Successful!',
                    'dataCategories' => $dataCategories,
                    'data' => $data,
                    'x' => $startDateWeeks,
                    'y' => $untilDateWeeks,
                    'dataMonthly' => round($dataEntry->percentage ?? 0, 1),
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
                    $dataEntry = PlatformsHeartbeat::dataPercentageConnectWeekly($request->input('uid'), $dates['startDate'] . ' 00:00', $dates['untilDate'] . ' 23:59', $dataPlatform->timezone, $totalSample)->first();
                    $data[] = [
                        'y' => round($dataEntry->percentage ?? 0, 2),
                        'weekDetail' => [
                            'startDate' => $dates['startDate'],
                            'untilDate' => $dates['untilDate'],
                            'totalDays' => $dates['totalDays']
                        ]
                    ];
                }

                $startOfMonth = Carbon::createFromDate($request->input('year'), $request->input('month'), 1)->startOfMonth();
                $untilOfMonth = Carbon::createFromDate($request->input('year'), $request->input('month'), 1)->endOfMonth();
                $totalDays = $startOfMonth->diffInDays($untilOfMonth) + 1;
                $dataEntry = PlatformsHeartbeat::dataPercentageConnectMonthly($request->input('uid'), $startOfMonth->format('Y-m-d') . ' 00:00', $untilOfMonth->format('Y-m-d') . ' 23:59', $dataPlatform->timezone, ($totalDays * 1440))->first();

                return response()->json([
                    'message' => 'Load Successful!',
                    'dataWeek' => $dataWeek,
                    'dataCategories' => $dataCategories,
                    'data' => $data,
                    'dataMonthly' => round($dataEntry->percentage ?? 0, 1),
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
                                $param = round($item->tsp * 0.4, 2);
                                break;
                            case 'tsp':
                                $param = round($item->tsp, 2);
                                break;
                            case 'noise':
                                $param = floor($item->noise);
                                break;
                        }

                        $data[] = [
                            'x' => Carbon::createFromTimestampUTC($item->datetime_unix_interval)->getPreciseTimestamp(3),
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
