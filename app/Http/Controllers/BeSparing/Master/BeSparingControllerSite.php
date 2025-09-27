<?php

    namespace App\Http\Controllers\BeSparing\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Customer;
    use App\Models\BeSparing\Master\Site;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Contracts\View\Factory;
    use Illuminate\Contracts\View\View;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Validation\Rules\Password;

    class BeSparingControllerSite extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.master.data-site';
        }

        public function index(Request $request): Factory|View|Application {
            if (request()->user()->user_level != 'super_admin') {
                abort(403, 'Halaman ini hanya untuk Administrator!');
            }

            $dataSite = Site::site([
                'search' => $request->input()
            ]);
            $dataCustomer = Customer::get();

            return view($this->viewPath . '/index', [
                'items' => $dataSite->paginate(20),
                'customer' => $dataCustomer,
            ]);
        }

        public function store(Request $request): JsonResponse {
            DB::beginTransaction();
            try {
                $validator = Validator::make($request->all(), [
                    'customer_id' => 'required',
                    'customer_lokasi_id' => 'required',
                    'nama_site' => 'required',
                ], [], [
                    'customer_id' => 'Nama Perusahaan',
                    'customer_lokasi_id' => 'Nama Lokasi',
                    'nama_site' => 'Nama Site',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }

                (new Site)->create([
                    'customer_id' => $request->input('customer_id'),
                    'customer_lokasi_id' => $request->input('customer_lokasi_id'),
                    'nama_site' => $request->input('nama_site'),
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Site Baru berhasil disimpan',
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function update(Request $request): JsonResponse {
            DB::beginTransaction();
            try {
                $validator = Validator::make($request->all(), [
                    'customer_id' => 'required',
                    'customer_lokasi_id' => 'required',
                    'nama_site' => 'required',
                ], [], [
                    'customer_id' => 'Nama Perusahaan',
                    'customer_lokasi_id' => 'Nama Lokasi',
                    'nama_site' => 'Nama Site',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }

                (new Site)->where('id', $request->input('site_id'))->update([
                    'customer_id' => $request->input('customer_id'),
                    'customer_lokasi_id' => $request->input('customer_lokasi_id'),
                    'nama_site' => $request->input('nama_site'),
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Perubahan data Site berhasil disimpan',
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function delete(Request $request): JsonResponse {
            DB::beginTransaction();
            try {

                (new Site)->where('id', $request->input('site_id'))->delete();
                (new UserSite)->where('site_id', $request->input('site_id'))->update([
                    'status_site' => 0
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Data Site berhasil dihapus',
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                DB::rollBack();
                return response()->json([
                    'message' => $exception->getMessage(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function handleSiteByCustomerLokasi(Request $request): JsonResponse {
            try {

                $dataSite = (new Site)->where('customer_lokasi_id', $request->input('customer_lokasi_id'))->with('customer', 'customer.jenisIndustri')->get();
                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataSite,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

    }
