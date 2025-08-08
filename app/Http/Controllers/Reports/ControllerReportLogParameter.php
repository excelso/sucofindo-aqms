<?php

    namespace App\Http\Controllers\Reports;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Companies;
    use App\Models\Master\CompaniesSites;
    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;
    use Throwable;

    class ControllerReportLogParameter extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/reports/data-log-parameter';
        }

        public function index(Request $request): View {
            $dataCompanies = Companies::all();

            $dataAllPlatform = Platforms::orderBy('uid', 'ASC')
                ->with('sites')->get();

            $dataPlatform = Platforms::orderBy('uid', 'ASC')->first();
            $minDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 00:00';
            $maxDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 23:59';
            if ($request->input('startDate')) {
                $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
            }

            $dataLogger = Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                'search' => $request->input()
            ]);

            return view($this->viewPath . '/index', [
                'items' => $dataLogger->paginate(20)->onEachSide(1),
                'dataAllPlatform' => $dataAllPlatform,
                'platform' => $dataPlatform,
                'companies' => $dataCompanies,
            ]);
        }
    }
