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

    class ControllerReportWeeklySummary extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/reports/data-weekly-summary';
        }

        public function index(): View {
            $weekCalculator = new WeekCalculator();
            $weekAllYear = $weekCalculator->getAllWeeksInYear(date('Y'));
            $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
            $weekInfo = $week['weekInfo'];
            $weekNumb = $week['weekNumber'];

            $startDate = $weekInfo['startDate'];
            $untilDate = $weekInfo['untilDate'];

            $userPlatformId = null;
            $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->get();
            foreach ($userPlatformIds as $platformId) {
                $userPlatformId[] = $platformId->platform_id;
            }

            $data = Platforms::dataWeeklySummary($startDate, $untilDate, 'Asia/Makassar', 10080, $userPlatformId);

            return view($this->viewPath . '.index', [
                'items' => $data->paginate(20)->onEachSide(1),
                'weeks' => $weekAllYear,
                'weekInfo' => $weekInfo,
                'weekNumb' => $weekNumb,
            ]);
        }
    }
