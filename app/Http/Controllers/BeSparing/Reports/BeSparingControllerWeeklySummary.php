<?php

    namespace App\Http\Controllers\BeSparing\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Controllers\WeekCalculator;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class BeSparingControllerWeeklySummary extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.reports.weekly-summary';
        }

        public function index(Request $request): View {

            $weekCalculator = new WeekCalculator();
            $week = $weekCalculator->getWeekInfoForDate(Carbon::now())['weekInfo'];

            $dataParam = Parameter::weeklySummary($week['startDate'], $week['untilDate'], 'Asia/Makassar', null, 1);

            return view($this->viewPath . '.index', [
                'items' => $dataParam->paginate(20)->onEachSide(1),
            ]);
        }

    }
