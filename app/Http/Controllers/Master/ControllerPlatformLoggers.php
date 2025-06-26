<?php

    namespace App\Http\Controllers\Master;

    use App\Http\Controllers\Controller;
    use App\Models\Master\Companies;
    use App\Models\Master\CompaniesSites;
    use App\Models\Master\Platforms;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rule;
    use Illuminate\View\View;
    use Throwable;

    class ControllerPlatformLoggers extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/master/data-platform-loggers';
        }

        public function index(): View {
            $dataCompanies = Companies::all();
            $dataPlatforms = Platforms::dataPlatforms();
            return view($this->viewPath . '/index', [
                'items' => $dataPlatforms->paginate(20)->onEachSide(1),
                'companies' => $dataCompanies,
            ]);
        }

        //region Handle Store
        public function store(Request $request) {
            $validator = Validator::make($request->all(), [
                'company_site_id' => 'required',
                'uid' => [
                    'required',
                    function ($attribute, $value, $fail) {
                        $exists = Platforms::where('uid', $value)->exists();
                        if ($exists) {
                            $fail('UID has been registered before.');
                        }
                    }
                ],
                'cctv_link' => 'nullable|url',
            ], [], [
                'company_site_id' => 'Site Name',
                'uid' => 'UID',
                'cctv_link' => 'CCTV Link',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($request) {
                    return Platforms::create([
                        'company_site_id' => $request->input('company_site_id'),
                        'uid' => $request->input('uid'),
                        'cctv_link' => $request->input('cctv_link'),
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

                $detailPlatform = Platforms::dataPlatformsById($platformId)->first();
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
                'cctv_link' => 'nullable|url',
            ], [], [
                'company_site_id' => 'Site Name',
                'uid' => 'UID',
                'cctv_link' => 'CCTV Link',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($platformId, $request) {
                    return Platforms::where('id', $platformId)->update([
                        'company_site_id' => $request->input('company_site_id'),
                        'uid' => $request->input('uid'),
                        'cctv_link' => $request->input('cctv_link'),
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
    }
