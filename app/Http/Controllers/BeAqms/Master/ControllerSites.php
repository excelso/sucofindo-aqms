<?php

    namespace App\Http\Controllers\BeAqms\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeAqms\Master\CompaniesSites;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;
    use Throwable;

    class ControllerSites extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/master/data-sites';
        }

        public function index(Request $request): View {
            $dataCompanies = Companies::all();
            $dataSites = CompaniesSites::dataSites([
                'search' => $request->input()
            ]);
            return view($this->viewPath . '/index', [
                'items' => $dataSites->paginate(20)->onEachSide(1),
                'companies' => $dataCompanies,
            ]);
        }

        //region Handle Store
        public function store(Request $request) {
            $validator = Validator::make($request->all(), [
                'site_name' => 'required',
            ], [], [
                'site_name' => 'Site Name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($request) {
                    return CompaniesSites::create([
                        'company_id' => $request->input('company_id'),
                        'site_name' => $request->input('site_name'),
                    ]);
                });

                return response()->json([
                    'message' => 'New Site data saved successfully',
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

        //region Handle Detail Site
        public function handleDetailSite(Request $request, $siteId) {
            try {

                $dataSites = CompaniesSites::where('id', $siteId)->first();

                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $dataSites,
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
        public function update(Request $request, $siteId) {
            $validator = Validator::make($request->all(), [
                'site_name' => 'required',
            ], [], [
                'site_name' => 'Site Name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($request, $siteId) {
                    return CompaniesSites::where('id', $siteId)->update([
                        'company_id' => $request->input('company_id'),
                        'site_name' => $request->input('site_name'),
                    ]);
                });

                return response()->json([
                    'message' => 'Update Site data saved successfully',
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
        public function delete(Request $request, $siteId) {
            try {
                DB::transaction(function () use ($request, $siteId) {
                    return CompaniesSites::where('id', $siteId)->delete();
                });

                return response()->json([
                    'message' => 'Data Site deleted successfully',
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

        //region Handle Data Site
        public function handleDataSite(Request $request) {
            try {

                $dataSites = CompaniesSites::dataSitesByCompanyId($request->input('company_id'))->get();

                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $dataSites,
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
    }
