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

                $dataUser = User::where('id', Auth::user()->id)->first();
                $dataPlatform = Platform::platformBySearch($dataUser->id_sparing, $request->input('search'))
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

                $dataUser = User::where('id', Auth::user()->id)->first();
                $dataPlatform = Platform::platformMarker($dataUser->id_sparing)
                    ->with('site', 'site.customerLokasi', 'site.customer', 'site.customer.jenisIndustri')
                    ->get()->map(function ($item) {
                        $thumbnail = null;
                        if ($item->thumbnail_path) {
                            if (file_exists(public_path('/storage/' . $item->thumbnail_path . '/' . $item->thumbnail_file))) {
                                $thumbnail = '/storage/' . $item->thumbnail_path . '/' . $item->thumbnail_file;
                            }
                        }

                        return [
                            'platform_type' => 'sparing',
                            'uid' => $item->uid,
                            'lat' => $item->lat,
                            'lng' => $item->lng,
                            'company_name' => $item->site->customerLokasi->customer->nama_perusahaan,
                            'location' => $item->site->customerLokasi->nama_lokasi,
                            'images' => $thumbnail,
                            'status_online' => $item->status_platform ?? 'offline',
                            'tipe_logger' => $item->tipe_logger ?? 1,
                            'total_logger' => $item->total_logger ?? 1,
                        ];
                    });

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
