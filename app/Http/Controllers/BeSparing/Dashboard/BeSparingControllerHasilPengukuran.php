<?php

    namespace App\Http\Controllers\BeSparing\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Customer;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use Auth;
    use Carbon\Carbon;
    use Carbon\CarbonPeriod;
    use Exception;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Contracts\View\Factory;
    use Illuminate\Contracts\View\View;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;
    use Illuminate\Routing\Redirector;

    class BeSparingControllerHasilPengukuran extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.dashboard.hasil-pengukuran';
            Carbon::setLocale('id');
        }

        public function index(): View|Factory|Redirector|Application|RedirectResponse {
            // $dataLogger = Platform::whereIn('uid', ['WMP01GT', 'WMP02GT', 'WMP03GT', 'WMP11ST', 'WMP08BT', 'WMP15LT'])
            //     ->where('tipe_logger', '=', 2)->get();

            $dataCustomer = Customer::with('jenisIndustri')->get();

            return view($this->viewPath . '.index', [
                'customer' => $dataCustomer,
            ]);
        }

        //region Handle Info Platform
        public function handleInfoPlatform(Request $request) {
            try {

                $dataTotalPlatform = Platform::when($request->input('tipe_logger', 1), function ($query, $tipeLogger) {
                    return $query->where('tipe_logger', $tipeLogger);
                })->where('status_validasi', '=', 'Active')->get()->count();

                $dataTotalPlatformOnline = Platform::when($request->input('tipe_logger', 1), function ($query, $tipeLogger) {
                    return $query->where('tipe_logger', $tipeLogger);
                })->where('status_validasi', '=', 'Active')
                    ->where('status_platform', '=', 'online')->get()->count();

                $dataTotalPlatformOffline = Platform::when($request->input('tipe_logger', 1), function ($query, $tipeLogger) {
                    return $query->where('tipe_logger', $tipeLogger);
                })->where('status_validasi', '=', 'Active')
                    ->where('status_platform', '=', 'offline')->get()->count();

                return response()->json([
                    'data' => [
                        'totalPlatform' => $dataTotalPlatform,
                        'totalPlatformOnline' => $dataTotalPlatformOnline,
                        'totalPlatformOffline' => $dataTotalPlatformOffline,
                    ]
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

        public function handleDataPlatforms(Request $request) {
            try {

                $dataUserSite = UserSite::where('user_id', request()->user()->id)->where('status_site', 1)->get();
                $site_ids = [];
                foreach ($dataUserSite as $item) {
                    $site_ids[] = $item->site_id;
                }

                $dataLogger = Platform::platformByLimit($site_ids, [
                    'search' => $request->input(),
                ])->with([
                    'site:id,nama_site,customer_lokasi_id',
                    'site.customerLokasi:id,customer_id,nama_lokasi',
                    'site.customerLokasi.customer:id,nama_perusahaan'
                ])->paginate(4);

                return response()->json([
                    'userLevel' => Auth::user()->user_level,
                    'platforms' => $dataLogger->items(),
                    'data' => [
                        'hasMore' => $dataLogger->hasMorePages(),
                        'currentPage' => $dataLogger->currentPage()
                    ]
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

        //region Handle Period Parameter Chart
        public function getPeriodicParameterChart(Request $request): JsonResponse {
            try {

                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                $dataCharts = Parameter::dataCharts($request->input('platformUid'), $request->input('tipeLogger'), $minDate, $maxDate, $timezone)->get();

                $dataPh = [];
                $dataDebit = [];
                $dataTss = [];
                foreach ($dataCharts as $item) {
                    $dataTime = Carbon::createFromFormat('Y-m-d H:i:s', $item->datetime)->setTimezone($timezone)->format('Y-m-d H:i:s');
                    $dataTimeUnix = Carbon::parse($dataTime)->getPreciseTimestamp(3);

                    $dataPh[] = [
                        'x' => $dataTimeUnix,
                        'y' => round($item->ph, 2),
                        'z' => $dataTime
                    ];

                    $dataDebit[] = [
                        'x' => $dataTimeUnix,
                        'y' => round($item->debit, 2)
                    ];

                    $dataTss[] = [
                        'x' => $dataTimeUnix,
                        'y' => round($item->tss)
                    ];
                }

                $data = [
                    [
                        'name' => 'pH',
                        'type' => 'line',
                        'marker' => [
                            'symbol' => 'circle'
                        ],
                        'data' => $dataPh
                    ], [
                        'name' => 'TSS',
                        'type' => 'line',
                        'marker' => [
                            'symbol' => 'circle'
                        ],
                        'data' => $dataTss
                    ], [
                        'name' => 'Debit',
                        'type' => 'line',
                        'marker' => [
                            'symbol' => 'circle'
                        ],
                        'data' => $dataDebit
                    ]
                ];

                return response()->json([
                    'message' => 'Load Success!',
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'data' => $data,
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
        //endregion

        //region Handle Last Period Parameter Chart
        public function getLastPeriodicParameterChart(Request $request): JsonResponse {
            try {

                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                $dataCharts = Parameter::dataCharts($request->input('platformUid'), $request->input('tipeLogger'), $minDate, $maxDate, $timezone, 'DESC')->first();

                if ($dataCharts) {
                    $dataTime = Carbon::createFromFormat('Y-m-d H:i:s', $dataCharts->datetime)->setTimezone($timezone)->format('Y-m-d H:i:s');
                    $dataTimeUnix = Carbon::parse($dataTime)->getPreciseTimestamp(3);

                    $data = [
                        [
                            'name' => 'pH',
                            'type' => 'line',
                            'marker' => [
                                'symbol' => 'circle'
                            ],
                            'data' => [
                                'x' => $dataTimeUnix,
                                'y' => round($dataCharts->ph, 2)
                            ],
                        ], [
                            'name' => 'TSS',
                            'type' => 'line',
                            'marker' => [
                                'symbol' => 'circle'
                            ],
                            'data' => [
                                'x' => $dataTimeUnix,
                                'y' => round($dataCharts->tss)
                            ]
                        ], [
                            'name' => 'Debit',
                            'type' => 'line',
                            'marker' => [
                                'symbol' => 'circle'
                            ],
                            'data' => [
                                'x' => $dataTimeUnix,
                                'y' => round($dataCharts->debit, 2)
                            ]
                        ]
                    ];
                }

                return response()->json([
                    'message' => 'Load Success!',
                    'data' => $data ?? [],
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
        //endregion

        //region Handle Detail Platform
        public function handleDetailPlatform(Request $request) {
            try {

                $dataParameterLimit = ParameterLimit::where('uid', $request->input('uid'))->first();

                $now = Carbon::now();
                $firstDay = Carbon::create($request->input('period_y'), $request->input('period_m'));
                $period = CarbonPeriod::create($firstDay, $now->subDay());

                $dataParameter = [];
                foreach ($period as $date) {
                    $dataParam = Parameter::dataAvgParameter($request->input('uid'), $request->input('tipeLogger'), $date->format('Y-m-d'))->first();
                    if ($dataParam) {
                        $dataParameter[] = $dataParam;
                    }
                }

                $dataGap = Parameter::dataGapParameter($request->input('uid'), $request->input('tipeLogger'), $firstDay->format('Y-m-d') . ' 00:00', $now->format('Y-m-d') . ' 23:59')->get();

                return response()->json([
                    'dataGap' => $dataGap,
                    'dataLimit' => $dataParameterLimit,
                    'data' => $dataParameter
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

        //region Handle Lost Platform
        public function handleLostPlatform(Request $request) {
            try {

                $now = Carbon::now();
                $firstDay = Carbon::create($request->input('period_y'), $request->input('period_m'));

                $dataGap = Parameter::dataGapParameter($request->input('uid'), $request->input('tipeLogger'), $firstDay->format('Y-m-d') . ' 00:00', $now->format('Y-m-d') . ' 23:59')->get();

                return response()->json([
                    'dataGap' => $dataGap,
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
