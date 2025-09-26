<?php

    namespace App\Http\Controllers\BeSparing\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Models\Master\AqiCategories;
    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use App\Models\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use File;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Cache;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;

    class BeSparingControllerMaps extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.dashboard.maps';
        }

        // region Index
        public function index(Request $request) {
            $env = config('app.env');
            return view($this->viewPath . '.index', [
                'env' => $env
            ]);
        }
        // endregion

    }
