<?php

    namespace App\Http\Controllers\BeSparing\Master;

    use App\Http\Controllers\Controller;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Customer;
    use App\Models\BeSparing\Master\JenisIndustri;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\ParameterRange;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\BeSparing\Master\PlatformDokumen;
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
    use Illuminate\Support\Facades\Http;
    use Illuminate\Support\Facades\Storage;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Support\Str;
    use Illuminate\Validation\Rule;
    use Illuminate\Validation\Rules\Password;

    class BeSparingControllerLogger extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.master.data-logger';
        }

        public function index(Request $request): Factory|View|Application {
            if (!in_array(request()->user()->user_level, ['super_admin', 'admin'])) {
                abort(403, 'Halaman ini hanya untuk Administrator!');
            }

            $dataUserSite = UserSite::where('user_id', request()->user()->id)->where('status_site', 1)->get();
            $site_ids = [];
            foreach ($dataUserSite as $item) {
                $site_ids[] = $item->site_id;
            }

            $dataPlatform = Platform::platform([
                'search' => $request->input(),
                'siteId' => $site_ids
            ])->with(['paramLimit', 'paramRange', 'dokumen']);

            $dataCustomer = Customer::with('jenisIndustri')->get();
            $dataSite = Site::get();
            $dataJenisIndustri = JenisIndustri::get();

            return view($this->viewPath . '/index', [
                'items' => $dataPlatform->paginate(20),
                'customer' => $dataCustomer,
                'site' => $dataSite,
                'jenisIndustri' => $dataJenisIndustri,
            ]);
        }

        //region Handle Store
        public function store(Request $request): JsonResponse {
            DB::beginTransaction();
            try {

                $rules = [
                    'customer_id' => 'required',
                    'customer_lokasi_id' => 'required',
                    'site_id' => [
                        'required',
                        // Rule::unique('t_platform')->where('site_id', $request->input('site_id'))
                    ],
                    'tipe_logger' => 'required',
                    'uid' => [
                        'required',
                        Rule::unique('t_platform')->where('uid', $request->input('uid'))
                            ->where('tipe_logger', $request->input('tipe_logger'))
                            ->whereNull('deleted_at')
                    ],
                    'lokasi_platform' => 'required',
                ];

                if ($request->input('tipe_param') == 1) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'tss_warn' => 'required',
                        'tss_warn_min' => 'required',
                        'tss_mutu_min' => 'required',
                        'tss_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                } else if ($request->input('tipe_param') == 2) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'cod_warn' => 'required',
                        'cod_warn_min' => 'required',
                        'cod_mutu_min' => 'required',
                        'cod_mutu' => 'required',
                        'tss_warn' => 'required',
                        'tss_warn_min' => 'required',
                        'tss_mutu_min' => 'required',
                        'tss_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                } else if ($request->input('tipe_param') == 3) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'cod_warn' => 'required',
                        'cod_warn_min' => 'required',
                        'cod_mutu_min' => 'required',
                        'cod_mutu' => 'required',
                        'nh3n_warn' => 'required',
                        'nh3n_warn_min' => 'required',
                        'nh3n_mutu_min' => 'required',
                        'nh3n_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                } else if ($request->input('tipe_param') == 4) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'cod_warn' => 'required',
                        'cod_warn_min' => 'required',
                        'cod_mutu_min' => 'required',
                        'cod_mutu' => 'required',
                        'tss_warn' => 'required',
                        'tss_warn_min' => 'required',
                        'tss_mutu_min' => 'required',
                        'tss_mutu' => 'required',
                        'nh3n_warn' => 'required',
                        'nh3n_warn_min' => 'required',
                        'nh3n_mutu_min' => 'required',
                        'nh3n_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                }

                $validator = Validator::make($request->all(), $rules, [], [
                    'customer_id' => 'Nama Perusahaan',
                    'customer_lokasi_id' => 'Nama Lokasi',
                    'site_id' => 'Nama Site',
                    'tipe_logger' => 'Tipe Logger',
                    'uid' => 'UID',
                    'serial_number' => 'Serial Number',
                    'lokasi_platform' => 'Lokasi Platform',
                    'ph_mutu_min' => 'Low Mutu',
                    'ph_mutu_max' => 'High Mutu',
                    'ph_warn_min' => 'Low Warn',
                    'ph_warn_max' => 'High Warn',
                    'cod_warn' => 'Low Mutu',
                    'cod_warn_min' => 'Low Warn',
                    'cod_mutu_min' => 'High Warn',
                    'cod_mutu' => 'High Mutu',
                    'tss_warn' => 'Low Mutu',
                    'tss_warn_min' => 'Low Warn',
                    'tss_mutu_min' => 'High Warn',
                    'tss_mutu' => 'High Mutu',
                    'nh3n_warn' => 'Low Mutu',
                    'nh3n_warn_min' => 'Low Warn',
                    'nh3n_mutu_min' => 'High Warn',
                    'nh3n_mutu' => 'High Mutu',
                    'debit_warn' => 'Low Mutu',
                    'debit_warn_min' => 'Low Warn',
                    'debit_mutu_min' => 'High Warn',
                    'debit_mutu' => 'High Mutu',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }


                $splitLokasiPlatform = explode(',', $request->input('lokasi_platform'));
                $lokasiPlatform = $splitLokasiPlatform;

                $uniqueId = Str::random(9);
                $platform = (new Platform)->create([
                    'monitor_uniq_id' => $uniqueId,
                    'customer_id' => $request->input('customer_id'),
                    'site_id' => $request->input('site_id'),
                    'tipe_logger' => $request->input('tipe_logger'),
                    'uid' => $request->input('uid'),
                    'catchment_area' => $request->input('catchment_area'),
                    'badan_air' => $request->input('badan_air'),
                    'serial_number' => $request->input('serial_number'),
                    'lat' => trim($lokasiPlatform[0]) ?? 0,
                    'lng' => trim($lokasiPlatform[1]) ?? 0,
                    'alamat_platform' => $request->input('alamat_platform'),
                    'nomor_gsm_modem' => $request->input('nomor_gsm_modem'),
                    'tanggal_pengisian_modem' => $request->input('tanggal_pengisian_modem'),
                    'status_validasi' => 'Suspend',
                ]);

                if ($request->input('tipe_param') == 1) {
                    (new ParameterLimit)->create([
                        'uid' => $request->input('uid'),
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'tss_warn' => $request->input('tss_warn'),
                        'tss_warn_min' => $request->input('tss_warn_min'),
                        'tss_mutu_min' => $request->input('tss_mutu_min'),
                        'tss_mutu' => $request->input('tss_mutu'),
                        'tss_intermit' => $request->input('tss_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                        'tipe_logger' => $request->input('tipe_logger'),
                    ]);

                    (new ParameterRange)->updateOrCreate([
                        'uid' => $request->input('uid'),
                        'tipe_logger' => $request->input('tipe_logger')
                    ], [
                        'ph_re_warn_min' => $request->input('ph_re_warn_min'),
                        'ph_re_warn_max' => $request->input('ph_re_warn_max'),
                        'ph_bottom_min' => $request->input('ph_bottom_min'),
                        'ph_bottom_max' => $request->input('ph_bottom_max'),
                        'ph_upper_min' => $request->input('ph_upper_min'),
                        'ph_upper_max' => $request->input('ph_upper_max'),
                        'tss_re_warn_min' => $request->input('tss_re_warn_min'),
                        'tss_re_warn_max' => $request->input('tss_re_warn_max'),
                        'tss_bottom_min' => $request->input('tss_bottom_min'),
                        'tss_bottom_max' => $request->input('tss_bottom_max'),
                        'tss_upper_min' => $request->input('tss_upper_min'),
                        'tss_upper_max' => $request->input('tss_upper_max'),
                        'debit_re_warn_min' => $request->input('debit_re_warn_min'),
                        'debit_re_warn_max' => $request->input('debit_re_warn_max'),
                        'debit_bottom_min' => $request->input('debit_bottom_min'),
                        'debit_bottom_max' => $request->input('debit_bottom_max'),
                        'debit_upper_min' => $request->input('debit_upper_min'),
                        'debit_upper_max' => $request->input('debit_upper_max'),
                    ]);
                } else if ($request->input('tipe_param') == 2) {
                    (new ParameterLimit)->create([
                        'uid' => $request->input('uid'),
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'cod_warn' => $request->input('cod_warn'),
                        'cod_warn_min' => $request->input('cod_warn_min'),
                        'cod_mutu_min' => $request->input('cod_mutu_min'),
                        'cod_mutu' => $request->input('cod_mutu'),
                        'cod_intermit' => $request->input('cod_intermit'),
                        'tss_warn' => $request->input('tss_warn'),
                        'tss_warn_min' => $request->input('tss_warn_min'),
                        'tss_mutu_min' => $request->input('tss_mutu_min'),
                        'tss_mutu' => $request->input('tss_mutu'),
                        'tss_intermit' => $request->input('tss_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                        'tipe_logger' => $request->input('tipe_logger'),
                    ]);
                } else if ($request->input('tipe_param') == 3) {
                    (new ParameterLimit)->create([
                        'uid' => $request->input('uid'),
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'cod_warn' => $request->input('cod_warn'),
                        'cod_warn_min' => $request->input('cod_warn_min'),
                        'cod_mutu_min' => $request->input('cod_mutu_min'),
                        'cod_mutu' => $request->input('cod_mutu'),
                        'cod_intermit' => $request->input('cod_intermit'),
                        'nh3n_warn' => $request->input('nh3n_warn'),
                        'nh3n_warn_min' => $request->input('nh3n_warn_min'),
                        'nh3n_mutu_min' => $request->input('nh3n_mutu_min'),
                        'nh3n_mutu' => $request->input('nh3n_mutu'),
                        'nh3n_intermit' => $request->input('nh3n_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                        'tipe_logger' => $request->input('tipe_logger'),
                    ]);
                } else if ($request->input('tipe_param') == 4) {
                    (new ParameterLimit)->create([
                        'uid' => $request->input('uid'),
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'cod_warn' => $request->input('cod_warn'),
                        'cod_warn_min' => $request->input('cod_warn_min'),
                        'cod_mutu_min' => $request->input('cod_mutu_min'),
                        'cod_mutu' => $request->input('cod_mutu'),
                        'cod_intermit' => $request->input('cod_intermit'),
                        'tss_warn' => $request->input('tss_warn'),
                        'tss_warn_min' => $request->input('tss_warn_min'),
                        'tss_mutu_min' => $request->input('tss_mutu_min'),
                        'tss_mutu' => $request->input('tss_mutu'),
                        'tss_intermit' => $request->input('tss_intermit'),
                        'nh3n_warn' => $request->input('nh3n_warn'),
                        'nh3n_warn_min' => $request->input('nh3n_warn_min'),
                        'nh3n_mutu_min' => $request->input('nh3n_mutu_min'),
                        'nh3n_mutu' => $request->input('nh3n_mutu'),
                        'nh3n_intermit' => $request->input('nh3n_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                        'tipe_logger' => $request->input('tipe_logger'),
                    ]);
                }

                (new ParameterRange)->updateOrCreate([
                    'uid' => $request->input('uid'),
                    'tipe_logger' => $request->input('tipe_logger')
                ], [
                    'tipe_monitor' => $request->input('tipe_monitor'),
                ]);

                if ($request->input('nama_dokumen') !== null) {
                    for ($i = 0; $i < count($request->input('nama_dokumen')); $i++) {
                        if ($request->hasFile('files.' . $i)) {
                            $fileOriginalName = pathinfo($request->file('files')[$i]->getClientOriginalName(), PATHINFO_FILENAME);
                            $fileExtension = pathinfo($request->file('files')[$i]->getClientOriginalName(), PATHINFO_EXTENSION);
                            $fileName = $fileOriginalName . '-' . time() . '.' . $fileExtension;
                            $lengthId = strlen($platform->id) <= 11 ? 11 : 1;
                            $idPathNumber = str_pad($platform->id, $lengthId, "0", STR_PAD_LEFT);
                            $path = 'platforms/' . $idPathNumber . '/documents';

                            $request->file('files')[$i]->storeAs('public/' . $path . '/', $fileName);

                            (new PlatformDokumen)->create([
                                'platform_id' => $platform->id,
                                'platform_uid' => $platform->uid,
                                'nama_dokumen' => $request->input('nama_dokumen')[$i],
                                'lokasi_file' => $path,
                                'nama_file' => $fileName,
                                'tipe_file' => $request->file('files')[$i]->getMimeType(),
                                'ukuran_file' => $request->file('files')[$i]->getSize(),
                            ]);
                        }
                    }
                }

                // $dataSite = (new Site)->where('id', $request->input('site_id'))->get()->first();
                // $requestValidation = Http::post(env('SCIFI_URL') . '/api/v1/logger-member/request-validation', [
                //     'uid' => $request->input('uid'),
                //     'nama_site' => $dataSite->nama_site,
                //     'nama_perusahaan' => 'PT. Berau Coal',
                //     'tipe_logger' => $request->input('tipe_logger'),
                //     'endpoint_update' => env('APP_URL') . '/api/platform/remote/update',
                //     'endpoint_delete' => env('APP_URL') . '/api/platform/remote/delete',
                //     'logger_no_registered' => env('SCIFI_LOGGER_NO_REGISTERED', ''),
                // ]);
                //
                // if ($requestValidation->status() != 200) {
                //     $responseMessage = $requestValidation->json('message');
                //     if (!isset($responseMessage)) {
                //         $responseMessage = $requestValidation->reason();
                //     }
                //
                //     return response()->json([
                //         'message' => 'Request Validation Error: ' . $responseMessage,
                //         'responseTime' => now()
                //     ], 500);
                // }

                DB::commit();
                return response()->json([
                    'message' => 'Logger Baru berhasil disimpan',
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
        //endregion

        //region Handle Update
        public function update(Request $request): JsonResponse {
            DB::beginTransaction();
            try {

                $rules = [
                    'customer_id' => 'required',
                    'customer_lokasi_id' => 'required',
                    'lokasi_platform' => 'required',
                    'tipe_logger' => 'required',
                ];

                $rules = array_merge($rules, [
                    'site_id' => [
                        'required',
                        // Rule::unique('t_platform')->where('site_id', $request->input('site_id'))
                    ],
                ]);

                if ($request->input('uid') != $request->input('uid_old')) {
                    $rules = array_merge($rules, [
                        'uid' => [
                            'required',
                            Rule::unique('t_platform')->where('uid', $request->input('uid'))
                                ->where('tipe_logger', $request->input('tipe_logger'))
                                ->whereNull('deleted_at')
                        ],
                    ]);
                }

                if ($request->input('tipe_param') == 1) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'tss_warn' => 'required',
                        'tss_warn_min' => 'required',
                        'tss_mutu_min' => 'required',
                        'tss_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                } else if ($request->input('tipe_param') == 2) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'cod_warn' => 'required',
                        'cod_warn_min' => 'required',
                        'cod_mutu_min' => 'required',
                        'cod_mutu' => 'required',
                        'tss_warn' => 'required',
                        'tss_warn_min' => 'required',
                        'tss_mutu_min' => 'required',
                        'tss_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                } else if ($request->input('tipe_param') == 3) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'cod_warn' => 'required',
                        'cod_warn_min' => 'required',
                        'cod_mutu_min' => 'required',
                        'cod_mutu' => 'required',
                        'nh3n_warn' => 'required',
                        'nh3n_warn_min' => 'required',
                        'nh3n_mutu_min' => 'required',
                        'nh3n_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                } else if ($request->input('tipe_param') == 4) {
                    $rules = array_merge($rules, [
                        'ph_mutu_min' => 'required',
                        'ph_mutu_max' => 'required',
                        'ph_warn_min' => 'required',
                        'ph_warn_max' => 'required',
                        'cod_warn' => 'required',
                        'cod_warn_min' => 'required',
                        'cod_mutu_min' => 'required',
                        'cod_mutu' => 'required',
                        'tss_warn' => 'required',
                        'tss_warn_min' => 'required',
                        'tss_mutu_min' => 'required',
                        'tss_mutu' => 'required',
                        'nh3n_warn' => 'required',
                        'nh3n_warn_min' => 'required',
                        'nh3n_mutu_min' => 'required',
                        'nh3n_mutu' => 'required',
                        'debit_warn' => 'required',
                        'debit_warn_min' => 'required',
                        'debit_mutu_min' => 'required',
                        'debit_mutu' => 'required',
                    ]);
                }

                $validator = Validator::make($request->all(), $rules, [], [
                    'customer_id' => 'Nama Perusahaan',
                    'customer_lokasi_id' => 'Nama Lokasi',
                    'site_id' => 'Nama Site',
                    'tipe_logger' => 'Tipe Logger',
                    'uid' => 'UID',
                    'serial_number' => 'Serial Number',
                    'lokasi_platform' => 'Lokasi Platform',
                    'ph_mutu_min' => 'Low Mutu',
                    'ph_mutu_max' => 'High Mutu',
                    'ph_warn_min' => 'Low Warn',
                    'ph_warn_max' => 'High Warn',
                    'cod_warn' => 'Low Mutu',
                    'cod_warn_min' => 'Low Warn',
                    'cod_mutu_min' => 'High Warn',
                    'cod_mutu' => 'High Mutu',
                    'tss_warn' => 'Low Mutu',
                    'tss_warn_min' => 'Low Warn',
                    'tss_mutu_min' => 'High Warn',
                    'tss_mutu' => 'High Mutu',
                    'nh3n_warn' => 'Low Mutu',
                    'nh3n_warn_min' => 'Low Warn',
                    'nh3n_mutu_min' => 'High Warn',
                    'nh3n_mutu' => 'High Mutu',
                    'debit_warn' => 'Low Mutu',
                    'debit_warn_min' => 'Low Warn',
                    'debit_mutu_min' => 'High Warn',
                    'debit_mutu' => 'High Mutu',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'errorValidation' => $validator->errors(),
                        'responseTime' => now()
                    ], 400);
                }


                $splitLokasiPlatform = explode(',', $request->input('lokasi_platform'));
                $lokasiPlatform = $splitLokasiPlatform;

                $filename = null;
                $filepath = null;
                if ($request->hasFile('file_thumbnail')) {
                    $file = $request->file('file_thumbnail');
                    $filename = $request->input('uid') . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $filepath = 'platforms/sparing/' . $request->input('uid') . '/images';
                    $file->storeAs($filepath, $filename, 'public');
                }

                (new Platform)
                    ->where('uid', $request->input('uid_old'))
                    ->where('tipe_logger', $request->input('tipe_logger'))
                    ->update([
                        'customer_id' => $request->input('customer_id'),
                        'site_id' => $request->input('site_id'),
                        'tipe_logger' => $request->input('tipe_logger'),
                        'uid' => $request->input('uid'),
                        'catchment_area' => $request->input('catchment_area'),
                        'badan_air' => $request->input('badan_air'),
                        'serial_number' => $request->input('serial_number'),
                        'thumbnail_path' => $filepath,
                        'thumbnail_file' => $filename,
                        'lat' => trim($lokasiPlatform[0]) ?? 0,
                        'lng' => trim($lokasiPlatform[1]) ?? 0,
                        'alamat_platform' => $request->input('alamat_platform'),
                        'nomor_gsm_modem' => $request->input('nomor_gsm_modem'),
                        'tanggal_pengisian_modem' => $request->input('tanggal_pengisian_modem'),
                    ]);

                if ($request->input('tipe_param') == 1) {

                    (new ParameterRange)->updateOrCreate([
                        'uid' => $request->input('uid'),
                        'tipe_logger' => $request->input('tipe_logger')
                    ], [
                        'ph_re_warn_min' => $request->input('ph_re_warn_min'),
                        'ph_re_warn_max' => $request->input('ph_re_warn_max'),
                        'ph_bottom_min' => $request->input('ph_bottom_min'),
                        'ph_bottom_max' => $request->input('ph_bottom_max'),
                        'ph_upper_min' => $request->input('ph_upper_min'),
                        'ph_upper_max' => $request->input('ph_upper_max'),
                        'tss_re_warn_min' => $request->input('tss_re_warn_min'),
                        'tss_re_warn_max' => $request->input('tss_re_warn_max'),
                        'tss_bottom_min' => $request->input('tss_bottom_min'),
                        'tss_bottom_max' => $request->input('tss_bottom_max'),
                        'tss_upper_min' => $request->input('tss_upper_min'),
                        'tss_upper_max' => $request->input('tss_upper_max'),
                        'debit_re_warn_min' => $request->input('debit_re_warn_min'),
                        'debit_re_warn_max' => $request->input('debit_re_warn_max'),
                        'debit_bottom_min' => $request->input('debit_bottom_min'),
                        'debit_bottom_max' => $request->input('debit_bottom_max'),
                        'debit_upper_min' => $request->input('debit_upper_min'),
                        'debit_upper_max' => $request->input('debit_upper_max'),
                    ]);

                    (new ParameterLimit)
                        ->where('uid', $request->input('uid'))
                        ->where('tipe_logger', $request->input('tipe_logger'))
                        ->update([
                            'ph_mutu_min' => $request->input('ph_mutu_min'),
                            'ph_mutu_max' => $request->input('ph_mutu_max'),
                            'ph_warn_min' => $request->input('ph_warn_min'),
                            'ph_warn_max' => $request->input('ph_warn_max'),
                            'ph_intermit' => $request->input('ph_intermit'),
                            'tss_warn' => $request->input('tss_warn'),
                            'tss_warn_min' => $request->input('tss_warn_min'),
                            'tss_mutu_min' => $request->input('tss_mutu_min'),
                            'tss_mutu' => $request->input('tss_mutu'),
                            'tss_intermit' => $request->input('tss_intermit'),
                            'debit_warn' => $request->input('debit_warn'),
                            'debit_warn_min' => $request->input('debit_warn_min'),
                            'debit_mutu_min' => $request->input('debit_mutu_min'),
                            'debit_mutu' => $request->input('debit_mutu'),
                            'debit_konv' => $request->input('debit_konversi'),
                            'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                            'debit_warn_konv' => $request->input('debit_warn_konv'),
                            'debit_intermit' => $request->input('debit_intermit'),
                        ]);
                } else if ($request->input('tipe_param') == 2) {
                    (new ParameterLimit)->where('uid', $request->input('uid'))->update([
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'cod_warn' => $request->input('cod_warn'),
                        'cod_warn_min' => $request->input('cod_warn_min'),
                        'cod_mutu_min' => $request->input('cod_mutu_min'),
                        'cod_mutu' => $request->input('cod_mutu'),
                        'cod_intermit' => $request->input('cod_intermit'),
                        'tss_warn' => $request->input('tss_warn'),
                        'tss_warn_min' => $request->input('tss_warn_min'),
                        'tss_mutu_min' => $request->input('tss_mutu_min'),
                        'tss_mutu' => $request->input('tss_mutu'),
                        'tss_intermit' => $request->input('tss_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                    ]);
                } else if ($request->input('tipe_param') == 3) {
                    (new ParameterLimit)->where('uid', $request->input('uid'))->update([
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'cod_warn' => $request->input('cod_warn'),
                        'cod_warn_min' => $request->input('cod_warn_min'),
                        'cod_mutu_min' => $request->input('cod_mutu_min'),
                        'cod_mutu' => $request->input('cod_mutu'),
                        'cod_intermit' => $request->input('cod_intermit'),
                        'nh3n_warn' => $request->input('nh3n_warn'),
                        'nh3n_warn_min' => $request->input('nh3n_warn_min'),
                        'nh3n_mutu_min' => $request->input('nh3n_mutu_min'),
                        'nh3n_mutu' => $request->input('nh3n_mutu'),
                        'nh3n_intermit' => $request->input('nh3n_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                    ]);
                } else if ($request->input('tipe_param') == 4) {
                    (new ParameterLimit)->where('uid', $request->input('uid'))->update([
                        'ph_mutu_min' => $request->input('ph_mutu_min'),
                        'ph_mutu_max' => $request->input('ph_mutu_max'),
                        'ph_warn_min' => $request->input('ph_warn_min'),
                        'ph_warn_max' => $request->input('ph_warn_max'),
                        'ph_intermit' => $request->input('ph_intermit'),
                        'cod_warn' => $request->input('cod_warn'),
                        'cod_warn_min' => $request->input('cod_warn_min'),
                        'cod_mutu_min' => $request->input('cod_mutu_min'),
                        'cod_mutu' => $request->input('cod_mutu'),
                        'cod_intermit' => $request->input('cod_intermit'),
                        'tss_warn' => $request->input('tss_warn'),
                        'tss_warn_min' => $request->input('tss_warn_min'),
                        'tss_mutu_min' => $request->input('tss_mutu_min'),
                        'tss_mutu' => $request->input('tss_mutu'),
                        'tss_intermit' => $request->input('tss_intermit'),
                        'nh3n_warn' => $request->input('nh3n_warn'),
                        'nh3n_warn_min' => $request->input('nh3n_warn_min'),
                        'nh3n_mutu_min' => $request->input('nh3n_mutu_min'),
                        'nh3n_mutu' => $request->input('nh3n_mutu'),
                        'nh3n_intermit' => $request->input('nh3n_intermit'),
                        'debit_warn' => $request->input('debit_warn'),
                        'debit_warn_min' => $request->input('debit_warn_min'),
                        'debit_mutu_min' => $request->input('debit_mutu_min'),
                        'debit_mutu' => $request->input('debit_mutu'),
                        'debit_konv' => $request->input('debit_konversi'),
                        'debit_mutu_konv' => $request->input('debit_mutu_konv'),
                        'debit_warn_konv' => $request->input('debit_warn_konv'),
                        'debit_intermit' => $request->input('debit_intermit'),
                    ]);
                }

                (new ParameterRange)->updateOrCreate([
                    'uid' => $request->input('uid'),
                    'tipe_logger' => $request->input('tipe_logger')
                ], [
                    'tipe_monitor' => $request->input('tipe_monitor'),
                ]);

                $platform = (new Platform)->where('uid', $request->input('uid'))->get()->first();
                $platformDokumen = (new PlatformDokumen)->where('platform_id', $platform->id)->get();
                foreach ($platformDokumen as $item) {
                    if ($request->input('dokumen_id') !== null) {
                        if (!in_array($item->id, $request->input('dokumen_id'))) {
                            $item->delete();

                            if (Storage::exists('public/' . $item->lokasi_file . '/' . $item->nama_file))
                                Storage::delete('public/' . $item->lokasi_file . '/' . $item->nama_file);
                        }
                    } else {
                        $item->delete();

                        if (Storage::exists('public/' . $item->lokasi_file . '/' . $item->nama_file))
                            Storage::delete('public/' . $item->lokasi_file . '/' . $item->nama_file);
                    }
                }

                if ($request->input('nama_dokumen') !== null) {
                    for ($i = 0; $i < count($request->input('nama_dokumen')); $i++) {
                        if ($request->hasFile('files.' . $i)) {
                            $fileOriginalName = pathinfo($request->file('files')[$i]->getClientOriginalName(), PATHINFO_FILENAME);
                            $fileExtension = pathinfo($request->file('files')[$i]->getClientOriginalName(), PATHINFO_EXTENSION);
                            $fileName = $fileOriginalName . '-' . time() . '.' . $fileExtension;
                            $lengthId = strlen($platform->id) <= 11 ? 11 : 1;
                            $idPathNumber = str_pad($platform->id, $lengthId, "0", STR_PAD_LEFT);
                            $path = 'platforms/' . $idPathNumber . '/documents';

                            $request->file('files')[$i]->storeAs('public/' . $path . '/', $fileName);

                            (new PlatformDokumen)->create([
                                'platform_id' => $platform->id,
                                'platform_uid' => $platform->uid,
                                'nama_dokumen' => $request->input('nama_dokumen')[$i],
                                'lokasi_file' => $path,
                                'nama_file' => $fileName,
                                'tipe_file' => $request->file('files')[$i]->getMimeType(),
                                'ukuran_file' => $request->file('files')[$i]->getSize(),
                            ]);
                        }
                    }
                }

                DB::commit();
                return response()->json([
                    'message' => 'Perubahan Logger berhasil disimpan',
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
        //endregion

        //region Handle Delete
        public function delete(Request $request): JsonResponse {
            DB::beginTransaction();
            try {

                (new Platform)->where('uid', $request->input('uid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))->delete();

                DB::commit();
                return response()->json([
                    'message' => 'Data Logger berhasil dihapus',
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
        //endregion

    }
