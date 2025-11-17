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
        public function handleInfoPlatform() {
            try {

                $dataUser = User::where('id', request()->user()->id)->first();
                $baseQuery = Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '');
                $counts = [
                    'total' => (clone $baseQuery)->count(),
                    'online' => Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '', [
                        'search' => [
                            'status_platform' => 'online',
                        ]
                    ])->count(),
                    'offline' => Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '', [
                        'search' => [
                            'status_platform' => 'offline',
                        ]
                    ])->count(),
                ];

                return response()->json([
                    'data' => [
                        'totalPlatform' => $counts['total'],
                        'totalPlatformOnline' => $counts['online'],
                        'totalPlatformOffline' => $counts['offline'],
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
                $perPage = $request->input('per_page', 6);
                $dataLogger = Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '', [
                    'search' => [
                        'uid' => $request->input('uid'),
                        'status_platform' => $request->input('status_platform'),
                        'customer_lokasi_id' => $request->input('location'),
                    ]
                ])->with([
                    'site:id,nama_site,customer_lokasi_id',
                    'site.customerLokasi:id,customer_id,nama_lokasi',
                    'site.customerLokasi.customer:id,nama_perusahaan'
                ])->distinct()->paginate($perPage);

                // Map dan unique berdasarkan UID
                $platformTemp = $dataLogger->getCollection()
                    ->unique('uid') // Filter duplikasi berdasarkan UID
                    ->map(function ($item) {
                        return [
                            'user_level' => request()->user()->user_level,
                            'uid' => $item->uid,
                            'uid_alias' => $item->site->nama_site ?? '',
                            'siteName' => $item->site->nama_site ?? '',
                            'location' => $item->site->customerLokasi->nama_lokasi ?? '',
                            'timezone' => 'Asia/Makassar',
                            'locale' => 'en-US',
                            'totalLogger' => $item->total_logger,
                            'tipeLogger' => $item->tipe_logger ?? 1,
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
                    ],
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
                $platform = Platform::enviroPlatformBySearchGrouped($dataUser->id_sparing ?? '', [
                    'search' => [
                        'uid' => $uid,
                    ]
                ])->with([
                    'site:id,nama_site,customer_lokasi_id',
                    'site.customerLokasi:id,customer_id,nama_lokasi',
                    'site.customerLokasi.customer:id,nama_perusahaan'
                ])->first();

                $timezone = 'Asia/Makassar';
                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');

                if ($request->input('date') && $request->input('date') != 'null') {
                    $minDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('date'))->format('Y-m-d') . ' 23:59';
                }

                $waterQualityData = $this->getWaterQualityData($uid, $minDate, $maxDate, $platform->tipe_logger ?? 1, $timezone);

                $dataLastParam = Parameter::dataParameterByUid([
                    'platformUid' => $uid,
                    'tipeLogger' => $platform->tipe_logger ?? 1,
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'timezone' => $timezone,
                    'sort' => 'DESC'
                ])->get()->first();

                $paramLimit = ParameterLimit::where('uid', $uid)->where('tipe_logger', $platform->tipe_logger ?? 1)->first();

                $calcDebitWarnInMinutes = $paramLimit->debit_warn;
                $calcDebitWarnMinInMinutes = $paramLimit->debit_warn_min;
                $calcDebitMutuMinInMinutes = $paramLimit->debit_mutu_min;
                $calcDebitMutuInMinutes = $paramLimit->debit_mutu;

                $dataParamStatus = [];
                if ($dataLastParam) {
                    if (($dataLastParam->ph > $paramLimit->ph_mutu_min && $dataLastParam->ph <= $paramLimit->ph_warn_min) || ($dataLastParam->ph >= $paramLimit->ph_warn_max && $dataLastParam->ph < $paramLimit->ph_mutu_max)) {
                        $dataParamStatus[] = ['val' => 2];
                    } else if ($dataLastParam->ph >= $paramLimit->ph_mutu_max || ($dataLastParam->ph <= $paramLimit->ph_mutu_min && $paramLimit->ph_intermit === 0)) {
                        $dataParamStatus[] = ['val' => 3];
                    } else {
                        $dataParamStatus[] = ['val' => 1];
                    }

                    if ($dataLastParam->debit > $calcDebitWarnInMinutes && $dataLastParam->debit <= $calcDebitWarnMinInMinutes || $dataLastParam->debit >= $calcDebitMutuMinInMinutes && $dataLastParam->debit < $calcDebitMutuInMinutes) {
                        $dataParamStatus[] = ['val' => 2];
                    } else if ($dataLastParam->debit >= $calcDebitMutuInMinutes || ($dataLastParam->debit <= $calcDebitWarnInMinutes && $paramLimit->debit_intermit === 0)) {
                        $dataParamStatus[] = ['val' => 3];
                    } else {
                        $dataParamStatus[] = ['val' => 1];
                    }

                    if ($dataLastParam->tss > $paramLimit->tss_warn && $dataLastParam->tss <= $paramLimit->tss_warn_min || $dataLastParam->tss >= $paramLimit->tss_mutu_min && $dataLastParam->tss < $paramLimit->tss_mutu) {
                        $dataParamStatus[] = ['val' => 2];
                    } else if ($dataLastParam->tss >= $paramLimit->tss_mutu || ($dataLastParam->tss <= $paramLimit->tss_warn && $paramLimit->tss_intermit === 0)) {
                        $dataParamStatus[] = ['val' => 3];
                    } else {
                        $dataParamStatus[] = ['val' => 1];
                    }
                }

                $maxStatus = 0;
                foreach ($dataParamStatus as $itemStatus) {
                    if ($itemStatus['val'] > $maxStatus) {
                        $maxStatus = $itemStatus['val'];
                    }
                }

                $statusNilaiEmo = '❓';
                $statusNilai = 'Unknown';
                $statusNilaiColor = 'bg-gray-200';
                if ($dataLastParam) {
                    if ($maxStatus == 2) {
                        $statusNilaiEmo = '😞';
                        $statusNilai = 'Warning';
                        $statusNilaiColor = 'bg-yellow-200';
                    } else if ($maxStatus == 3) {
                        $statusNilaiEmo = '🤢';
                        $statusNilai = 'Danger';
                        $statusNilaiColor = 'bg-red-400';
                    } else if ($maxStatus == 1) {
                        $statusNilaiEmo = '😁';
                        $statusNilai = 'Normal';
                        $statusNilaiColor = 'bg-green-200';
                    }
                }

                return response()->json([
                    'data' => [
                        'uid' => $platform->uid ?? '',
                        'status' => $statusNilai,
                        'tipe_logger' => $platform->tipe_logger ?? null,
                        'emoji' => $statusNilaiEmo,
                        'colorCode' => $statusNilaiColor,
                        'isOnline' => $platform->status_platform && $platform->status_platform == 'online',
                        'metrics' => [
                            'ph' => [
                                'value' => $dataLastParam ? round($dataLastParam->ph, 2) : 0,
                                'bml_min' => $paramLimit->ph_mutu_min ?? 6,
                                'bml_min_buffer' => $paramLimit->ph_warn_min ?? 6.5,
                                'bml_max_buffer' => $paramLimit->ph_warn_max ?? 8.5,
                                'bml_max' => $paramLimit->ph_mutu_max ?? 9
                            ],
                            'temperature' => [
                                'value' => $dataLastParam ? round($dataLastParam->temp, 2) : 0,
                                'bml_min' => 20,
                                'bml_min_buffer' => 22,
                                'bml_max_buffer' => 35,
                                'bml_max' => 40
                            ],
                            'tss' => [
                                'value' => $dataLastParam ? round($dataLastParam->tss) : 0,
                                'bml_min' => $paramLimit->tss_warn ?? 0,
                                'bml_min_buffer' => $paramLimit->tss_warn_min ?? 10,
                                'bml_max_buffer' => $paramLimit->tss_mutu_min ?? 80,
                                'bml_max' => $paramLimit->tss_mutu ?? 100
                            ],
                            'debit' => [
                                'value' => $dataLastParam ? round($dataLastParam->debit, 2) : 0,
                                'bml_min' => $paramLimit->debit_warn ?? 0,
                                'bml_min_buffer' => $paramLimit->debit_warn_min ?? 0.5,
                                'bml_max_buffer' => $paramLimit->debit_mutu_min ?? 5,
                                'bml_max' => $paramLimit->debit_mutu ?? 10
                            ]
                        ],
                        'waterQualityData' => $waterQualityData,
                        'lastUpdated' => now()->toISOString()
                    ]
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine() . ' in file ' . $exception->getFile(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

        public function getWaterQualityData($uid, $minDate, $maxDate, $tipeLogger, $timezone) {
            $parameter = Parameter::dataParameterHasilPengukuran($uid, $minDate, $maxDate, $tipeLogger, $timezone)->get();

            $data = [];
            foreach ($parameter as $item) {
                $data[] = [
                    'timestamp' => $item->datetime_unix,
                    'ph' => $item->ph ? round($item->ph, 2) : null,
                    'temperature' => $item->temp ? round($item->temp, 2) : null,
                    'tss' => $item->tss ? round($item->tss) : null,
                    'debit' => $item->debit ? round($item->debit, 2) : null,
                    'cod' => $item->cod ?? null,
                    'nh3n' => $item->nh3n ?? null
                ];
            }

            return $data;
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

                $firstDay = Carbon::create($request->input('period_y') ?? date('Y'), $request->input('period_m') ?? date('m'));
                $now = Carbon::now();
                if ($request->input('period_y') && $request->input('period_m')) {
                    $now = $firstDay->copy()->endOfMonth();
                }

                $period = CarbonPeriod::create($firstDay, $now);

                $dataParameter = [];
                foreach ($period as $date) {
                    $dataParam = Parameter::dataAvgParameter($request->input('uid'), $request->input('tipeLogger'), $date->format('Y-m-d'))->first();
                    if ($dataParam) {
                        $dataParameter[] = $dataParam;
                    }
                }

                $dataGap = Parameter::dataGapParameter($request->input('uid'), $request->input('tipeLogger'), $firstDay->format('Y-m-d') . ' 00:00', $now->format('Y-m-d') . ' 23:59')->get();

                return response()->json([
                    'xxx' => $period,
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
