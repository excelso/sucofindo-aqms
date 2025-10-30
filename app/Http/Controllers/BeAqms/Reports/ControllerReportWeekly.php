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

            return view($this->viewPath . '/index', [
                'platforms' => $dataPlatform,
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

        public function handleDataEntryCharts(Request $request) {
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
                    $dataEntry = Loggers::dataPercentageEntryWeekly($request->input('uid'), $dates['startDate'], $dates['untilDate'], $dataPlatform->timezone, $totalSample)->first();
                    $data[] = round($dataEntry->percentage ?? 0, 2);
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
                    $data[] = round($dataEntry->percentage ?? 0, 2);
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

    }
