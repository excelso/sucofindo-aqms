<?php

    namespace App\Http\Controllers\BeSparing\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\Users\User;
    use Auth;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Psr\Container\ContainerExceptionInterface;
    use Psr\Container\NotFoundExceptionInterface;

    class BeSparingControllerDashboard extends Controller {
        /**
         * @throws ContainerExceptionInterface
         * @throws NotFoundExceptionInterface
         */
        public function index(Request $request) {
            $dataPlatform = Platform::platformComboByLimit(request()->user()->id_sparing)->with('site')->get();
            if (session()->get('use_sparing') > 1) {
                if (in_array(request()->user()->user_level, ['super_admin', 'admin'])) {
                    return redirect()->intended(route('sparing.dashboard.hasil-pengukuran'));
                } else {
                    return redirect()->intended(route('sparing.dashboard.maps'));
                }
            } else {
                return redirect()->intended(route('sparing.dashboard.maps.summary', [$dataPlatform[0]->uid, $dataPlatform[0]->tipe_logger]));
            }
        }
    }
