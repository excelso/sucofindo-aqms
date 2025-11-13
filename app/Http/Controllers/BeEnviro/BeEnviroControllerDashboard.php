<?php

    namespace App\Http\Controllers\BeEnviro;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\AqiCategories;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsHeartbeat;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\Users\UserPlatforms;
    use Auth;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use File;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Cache;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;

    class BeEnviroControllerDashboard extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-enviro.dashboard';
        }

        // region Index
        public function index(Request $request) {
            $env = config('app.env');
            return view($this->viewPath . '.index', [
                'env' => $env
            ]);
        }
        // endregion

        //region Handle Data Platforms
        public function handleDataPlatforms(Request $request) {
            try {

                $onlineCount = 0;
                $offlineCount = 0;
                $totalCount = 0;
                if ($request->input('titleType') == 'SPARING') {
                    $dataLogger = Platform::platformBySearch(request()->user()->id_sparing, $request->input('heartbeatStatus'), $request->input('search'))->with([
                        'site:id,nama_site,customer_lokasi_id',
                        'site.customerLokasi:id,customer_id,nama_lokasi',
                        'site.customerLokasi.customer:id,nama_perusahaan'
                    ])->get();

                    $dataLogger = Platform::platformBySearch(request()->user()->id_sparing, $request->input('heartbeatStatus'), $request->input('search'))->with([
                        'site:id,nama_site,customer_lokasi_id',
                        'site.customerLokasi:id,customer_id,nama_lokasi',
                        'site.customerLokasi.customer:id,nama_perusahaan'
                    ])->get();

                    $dataLoggerStatus = Platform::platformBySearch(request()->user()->id_sparing)->get();
                    $onlineCount = $dataLoggerStatus->where('status_platform', 'online')->count();
                    $offlineCount = $dataLoggerStatus->where('status_platform', 'offline')->count();
                    $totalCount = $dataLoggerStatus->count();
                } else {
                    $userPlatformId = null;
                    $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->get();
                    foreach ($userPlatformIds as $platformId) {
                        $userPlatformId[] = $platformId->platform_id;
                    }

                    $dataLogger = Platforms::dataPlatformSearchByUserPlatform($userPlatformId, $request->input('heartbeatStatus'))
                        ->with([
                            'sites',
                            'sites.companies',
                            'sitesLocation'
                        ])->get();

                    $dataLoggerStatus = Platforms::dataPlatformSearchByUserPlatform($userPlatformId)->get();
                    $onlineCount = $dataLoggerStatus->where('heartbeat_status', 'online')->count();
                    $offlineCount = $dataLoggerStatus->where('heartbeat_status', 'offline')->count();
                    $totalCount = $dataLoggerStatus->count();
                }

                return response()->json([
                    'userLevel' => Auth::user()->user_level ?? '',
                    'onlineCount' => $onlineCount,
                    'offlineCount' => $offlineCount,
                    'data' => $dataLogger,
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Platforms Marker
        public function handleDataPlatformsMarker(Request $request) {
            try {

                $dataPlatformSparing = Platform::platformMarker(request()->user()->id_sparing)->with([
                    'site:id,nama_site,customer_lokasi_id',
                    'site.customerLokasi:id,customer_id,nama_lokasi',
                    'site.customerLokasi.customer:id,nama_perusahaan'
                ])->get()->map(function ($item) {

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

                $userPlatformIds = UserPlatforms::userPlatforms($request->user()->id)
                    ->pluck('platform_id');
                $userPlatformId = $userPlatformIds->toArray();

                $dataPlatformAqms = Platforms::dataPlatformSearchByUserPlatform($userPlatformId)->get()->map(function ($item) {

                        $thumbnail = null;
                        if ($item->thumbnail_path) {
                            if (file_exists(public_path('/storage/' . $item->thumbnail_path . '/' . $item->thumbnail_file))) {
                                $thumbnail = '/storage/' . $item->thumbnail_path . '/' . $item->thumbnail_file;
                            }
                        }

                        return [
                            'platform_type' => 'aqms',
                            'uid' => $item->uid,
                            'lat' => $item->lat,
                            'lng' => $item->lng,
                            'company_name' => $item->sites->companies->company_name,
                            'location' => $item->sites->site_name,
                            'images' => $thumbnail,
                            'status_online' => $item->heartbeat_status ?? 'offline',
                            'tipe_logger' => $item->tipe_logger ?? 1,
                            'total_logger' => 1,
                        ];
                    });

                $mergedData = $dataPlatformSparing->keyBy('uid')
                    ->merge($dataPlatformAqms->keyBy('uid'))
                    ->values();

                return response()->json([
                    'userLevel' => Auth::user()->user_level ?? '',
                    'data' => $mergedData,
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

    }
