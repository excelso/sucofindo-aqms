<?php

    namespace App\Http\Controllers\BeSparing\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Platform;
    use Exception;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;

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

        public function handleDataPlatform(Request $request): JsonResponse {
            try {

                $dataUserSite = UserSite::where('user_id', $request->user()->id)->where('status_site', 1)->get();
                $site_ids = [];
                foreach ($dataUserSite as $item) {
                    $site_ids[] = $item->site_id;
                }

                $dataPlatform = Platform::platformBySearch($request->input('search'), $site_ids)
                    ->with('site', 'site.customer')->get();

                return response()->json([
                    'message' => 'Success',
                    'data' => $dataPlatform,
                    'responseTime' => now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function handleDataPlatformMarker(): JsonResponse {
            try {

                $dataPlatform = Platform::platformMarker()
                    ->with('site', 'site.customerLokasi', 'site.customer', 'site.customer.jenisIndustri')
                    ->get();

                return response()->json([
                    'message' => 'Success',
                    'data' => $dataPlatform,
                    'responseTime' => now()
                ], 200, [], JSON_PRETTY_PRINT);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

    }
