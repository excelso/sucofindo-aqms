<?php

    namespace App\Http\Controllers\BeAqms\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeAqms\Master\CompaniesSitesLocation;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;
    use Throwable;

    class ControllerSitesLocation extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/master/data-sites-location';
        }

        public function index(Request $request): View {
            $dataCompanies = Companies::all();
            $dataSitesLocation = CompaniesSitesLocation::dataSitesLocation([
                'search' => $request->input()
            ]);
            return view($this->viewPath . '/index', [
                'items' => $dataSitesLocation->paginate(20)->onEachSide(1),
                'companies' => $dataCompanies,
            ]);
        }

        //region Handle Store
        public function store(Request $request) {
            $validator = Validator::make($request->all(), [
                'company_site_id' => 'required',
                'location_name' => 'required',
            ], [], [
                'company_site_id' => 'Site Name',
                'location_name' => 'Location Name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($request) {
                    return CompaniesSitesLocation::create([
                        'company_site_id' => $request->input('company_site_id'),
                        'location_name' => $request->input('location_name'),
                    ]);
                });

                return response()->json([
                    'message' => 'New Location data saved successfully',
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

        //region Handle Detail Location
        public function handleDetailLocation(Request $request, $locationId) {
            try {

                $dataLocation = CompaniesSitesLocation::where('id', $locationId)
                    ->with('sites:id,company_id')->first();

                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $dataLocation,
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
        public function update(Request $request, $locationId) {
            $validator = Validator::make($request->all(), [
                'company_site_id' => 'required',
                'location_name' => 'required',
            ], [], [
                'company_site_id' => 'Site Name',
                'location_name' => 'Location Name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errorValidation' => $validator->errors(),
                    'responseTime' => now()
                ], 400);
            }

            try {
                DB::transaction(function () use ($request, $locationId) {
                    return CompaniesSitesLocation::where('id', $locationId)->update([
                        'company_site_id' => $request->input('company_site_id'),
                        'location_name' => $request->input('location_name'),
                    ]);
                });

                return response()->json([
                    'message' => 'Update Location data saved successfully',
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
        public function delete(Request $request, $locationId) {
            try {
                DB::transaction(function () use ($request, $locationId) {
                    return CompaniesSitesLocation::where('id', $locationId)->delete();
                });

                return response()->json([
                    'message' => 'Data Location deleted successfully',
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

        //region Handle Data Location
        public function handleDataLocation(Request $request) {
            try {

                $dataSitesLocation = CompaniesSitesLocation::dataSitesLocationBySiteId($request->input('site_id'))->get();

                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $dataSitesLocation,
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
