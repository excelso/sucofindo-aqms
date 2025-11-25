<?php

    namespace App\Http\Controllers\BeSparing\Dashboard;

    use App\Http\Controllers\Controller;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\BeSparing\Master\PlatformDokumen;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Contracts\Foundation\Application;
    use Illuminate\Contracts\View\Factory;
    use Illuminate\Contracts\View\View;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;

    class BeSparingControllerSummary extends Controller {
        protected string $viewPath;
        // protected string $localDate;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.dashboard.maps.summary';
            // $this->localDate = '2024-06-30';
            Carbon::setLocale('id');
        }

        public function index($uid, $tipeLogger): Factory|View|Application {
            $dataUserSite = UserSite::where('user_id', request()->user()->id)->where('status_site', 1)->get();
            $site_ids = [];
            foreach ($dataUserSite as $item) {
                $site_ids[] = $item->site_id;
            }

            $dataPlatform = Platform::platformByLimit($site_ids, [
                'orderBy' => [
                    'last_online' => 'DESC'
                ]
            ])->with('site', 'site.customer')->get();
            $dataPlatformSelected = (new Platform)
                ->where('uid', $uid)
                ->where('tipe_logger', $tipeLogger)->get()->first();

            if (!isset($dataPlatformSelected)) {
                abort(404);
            }

            $dataParamAvailable = Platform::parameterAvailable($uid, $tipeLogger)->get()->first();
            $paramAvailable = $dataParamAvailable->site->customer->jenisIndustri;
            $lat = $dataPlatformSelected->lat;
            $lng = $dataPlatformSelected->lng;
            $timezone = Common::getNearestTimezone($lat, $lng, 'ID');
            $parseParameter = json_decode($paramAvailable->parameter, false);
            return view($this->viewPath . '.index', [
                'platformUid' => $uid,
                'tipeLogger' => $tipeLogger,
                'platformSelected' => $dataPlatformSelected,
                'dataPlatform' => $dataPlatform,
                'parseParameter' => $parseParameter,
                'paramAvailable' => $paramAvailable,
                'timezone' => $timezone,
            ]);
        }

        //region Handle Info Platform
        public function handleDataPlatform(Request $request): JsonResponse {
            try {
                $dataPlatformSelected = Platform::dataPlatformInfo($request->input('platformUid'), $request->input('tipeLogger'))->get()->first();
                $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');
                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataPlatformSelected,
                    'timezone' => $timezone,
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Last Data Parameter
        public function handleDataLastParameter(Request $request): JsonResponse {
            try {
                $dataPlatformSelected = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');

                $dataParamAvailable = Platform::parameterAvailable($request->input('platformUid'), $request->input('tipeLogger'))->get()->first();
                $paramAvailable = $dataParamAvailable->site->customer->jenisIndustri;
                $parseParameter = json_decode($paramAvailable->parameter, false);
                $paramLimit = (new ParameterLimit)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                $dataLastParam = Parameter::dataParameterByUid([
                    'platformUid' => $request->input('platformUid'),
                    'tipeLogger' => $request->input('tipeLogger'),
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'timezone' => $timezone,
                    'sort' => 'DESC'
                ]);

                return response()->json([
                    'message' => 'Success!',
                    'dataPlatformSelected' => $dataPlatformSelected,
                    'dataParameterLimit' => $paramLimit,
                    'parseParameter' => $parseParameter,
                    'data' => $dataLastParam->get()->first(),
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Persentase
        public function handleDataPersentase(Request $request): JsonResponse {
            try {
                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $selDate = Carbon::parse($request->input('startDate'));

                    $minDate = $selDate->format('Y-m-d') . ' 00:00';
                    if (!$selDate->isSameDay(Carbon::today())) {
                        $maxDate = $selDate->format('Y-m-d') . ' 23:59';
                    } else {
                        $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                    }
                }

                $dataPersentase = Parameter::dataPersentase($request->input('platformUid'), $request->input('tipeLogger'), $minDate, $maxDate, $timezone)
                    ->get()->first();

                $dataMutu = 0;
                $dataDanger = 0;
                switch ($request->input('parameterId')) {
                    case 'pH':
                        $dataMutu = $dataPersentase->ph_mutu;
                        $dataDanger = $dataPersentase->ph_danger;
                        break;
                    case 'Debit':
                        $dataMutu = $dataPersentase->debit_mutu;
                        $dataDanger = $dataPersentase->debit_danger;
                        break;
                    case 'COD':
                        $dataMutu = $dataPersentase->cod_mutu;
                        $dataDanger = $dataPersentase->cod_danger;
                        break;
                    case 'TSS':
                        $dataMutu = $dataPersentase->tss_mutu;
                        $dataDanger = $dataPersentase->tss_danger;
                        break;
                    case 'NH3N':
                        $dataMutu = $dataPersentase->nh3n_mutu;
                        $dataDanger = $dataPersentase->nh3n_danger;
                        break;
                }

                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataPersentase->total_data,
                    'dataPersentase' => [
                        'mutu' => $dataMutu,
                        'danger' => $dataDanger,
                    ],
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Charts
        public function handleDataCharts(Request $request): JsonResponse {
            try {

                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $paramLimit = (new ParameterLimit)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                $dataCharts = Parameter::dataCharts($request->input('platformUid'), $request->input('tipeLogger'), $minDate, $maxDate, $timezone)->get();

                $data = [];
                $paramTss = 0;
                foreach ($dataCharts as $item) {
                    $param = '';
                    $paramLimitCond = '';
                    switch ($request->input('parameterId')) {
                        case 'temperature':
                            $param = round($item->temp, 1);
                            $paramLimitCond = $item->temp > 38;
                            break;
                        case 'pH':
                            $param = $item->ph ?? 0;
                            $paramLimitCond = $item->ph < $paramLimit->ph_mutu_min || $item->ph > $paramLimit->ph_mutu_max;
                            break;
                        case 'Debit':
                            $param = $item->debit ?? 0;
                            $paramLimitCond = $item->debit > $paramLimit->debit_mutu || $item->debit <= 0;
                            break;
                        case 'COD':
                            $param = $item->cod ?? 0;
                            $paramLimitCond = $item->cod > $paramLimit->cod_mutu || ($item->cod <= 0 && $paramLimit->cod_intermit === 0);
                            break;
                        case 'TSS':
                            $param = $item->tss ? floor($item->tss) : 0;
                            $paramLimitCond = $item->tss > $paramLimit->tss_mutu || ($item->tss <= 0 && $paramLimit->tss_intermit === 0);
                            $paramTss = $item->tss ?? 0;
                            break;
                        case 'NH3N':
                            $param = $item->nh3n ?? 0;
                            $paramLimitCond = $item->nh3n > $paramLimit->nh3n_mutu || ($item->nh3n <= 0 && $paramLimit->nh3n_intermit === 0);
                            break;
                    }

                    $dt = new \DateTime();
                    $dt->setTimezone(new \DateTimeZone($timezone));
                    $dt->setTimestamp($item->datetime_unix);

                    $data[] = [
                        'marker' => [
                            'enabled' => $paramLimitCond,
                            'fillColor' => '#fff',
                            'lineWidth' => 2,
                            'radius' => 5,
                            'lineColor' => $paramLimitCond ? '#ff002b' : '#7bb4ec',
                        ],
                        'x' => Carbon::createFromTimestamp($item->datetime_unix)->getPreciseTimestamp(3),
                        'y' => $param
                    ];
                }


                $dataXaxis = [];
                $dataYaxis = [];
                if ($request->input('parameterId') == 'temperature') {
                    $dataXaxis = [
                        [
                            'type' => 'line',
                            'name' => 'Temp °C',
                            'showInLegend' => false,
                            'data' => $data
                        ], [
                            'type' => 'areaspline',
                            'name' => 'Temp Low',
                            'color' => 'rgb(100,189,85)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'Temp High',
                            'color' => 'rgb(204,0,0)'
                        ],
                    ];
                    $dataYaxis = array_merge($dataYaxis, [
                        'allowDecimals' => true,
                        // 'max' => 50,
                        'min' => 0,
                        'title' => [
                            'text' => 'Nilai Temp °C'
                        ],
                        'plotLines' => [
                            [
                                'value' => 25,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(100,189,85)'
                            ], [
                                'value' => 38,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(204,0,0)'
                            ],
                        ]
                    ]);
                } else if ($request->input('parameterId') == 'pH') {
                    $dataXaxis = [
                        [
                            'type' => 'line',
                            'name' => 'pH',
                            'showInLegend' => false,
                            'data' => $data
                        ], [
                            'type' => 'areaspline',
                            'name' => 'pH Mutu Low',
                            'color' => 'rgb(0,124,255)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'pH Warn Low',
                            'color' => 'rgb(94,255,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'pH Warn High',
                            'color' => 'rgb(255,223,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'pH Mutu High',
                            'color' => 'rgb(204,0,0)'
                        ]
                    ];
                    $dataYaxis = array_merge($dataYaxis, [
                        'allowDecimals' => true,
                        'max' => $paramLimit->ph_mutu_max,
                        'min' => 0,
                        'title' => [
                            'text' => 'Nilai pH'
                        ],
                        'plotLines' => [
                            [
                                'value' => $paramLimit->ph_mutu_min,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(0,124,255)'
                            ],
                            [
                                'value' => $paramLimit->ph_mutu_max,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(204,0,0)'
                            ],
                            [
                                'value' => $paramLimit->ph_warn_min,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(94,255,0)'
                            ],
                            [
                                'value' => $paramLimit->ph_warn_max,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(255,223,0)'
                            ],
                        ]
                    ]);
                } else if ($request->input('parameterId') == 'Debit') {
                    $dataXaxis = [
                        [
                            'type' => 'line',
                            'name' => 'Debit',
                            'showInLegend' => false,
                            'data' => $data
                        ], [
                            'type' => 'areaspline',
                            'name' => 'Debit Mutu Low',
                            'color' => 'rgb(0,124,255)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'Debit Warn Low',
                            'color' => 'rgb(94,255,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'Debit Warn High',
                            'color' => 'rgb(255,223,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'Debit Mutu High',
                            'color' => 'rgb(204,0,0)'
                        ],
                    ];
                    $dataYaxis = array_merge($dataYaxis, [
                        'allowDecimals' => true,
                        'max' => $paramLimit->debit_mutu,
                        'min' => 0,
                        'title' => [
                            'text' => 'Nilai Debit'
                        ],
                        'plotLines' => [
                            [
                                'value' => $paramLimit->debit_warn,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(0,124,255)'
                            ], [
                                'value' => $paramLimit->debit_warn_min,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(94,255,0)'
                            ], [
                                'value' => $paramLimit->debit_mutu_min,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(255,223,0)'
                            ], [
                                'value' => $paramLimit->debit_mutu,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(204,0,0)'
                            ],
                        ]
                    ]);
                } else if ($request->input('parameterId') == 'COD') {
                    $dataXaxis = [
                        [
                            'type' => 'line',
                            'name' => 'COD',
                            'showInLegend' => false,
                            'data' => $data
                        ], [
                            'type' => 'areaspline',
                            'name' => 'COD Warn',
                            'color' => 'rgb(255,223,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'COD Mutu',
                            'color' => 'rgb(204,0,0)'
                        ],
                    ];
                    $dataYaxis = array_merge($dataYaxis, [
                        'allowDecimals' => true,
                        'max' => $paramLimit->cod_mutu,
                        'title' => [
                            'text' => 'Nilai COD'
                        ],
                        'plotLines' => [
                            [
                                'value' => $paramLimit->cod_warn,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(255,223,0)'
                            ],
                            [
                                'value' => $paramLimit->cod_mutu,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(204,0,0)'
                            ],
                        ]
                    ]);
                } else if ($request->input('parameterId') == 'TSS') {
                    $dataXaxis = [
                        [
                            'type' => 'line',
                            'name' => 'TSS',
                            'showInLegend' => false,
                            'data' => $data
                        ], [
                            'type' => 'areaspline',
                            'name' => 'TSS Mutu Low',
                            'color' => 'rgb(0,124,255)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'TSS Warn Low',
                            'color' => 'rgb(94,255,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'TSS Warn High',
                            'color' => 'rgb(255,223,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'TSS Mutu High',
                            'color' => 'rgb(204,0,0)'
                        ],
                    ];
                    $dataYaxis = array_merge($dataYaxis, [
                        'allowDecimals' => true,
                        'max' => max($paramTss, $paramLimit->tss_mutu),
                        'title' => [
                            'text' => 'Nilai TSS'
                        ],
                        'plotLines' => [
                            [
                                'value' => $paramLimit->tss_warn,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(0,124,255)'
                            ], [
                                'value' => $paramLimit->tss_warn_min,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(94,255,0)'
                            ], [
                                'value' => $paramLimit->tss_mutu_min,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(255,223,0)'
                            ], [
                                'value' => $paramLimit->tss_mutu,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(204,0,0)'
                            ],
                        ]
                    ]);
                } else if ($request->input('parameterId') == 'NH3N') {
                    $dataXaxis = [
                        [
                            'type' => 'line',
                            'name' => 'NH3N',
                            'showInLegend' => false,
                            'data' => $data
                        ], [
                            'type' => 'areaspline',
                            'name' => 'NH3N Warn',
                            'color' => 'rgb(255,223,0)'
                        ], [
                            'type' => 'areaspline',
                            'name' => 'NH3N Mutu',
                            'color' => 'rgb(204,0,0)'
                        ],
                    ];
                    $dataYaxis = array_merge($dataYaxis, [
                        'allowDecimals' => true,
                        'max' => $paramLimit->nh3n_mutu,
                        'title' => [
                            'text' => 'Nilai NH3N'
                        ],
                        'plotLines' => [
                            [
                                'value' => $paramLimit->nh3n_warn,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(255,223,0)'
                            ],
                            [
                                'value' => $paramLimit->nh3n_mutu,
                                'width' => 2,
                                'dashStyle' => 'Solid',
                                'color' => 'rgb(204,0,0)'
                            ],
                        ]
                    ]);
                }

                return response()->json([
                    'message' => 'Success!',
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'dataYaxis' => $dataYaxis,
                    'data' => $dataXaxis,
                    'timezone' => $timezone,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Charts Last Param
        public function handleDataChartsLastParam(Request $request): JsonResponse {
            try {

                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();
                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $paramLimit = (new ParameterLimit)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                $dataCharts = Parameter::dataCharts($request->input('platformUid'), $request->input('tipeLogger'), $minDate, $maxDate, $timezone, 'DESC')->get()->first();
                $param = '';
                $paramLimitCond = '';
                switch ($request->input('parameterId')) {
                    case 'pH':
                        $param = $dataCharts->ph ?? 0;
                        $paramLimitCond = isset($dataCharts->ph) && ($dataCharts->ph < $paramLimit->ph_mutu_min || $dataCharts->ph > $paramLimit->ph_mutu_max);
                        break;
                    case 'Debit':
                        $param = $dataCharts->debit ?? 0;
                        $paramLimitCond = isset($dataCharts->debit) && ($dataCharts->debit > $paramLimit->debit_mutu || $dataCharts->debit <= 0);
                        break;
                    case 'COD':
                        $param = $dataCharts->cod ?? 0;
                        $paramLimitCond = isset($dataCharts->cod) && ($dataCharts->cod > $paramLimit->cod_mutu || ($dataCharts->cod <= 0 && $paramLimit->cod_intermit === 0));
                        break;
                    case 'TSS':
                        $param = $dataCharts->tss ? floor($dataCharts->tss) : 0;
                        $paramLimitCond = isset($dataCharts->tss) && ($dataCharts->tss > $paramLimit->tss_mutu || ($dataCharts->tss <= 0 && $paramLimit->tss_intermit === 0));
                        break;
                    case 'NH3N':
                        $param = $dataCharts->nh3n ?? 0;
                        $paramLimitCond = isset($dataCharts->nh3n) && ($dataCharts->nh3n > $paramLimit->nh3n_mutu || ($dataCharts->nh3n <= 0 && $paramLimit->nh3n_intermit === 0));
                        break;
                }

                if (isset($dataCharts)) {
                    $dt = new \DateTime();
                    $dt->setTimezone(new \DateTimeZone($timezone));
                    $dt->setTimestamp($dataCharts->datetime_unix);

                    $data = [
                        'marker' => [
                            'enabled' => $paramLimitCond,
                            'fillColor' => '#fff',
                            'lineWidth' => 2,
                            'radius' => 5,
                            'lineColor' => $paramLimitCond ? '#ff002b' : '#7bb4ec',
                        ],
                        'x' => $dataCharts->datetime_unix * 1000,
                        'y' => $param
                    ];
                }

                return response()->json([
                    'message' => 'Success!',
                    'data' => $data ?? null,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Table
        public function handleDataTable(Request $request): JsonResponse {
            try {
                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $dataParamAvailable = Platform::parameterAvailable($request->input('platformUid'), $request->input('tipeLogger'))->get()->first();
                $paramAvailable = $dataParamAvailable->site->customer->jenisIndustri;
                $paramLimit = (new ParameterLimit)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');
                $minDate = Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                $dataTable = Parameter::dataLogsParameter([
                    'platformUid' => $request->input('platformUid'),
                    'tipeLogger' => $request->input('tipeLogger'),
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'statusPlatform' => $request->input('statusPlatform') ?? '',
                    'timezone' => $timezone,
                    'sort' => 'DESC'
                ]);

                return response()->json([
                    'message' => 'Success!',
                    'timezone' => $timezone,
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'dataParameterLimit' => $paramLimit,
                    'paramAvailable' => $paramAvailable,
                    'data' => $dataTable->paginate(20)->onEachSide(0)->appends($request->input()),
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }

        //endregion

        //region Handle Last Power Status
        public function handleDataChartPower(Request $request): JsonResponse {
            try {
                $dataPlatform = (new Platform)->where('uid', $request->input('platformUid'))->get()->first();
                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $minDate = env('APP_ENV') == 'local' ? $this->localDate . ' 00:00' : Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = env('APP_ENV') == 'local' ? $this->localDate . ' ' . Carbon::now()->timezone($timezone)->format('H:i') : Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                $dataLastParam = Parameter::dataParameterByUid([
                    'platformUid' => $request->input('platformUid'),
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'timezone' => $timezone,
                    'sort' => 'DESC'
                ])->get()->first();

                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataLastParam,
                    'responseTime' => now()
                ]);
            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Data Charts Power Status
        public function handleDataChartPowerStatus(Request $request): JsonResponse {
            try {
                $dataPlatform = (new Platform)->where('uid', $request->input('platformUid'))->get()->first();
                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $minDate = env('APP_ENV') == 'local' ? $this->localDate . ' 00:00' : Carbon::now()->timezone($timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = env('APP_ENV') == 'local' ? $this->localDate . ' ' . Carbon::now()->timezone($timezone)->format('H:i') : Carbon::now()->timezone($timezone)->format('Y-m-d H:i');
                $dataChartPower = Parameter::dataParameterByUid([
                    'platformUid' => $request->input('platformUid'),
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'timezone' => $timezone,
                    'sort' => 'ASC'
                ])->get();

                $dataSolar = [];
                $dataBattery = [];
                $dataOutput = [];
                foreach ($dataChartPower as $item) {

                    $nilaiSolar = 0;
                    $nilaiBattery = 0;
                    $nilaiOutput = 0;
                    if ($request->input('type') == 'volt') {
                        $nilaiSolar = $item->solar_volt;
                        $nilaiBattery = $item->battery_volt;
                        $nilaiOutput = $item->output_volt;
                    } else if ($request->input('type') == 'ampere') {
                        $nilaiSolar = $item->solar_amp;
                        $nilaiBattery = $item->battery_amp;
                        $nilaiOutput = $item->output_amp;
                    } else if ($request->input('type') == 'wattage') {
                        $nilaiSolar = $item->solar_watt;
                        $nilaiBattery = $item->battery_percent;
                        $nilaiOutput = $item->output_watt;
                    }

                    $dataSolar[] = [
                        'marker' => [
                            'enabled' => false,
                            'fillColor' => '#fff',
                            'lineWidth' => 2,
                            'radius' => 5,
                            'lineColor' => '#ff002b',
                        ],
                        'x' => Carbon::createFromFormat('Y-m-d H:i:s', $item->datetime)->setTimezone($timezone)->getPreciseTimestamp(3),
                        'y' => (float)number_format($nilaiSolar, 2)
                    ];
                    $dataBattery[] = [
                        'marker' => [
                            'enabled' => false,
                            'fillColor' => '#fff',
                            'lineWidth' => 2,
                            'radius' => 5,
                            'lineColor' => '#29cc54',
                        ],
                        'x' => Carbon::createFromFormat('Y-m-d H:i:s', $item->datetime)->setTimezone($timezone)->getPreciseTimestamp(3),
                        'y' => (float)number_format($nilaiBattery, 2)
                    ];
                    $dataOutput[] = [
                        'marker' => [
                            'enabled' => false,
                            'fillColor' => '#fff',
                            'lineWidth' => 2,
                            'radius' => 5,
                            'lineColor' => '#496fe3',
                        ],
                        'x' => Carbon::createFromFormat('Y-m-d H:i:s', $item->datetime)->setTimezone($timezone)->getPreciseTimestamp(3),
                        'y' => (float)number_format($nilaiOutput, 2)
                    ];
                }

                $data = [
                    [
                        'type' => 'line',
                        'marker' => [
                            'symbol' => 'circle'
                        ],
                        'name' => 'Solar',
                        'color' => '#ff002b',
                        'data' => $dataSolar
                    ], [
                        'type' => 'line',
                        'marker' => [
                            'symbol' => 'circle'
                        ],
                        'name' => 'Battery',
                        'color' => '#29cc54',
                        'data' => $dataBattery
                    ], [
                        'type' => 'line',
                        'marker' => [
                            'symbol' => 'circle'
                        ],
                        'name' => 'Load',
                        'color' => '#496fe3',
                        'data' => $dataOutput
                    ]
                ];

                return response()->json([
                    'message' => 'Success!',
                    'data' => $data,
                    'minDate' => $minDate,
                    'maxDate' => $maxDate,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

        //region Handle Dokumen
        public function handleDataDokumen(Request $request): JsonResponse {
            try {

                $dataDokumen = (new PlatformDokumen)
                    ->where('platform_uid', $request->input('platformUid'))->get();

                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataDokumen,
                    'responseTime' => now()
                ]);

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . 'on line ' . $exception->getLine(),
                    'code' => $exception->getCode(),
                    'responseTime' => now()
                ], 500);
            }
        }
        //endregion

    }
