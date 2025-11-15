<?php

    namespace App\Http\Controllers\BeSparing\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Customer;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\Users\User;
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

                $dataUser = User::where('id', Auth::user()->id)->first();

                $dataTotalPlatform = Platform::platformByLimit($dataUser->id_sparing)->get()->count();
                $dataTotalPlatformOnline = Platform::platformByLimit($dataUser->id_sparing, [
                    'search' => [
                        'status_platform' => 1
                    ],
                ])->get()->count();

                $dataTotalPlatformOffline = Platform::platformByLimit($dataUser->id_sparing, [
                    'search' => [
                        'status_platform' => 0
                    ],
                ])->get()->count();

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
                $dataUser = User::where('id', request()->user()->id)->first();
                $perPage = $request->input('per_page', 10);

                $dataLogger = Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '')
                    ->with([
                        'site:id,nama_site,customer_lokasi_id',
                        'site.customerLokasi:id,customer_id,nama_lokasi',
                        'site.customerLokasi.customer:id,nama_perusahaan'
                    ])
                    ->distinct()
                    ->paginate($perPage);

                // Map dan unique berdasarkan UID
                $platformTemp = $dataLogger->getCollection()
                    ->unique('uid') // Filter duplikasi berdasarkan UID
                    ->map(function ($item) {
                        return [
                            'uid' => $item->uid,
                            'uid_alias' => $item->site->nama_site ?? '',
                            'siteName' => $item->site->nama_site ?? '',
                            'location' => $item->site->customerLokasi->nama_lokasi ?? '',
                            'timezone' => 'Asia/Makassar',
                            'locale' => 'en-US'
                        ];
                    })
                    ->values() // Re-index array setelah unique
                    ->all(); // Convert ke plain array

                return response()->json([
                    'data' => $platformTemp,
                    'pagination' => [
                        'current_page' => $dataLogger->currentPage(),
                        'last_page' => $dataLogger->lastPage(),
                        'per_page' => $dataLogger->perPage(),
                        'total' => $dataLogger->total(),
                        'has_more' => $dataLogger->hasMorePages()
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

        public function handleDataPlatformsData(Request $request, $uid) {
            try {
                $dataUser = User::where('id', request()->user()->id)->first();
                $platform = Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '', null, null, $uid)
                    ->with([
                        'site:id,nama_site,customer_lokasi_id',
                        'site.customerLokasi:id,customer_id,nama_lokasi',
                        'site.customerLokasi.customer:id,nama_perusahaan'
                    ])->first();

                return response()->json([
                    'data' => [
                        'uid' => $platform->uid ?? '',
                        'status' => 'Normal',
                        'emoji' => '✅',
                        'colorCode' => 'bg-green-200',
                        'isOnline' => true,
                        'metrics' => [
                            'ph' => [
                                'value' => 7.2,
                                'bml_min' => 6,
                                'bml_min_buffer' => 6.5,
                                'bml_max_buffer' => 8.5,
                                'bml_max' => 9
                            ],
                            'temperature' => [
                                'value' => 28.5,
                                'bml_min' => 20,
                                'bml_min_buffer' => 22,
                                'bml_max_buffer' => 35,
                                'bml_max' => 40
                            ],
                            'tss' => [
                                'value' => 45.3,
                                'bml_min' => 0,
                                'bml_min_buffer' => 10,
                                'bml_max_buffer' => 80,
                                'bml_max' => 100
                            ],
                            'debit' => [
                                'value' => 2.5,
                                'bml_min' => 0,
                                'bml_min_buffer' => 0.5,
                                'bml_max_buffer' => 5,
                                'bml_max' => 10
                            ]
                        ],
                        'waterQualityData' => [],
                        'lastUpdated' => now()->toISOString()
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
                    $dataTime = Carbon::parse($item->datetime)->setTimezone($timezone);
                    $dataTimeUnix = $dataTime->getPreciseTimestamp(3);
                    $dataTimeFormatted = $dataTime->format('Y-m-d H:i:s');

                    $dataPh[] = [
                        'x' => $dataTimeUnix,
                        'y' => round($item->ph, 2),
                        'z' => $dataTimeFormatted
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
                    $dataTime = Carbon::parse($dataCharts->datetime)->setTimezone($timezone);
                    $dataTimeUnix = $dataTime->getPreciseTimestamp(3);

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
