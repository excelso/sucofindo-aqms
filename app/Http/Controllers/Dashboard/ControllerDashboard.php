<?php

    namespace App\Http\Controllers\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Requests\ProfileUpdateRequest;
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
    }
