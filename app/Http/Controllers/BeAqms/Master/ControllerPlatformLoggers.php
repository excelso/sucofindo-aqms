<?php

    namespace App\Http\Controllers\BeAqms\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\LoggersLimit;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsCalibration;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;
    use Throwable;

    class ControllerPlatformLoggers extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/master/data-platform-loggers';
        }

        public function index(): View {
            $dataCompanies = Companies::all();
            $dataPlatforms = Platforms::dataPlatforms([
                'search' => request()->input()
            ]);
            return view($this->viewPath . '/index', [
                'items' => $dataPlatforms->paginate(20)->onEachSide(1),
                'companies' => $dataCompanies,
            ]);
        }

        //region Handle Store
        public function store(Request $request) {
            $validator = Validator::make($request->all(), [
                'company_site_id' => 'required',
                'company_site_location_id' => 'required',
                'uid' => [
                    'required',
                    function ($attribute, $value, $fail) {
                        $exists = Platforms::where('uid', $value)->exists();
                        if ($exists) {
                            $fail('UID has been registered before.');
                        }
                    }
                ],
                'uid_alias' => 'required',
                'cctv_link_1' => 'nullable|url',
                'cctv_link_2' => 'nullable|url',
                'cctv_link_hls' => 'nullable|url',
                'timezone' => 'required',
                'cctv_portal_ip' => [
                    'nullable',
                    'regex:/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]{1,5})?$/',
                    function ($attribute, $value, $fail) {
                        if (empty($value)) return;

                        $parts = explode(':', $value);
                        $ip = $parts[0];

                        // Validasi IP menggunakan filter_var untuk memastikan IP valid
                        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                            $fail('IP address tidak valid.');
                        }
                    }
                ],
            ], [], [
                'company_site_id' => 'Site Name',
                'company_site_location_id' => 'Location Name',
                'uid' => 'UID',
                'uid_alias' => 'Platform Name',
                'cctv_link' => 'CCTV Link (RTC)',
                'cctv_link_hls' => 'CCTV Link (HLS)',
                'timezone' => 'Timezone',
                'cctv_portal_ip' => 'CCTV Portal IP',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($request) {
                    Platforms::create([
                        'company_site_id' => $request->input('company_site_id'),
                        'company_site_location_id' => $request->input('company_site_location_id'),
                        'uid' => $request->input('uid'),
                        'uid_alias' => $request->input('uid_alias'),
                        'cctv_link_1' => $request->input('cctv_link_1'),
                        'cctv_1_support_ptz' => $request->input('cctv_1_support_ptz'),
                        'cctv_link_2' => $request->input('cctv_link_2'),
                        'cctv_2_support_ptz' => $request->input('cctv_2_support_ptz'),
                        'cctv_link_hls' => $request->input('cctv_link_hls'),
                        'timezone' => $request->input('timezone'),
                        'lat' => $request->input('lat'),
                        'lng' => $request->input('lng'),
                        'cctv_portal_ip' => $request->input('cctv_portal_ip'),
                        'cctv_portal_username' => $request->input('cctv_portal_username'),
                        'cctv_portal_password' => $request->input('cctv_portal_password'),
                    ]);

                    LoggersLimit::create([
                        'uid', $request->input('uid'),
                        'pm10_min' => $request->input('pm10_min'),
                        'pm10_min_buffer' => $request->input('pm10_min_buffer'),
                        'pm10_max_buffer' => $request->input('pm10_max_buffer'),
                        'pm10_max' => $request->input('pm10_max'),
                        'pm25_min' => $request->input('pm25_min'),
                        'pm25_min_buffer' => $request->input('pm25_min_buffer'),
                        'pm25_max_buffer' => $request->input('pm25_max_buffer'),
                        'pm25_max' => $request->input('pm25_max'),
                        'tsp_min' => $request->input('tsp_min'),
                        'tsp_min_buffer' => $request->input('tsp_min_buffer'),
                        'tsp_max_buffer' => $request->input('tsp_max_buffer'),
                        'tsp_max' => $request->input('tsp_max'),
                        'noise_min' => $request->input('noise_min'),
                        'noise_min_buffer' => $request->input('noise_min_buffer'),
                        'noise_max_buffer' => $request->input('noise_max_buffer'),
                        'noise_max' => $request->input('noise_max'),
                    ]);
                });

                return response()->json([
                    'message' => 'New Platform data saved successfully',
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Detail Platform
        public function handleDetailPlatform($platformId) {
            try {

                $detailPlatform = Platforms::dataPlatformsById($platformId)
                    ->with('loggerLimit')->first();
                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $detailPlatform,
                    'responseTime' => Carbon::now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Update
        public function update(Request $request, $platformId) {
            $validator = Validator::make($request->all(), [
                'company_site_id' => 'required',
                'company_site_location_id' => 'required',
                'uid' => [
                    'required',
                    function ($attribute, $value, $fail) use ($request) {
                        if ($request->input('uid_old') != $value) {
                            $exists = Platforms::where('uid', $value)->exists();
                            if ($exists) {
                                $fail('UID has been registered before.');
                            }
                        }
                    }
                ],
                'uid_alias' => 'required',
                'cctv_link_1' => 'nullable|url',
                'cctv_link_2' => 'nullable|url',
                'cctv_link_hls' => 'nullable|url',
                'timezone' => 'required',
                'cctv_portal_ip' => [
                    'nullable',
                    'regex:/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]{1,5})?$/',
                    function ($attribute, $value, $fail) {
                        if (empty($value)) return;

                        $parts = explode(':', $value);
                        $ip = $parts[0];

                        // Validasi IP menggunakan filter_var untuk memastikan IP valid
                        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                            $fail('IP address tidak valid.');
                        }
                    }
                ],
            ], [], [
                'company_site_id' => 'Site Name',
                'company_site_location_id' => 'Location Name',
                'uid' => 'UID',
                'uid_alias' => 'Platform Name',
                'cctv_link' => 'CCTV Link (RTC)',
                'cctv_link_hls' => 'CCTV Link (HLS)',
                'timezone' => 'Timezone',
                'cctv_portal_ip' => 'CCTV Portal IP',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {

                DB::transaction(function () use ($platformId, $request) {
                    Platforms::where('id', $platformId)->update([
                        'company_site_id' => $request->input('company_site_id'),
                        'company_site_location_id' => $request->input('company_site_location_id'),
                        'uid' => $request->input('uid'),
                        'uid_alias' => $request->input('uid_alias'),
                        'cctv_link_1' => $request->input('cctv_link_1'),
                        'cctv_1_support_ptz' => $request->input('cctv_1_support_ptz'),
                        'cctv_link_2' => $request->input('cctv_link_2'),
                        'cctv_2_support_ptz' => $request->input('cctv_2_support_ptz'),
                        'cctv_link_hls' => $request->input('cctv_link_hls'),
                        'timezone' => $request->input('timezone'),
                        'lat' => $request->input('lat'),
                        'lng' => $request->input('lng'),
                        'cctv_portal_ip' => $request->input('cctv_portal_ip'),
                        'cctv_portal_username' => $request->input('cctv_portal_username'),
                        'cctv_portal_password' => $request->input('cctv_portal_password'),
                    ]);

                    LoggersLimit::updateOrCreate(['uid' => $request->input('uid')], [
                        'pm10_min' => $request->input('pm10_min'),
                        'pm10_min_buffer' => $request->input('pm10_min_buffer'),
                        'pm10_max_buffer' => $request->input('pm10_max_buffer'),
                        'pm10_max' => $request->input('pm10_max'),
                        'pm25_min' => $request->input('pm25_min'),
                        'pm25_min_buffer' => $request->input('pm25_min_buffer'),
                        'pm25_max_buffer' => $request->input('pm25_max_buffer'),
                        'pm25_max' => $request->input('pm25_max'),
                        'tsp_min' => $request->input('tsp_min'),
                        'tsp_min_buffer' => $request->input('tsp_min_buffer'),
                        'tsp_max_buffer' => $request->input('tsp_max_buffer'),
                        'tsp_max' => $request->input('tsp_max'),
                        'noise_min' => $request->input('noise_min'),
                        'noise_min_buffer' => $request->input('noise_min_buffer'),
                        'noise_max_buffer' => $request->input('noise_max_buffer'),
                        'noise_max' => $request->input('noise_max'),
                    ]);
                });

                return response()->json([
                    'message' => 'Update Platform data saved successfully',
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Delete
        public function delete(Request $request, $platformId) {
            try {
                DB::transaction(function () use ($platformId, $request) {
                    return Platforms::where('id', $platformId)->delete();
                });

                return response()->json([
                    'message' => 'Platform data deleted successfully',
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            } catch (Throwable $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion

        //region Handle Page Calibration
        public function calibration($platformId): View {
            $dataPlatformsCalibration = PlatformsCalibration::paginate(20)->onEachSide(1);
            return view($this->viewPath . '/calibration/index', [
                'items' => $dataPlatformsCalibration,
            ]);
        }
        //endregion

        public function calibrationInit($platformId) {
            try {

                $dataPlatform = Platforms::where('id', $platformId)->first();

                $minDate = Carbon::now()->subDays(7)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->subDays(1)->format('Y-m-d') . ' 23:59';
                $dataLogger = Loggers::loggerDataDaily($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone)->get();

                $data = [];
                foreach ($dataLogger as $logger) {
                    $data[] = [
                        'uid' => $logger->uid,
                        'date_period' => $logger->tanggal,
                        'pm25' => $logger->pm_25,
                        'pm10' => $logger->pm_10,
                        'tsp' => $logger->tsp,
                    ];
                }

                return response()->json([
                    'message' => 'Platform data deleted successfully',
                    'data' => $data,
                    'responseTime' => Carbon::now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
    }
