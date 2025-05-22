<?php

    namespace App\Http\Controllers\Master\Geo;

    use App\Helper\Hash;
    use App\Http\Controllers\Controller;
    use App\Models\Companies\CompaniesDepartment;
    use App\Models\Companies\CompaniesDesignation;
    use App\Models\Companies\CompaniesEmployeeType;
    use App\Models\Employee\Employee;
    use App\Models\Employee\EmployeeAllowance;
    use App\Models\Employee\EmployeeCommission;
    use App\Models\Employee\EmployeeReimbursement;
    use App\Models\Employee\EmployeePayCut;
    use App\Models\Master\Geo\GeoCity;
    use App\Models\Users\User;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;

    class ControllerGeoCity extends Controller {
        public function getCityByProvId(Request $request) {
            try {
                $dataCity = GeoCity::where('provinsi_id', $request->input('prov-id'))->get();
                return response()->json([
                    'data' => $dataCity,
                    'responseTime' => Carbon::now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
    }
