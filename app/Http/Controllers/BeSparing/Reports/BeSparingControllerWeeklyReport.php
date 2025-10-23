<?php

    namespace App\Http\Controllers\BeSparing\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Controllers\WeekCalculator;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class BeSparingControllerWeeklyReport extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.reports.weekly-report';
        }

        public function index(Request $request): View {

            $dataPlatform = Platform::platformByLimit(request()->user()->id_sparing)->with('site')->get();
            $dataPlatformSelected = (new Platform)
                ->where('uid', $request->input('platformUid') ?? $dataPlatform[0]->uid)
                ->where('tipe_logger', $request->input('tipeLogger') ?? $dataPlatform[0]->tipe_logger)
                ->get()->first();

            $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');
            return view($this->viewPath . '.index', [
                'dataPlatform' => $dataPlatform,
                'timezone' => $timezone
            ]);
        }

        public function handleDataAvgParameterWeekly(Request $request) {
            try {

                $dataPlatformSelected = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');
                $dataAvgParameter = Parameter::dataAvgParameterWeekly($request->input('platformUid'), $request->input('tipeLogger'), $request->input('month'), $request->input('year'), $timezone)->first();

                return response()->json([
                    'message' => 'Success!',
                    'data' => $dataAvgParameter,
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

        // function countDaysInRange($startDate, $endDate) {
        //     // Convert string dates to Carbon instances
        //     $start = Carbon::parse($startDate);
        //     $end = Carbon::parse($endDate);
        //
        //     // Add 1 because diffInDays is exclusive of the end date
        //     return $end->diffInDays($start) + 1;
        // }
        //
        // function getWeekGroupingWithDays($year, $month) {
        //     // Inisialisasi Carbon untuk tanggal pertama bulan
        //     $date = Carbon::createFromDate($year, $month, 1);
        //
        //     // Mendapatkan jumlah hari dalam bulan
        //     $daysInMonth = $date->daysInMonth;
        //
        //     // Menghitung hari per minggu
        //     $daysPerWeek = ceil($daysInMonth / 4);
        //
        //     // Inisialisasi array untuk menyimpan hasil pengelompokan
        //     $weekGroups = [];
        //
        //     for ($week = 1; $week <= 4; $week++) {
        //         $startDay = ($week - 1) * $daysPerWeek;
        //         $endDay = min($week * $daysPerWeek - 1, $daysInMonth - 1);
        //
        //         $startDate = $date->copy()->addDays($startDay)->format('Y-m-d');
        //         $endDate = $date->copy()->addDays($endDay)->format('Y-m-d');
        //
        //         $weekGroups["Week $week"] = [
        //             'startDate' => $startDate,
        //             'untilDate' => $endDate,
        //             'totalDays' => $this->countDaysInRange($startDate, $endDate)
        //         ];
        //     }
        //
        //     return $weekGroups;
        // }

        //region Handle Data Entry Charts
        public function handleDataEntryCharts(Request $request) {
            try {

                $dataPlatformSelected = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');

                $weekCalculator = new WeekCalculator();
                $weekGroups = $weekCalculator->getWeekGroupings($request->input('year'), $request->input('month'));

                $dataWeek = [];
                $dataCategories = [];
                $data = [];
                $dataComply = [];
                foreach ($weekGroups as $week => $dates) {
                    $dataCategories[] = $week;
                    $dataWeek[] = $dates;

                    $totalSample = $dates['totalDays'] * 720;
                    $dataEntry = Parameter::dataPercentageEntryWeekly($request->input('platformUid'), $request->input('tipeLogger'), $dates['startDate'], $dates['untilDate'], $timezone, $totalSample)->first();
                    $data[] = round($dataEntry->percentage ?? 0, 2);

                    $dataEntryComply = Parameter::dataPersentaseComplyWeekly($request->input('platformUid'), $request->input('tipeLogger'), $dates['startDate'], $dates['untilDate'], $timezone)->first();
                    $dataComply[] = round($dataEntryComply->percentagePh ?? 0, 2);
                }

                return response()->json([
                    'message' => 'Success!',
                    'dataWeek' => $dataWeek,
                    'dataCategories' => $dataCategories,
                    'data' => $data,
                    'dataComply' => $dataComply,
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

        //region Handle Data Comply Charts
        public function handleDataComplyCharts(Request $request) {
            try {

                $dataPlatformSelected = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');

                $weekCalculator = new WeekCalculator();
                $weekGroups = $weekCalculator->getWeekGroupings($request->input('year'), $request->input('month'));

                $dataCategories = [];
                $dataComplyPh = [];
                $dataComplyTss = [];
                $dataComplyDebit = [];
                foreach ($weekGroups as $week => $dates) {
                    $dataCategories[] = $week;

                    $dataEntryComply = Parameter::dataPersentaseComplyWeekly($request->input('platformUid'), $request->input('tipeLogger'), $dates['startDate'], $dates['untilDate'], $timezone)->first();
                    $dataComplyPh[] = round($dataEntryComply->percentagePh ?? 0, 2);
                    $dataComplyTss[] = round($dataEntryComply->percentageTss ?? 0, 2);
                    $dataComplyDebit[] = round($dataEntryComply->percentageDebit ?? 0, 2);
                }

                $dataComply = [
                    [
                        'name' => 'pH',
                        'type' => 'column',
                        'data' => $dataComplyPh
                    ],
                    [
                        'name' => 'TSS',
                        'type' => 'column',
                        'data' => $dataComplyTss
                    ],
                    [
                        'name' => 'Debit',
                        'type' => 'column',
                        'data' => $dataComplyDebit
                    ]
                ];

                return response()->json([
                    'message' => 'Success!',
                    'dataCategories' => $dataCategories,
                    'data' => $dataComply,
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

        //region Handle Data Sensor
        public function handleDataSensorCharts(Request $request) {
            try {

                $dataPlatformSelected = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();
                $timezone = Common::getNearestTimezone($dataPlatformSelected->lat, $dataPlatformSelected->lng, 'ID');

                $paramLimit = (new ParameterLimit)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $weekCalculator = new WeekCalculator();
                $weekGroups = $weekCalculator->getWeekGroupings($request->input('year'), $request->input('month'));

                $dataX = [];
                foreach ($weekGroups as $i => $week) {
                    $dataSensor = Parameter::dataSensorWeekly($request->input('platformUid'), $request->input('tipeLogger'), $week['startDate'], $week['untilDate'], $timezone)->get();
                    $data = [];

                    foreach ($dataSensor as $item) {
                        $param = '';
                        $paramLimitCond = '';
                        switch ($request->input('parameterId')) {
                            case 'pH':
                                $param = round($item->ph, 2);
                                $paramLimitCond = $item->ph < $paramLimit->ph_mutu_min || $item->ph > $paramLimit->ph_mutu_max;
                                break;
                            case 'Debit':
                                $param = round($item->debit, 2);
                                $paramLimitCond = $item->debit > $paramLimit->debit_mutu || $item->debit <= 0;
                                break;
                            case 'COD':
                                $param = round($item->cod, 2);
                                $paramLimitCond = $item->cod > $paramLimit->cod_mutu || ($item->cod <= 0 && $paramLimit->cod_intermit === 0);
                                break;
                            case 'TSS':
                                $param = floor($item->tss);
                                $paramLimitCond = $item->tss > $paramLimit->tss_mutu || ($item->tss <= 0 && $paramLimit->tss_intermit === 0);
                                $paramTss = $item->tss;
                                break;
                            case 'NH3N':
                                $param = round($item->nh3n, 2);
                                $paramLimitCond = $item->nh3n > $paramLimit->nh3n_mutu || ($item->nh3n <= 0 && $paramLimit->nh3n_intermit === 0);
                                break;
                        }

                        $data[] = [
                            'marker' => [
                                'enabled' => $paramLimitCond,
                                'fillColor' => '#fff',
                                'lineWidth' => 2,
                                'radius' => 5,
                                'lineColor' => $paramLimitCond ? '#ff002b' : '#7bb4ec',
                            ],
                            'x' => Carbon::createFromTimestamp($item->datetime_unix_interval)->setTimezone($timezone)->getPreciseTimestamp(3),
                            'y' => $param
                        ];
                    }

                    $dataX[] = [
                        'type' => 'line',
                        'name' => $i,
                        'showInLegend' => true,
                        'data' => $data
                    ];
                }

                $dataYaxis = [];
                if ($request->input('parameterId') == 'pH') {
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
                    'data' => $dataX,
                    'dataYaxis' => $dataYaxis,
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
