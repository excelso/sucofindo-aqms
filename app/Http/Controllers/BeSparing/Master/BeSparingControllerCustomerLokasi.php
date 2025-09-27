<?php

    namespace App\Http\Controllers\BeSparing\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Master\Customer;
    use App\Models\BeSparing\Master\CustomerLokasi;
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

    class BeSparingControllerCustomerLokasi extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.master.data-customer-lokasi';
        }

        public function index(Request $request): Factory|View|Application {
            if (request()->user()->user_level != 'super_admin') {
                abort(403, 'Halaman ini hanya untuk Administrator!');
            }

            $dataCustomerLokasi = CustomerLokasi::customerLokasi([
                'search' => $request->input()
            ]);
            $dataCustomer = Customer::get();

            return view($this->viewPath . '/index', [
                'items' => $dataCustomerLokasi->paginate(20),
                'customer' => $dataCustomer,
            ]);
        }

        public function store(Request $request): JsonResponse {
            DB::beginTransaction();
            try {
                $validator = Validator::make($request->all(), [
                    'customer_id' => 'required',
                    'nama_lokasi' => 'required',
                ], [], [
                    'customer_id' => 'Nama Perusahaan',
                    'nama_lokasi' => 'Nama Lokasi',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }

                (new CustomerLokasi)->create([
                    'customer_id' => $request->input('customer_id'),
                    'nama_lokasi' => $request->input('nama_lokasi'),
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Lokasi Baru berhasil disimpan',
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
                    'nama_lokasi' => 'required',
                ], [], [
                    'customer_id' => 'Nama Perusahaan',
                    'nama_lokasi' => 'Nama Lokasi',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }

                (new CustomerLokasi)->where('id', $request->input('lokasi_id'))->update([
                    'customer_id' => $request->input('customer_id'),
                    'nama_lokasi' => $request->input('nama_lokasi'),
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Perubahan data Lokasi berhasil disimpan',
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

                (new CustomerLokasi)->where('id', $request->input('lokasi_id'))->delete();

                DB::commit();
                return response()->json([
                    'message' => 'Data Lokasi berhasil dihapus',
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

        public function handleLokasiByCustomer(Request $request): JsonResponse {
            try {

                $dataSite = (new CustomerLokasi)->where('customer_id', $request->input('customer_id'))
                    ->with('customer', 'customer.jenisIndustri')->get();
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
