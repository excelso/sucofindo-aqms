<?php

    namespace App\Http\Controllers\Master;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Geo\GeoCity;
    use App\Models\Users\User;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;

    class ControllerSites extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/master/data-sites';
        }

        public function index(): View {
            return view($this->viewPath . '/index');
        }
    }
