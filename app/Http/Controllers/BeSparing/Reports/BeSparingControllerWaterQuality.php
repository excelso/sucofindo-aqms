<?php

    namespace App\Http\Controllers\BeSparing\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Cache\Repository;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Cache;
    use Illuminate\Support\Facades\Storage;
    use Illuminate\View\View;

    class BeSparingControllerWaterQuality extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.reports.water-quality';
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

        //region Handle Data Charts
        public function handleDataCharts(Request $request): JsonResponse {
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
                $dataCharts = Parameter::dataCharts($request->input('platformUid'), $request->input('tipeLogger'), $request->input('minDate'), $request->input('maxDate'), $timezone)->get();
                $data = [];
                $paramTss = 0;
                foreach ($dataCharts as $item) {
                    $param = '';
                    $paramLimitCond = '';
                    switch ($request->input('parameterId')) {
                        case 'pH':
                            $param = $item->ph;
                            $paramLimitCond = $item->ph < $paramLimit->ph_mutu_min || $item->ph > $paramLimit->ph_mutu_max;
                            break;
                        case 'Debit':
                            $param = $item->debit;
                            $paramLimitCond = $item->debit > $paramLimit->debit_mutu || $item->debit <= 0;
                            break;
                        case 'COD':
                            $param = $item->cod;
                            $paramLimitCond = $item->cod > $paramLimit->cod_mutu || ($item->cod <= 0 && $paramLimit->cod_intermit === 0);
                            break;
                        case 'TSS':
                            $param = (int)floor($item->tss);
                            $paramLimitCond = $item->tss > $paramLimit->tss_mutu || ($item->tss <= 0 && $paramLimit->tss_intermit === 0);
                            $paramTss = $item->tss;
                            break;
                        case 'NH3N':
                            $param = $item->nh3n;
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
                        'x' => Carbon::parse($item->datetime)->setTimezone($timezone)->getPreciseTimestamp(3),
                        'y' => $param
                    ];
                }


                $dataXaxis = [];
                $dataYaxis = [];
                if ($request->input('parameterId') == 'pH') {
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
                    'dataYaxis' => $dataYaxis,
                    'data' => $dataXaxis,
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

        //region Handle Data Persentase
        public function handleDataPersentase(Request $request): JsonResponse {
            try {
                $dataPlatform = (new Platform)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();
                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $dataPersentase = Parameter::dataPersentase($request->input('platformUid'), $request->input('tipeLogger'), $request->input('minDate'), $request->input('maxDate'), $timezone)->get()->first();

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
                $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

                $paramLimit = (new ParameterLimit)
                    ->where('uid', $request->input('platformUid'))
                    ->where('tipe_logger', $request->input('tipeLogger'))
                    ->get()->first();

                $dataTable = Parameter::dataTable($request->input('platformUid'), $request->input('tipeLogger'), $request->input('minDate'), $request->input('maxDate'), $timezone);
                return response()->json([
                    'message' => 'Success!',
                    'dataParameter' => $request->input('parameterId'),
                    'dataParameterLimit' => $paramLimit,
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

        //region Handle Export Excel
        public function handleExportExcel(Request $request): void {
            $dataPlatform = (new Platform)
                ->where('uid', $request->input('platformUid'))
                ->where('tipe_logger', $request->input('tipeLogger'))
                ->get()->first();

            $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');

            $data = Parameter::dataTable($request->input('platformUid'), $request->input('tipeLogger'), $request->input('minDate'), $request->input('maxDate'), $timezone)->get();
            $paramLimit = (new ParameterLimit)
                ->where('uid', $request->input('platformUid'))
                ->where('tipe_logger', $request->input('tipeLogger'))
                ->get()->first();

            $data_row = [];
            if (isset($data)) {
                $i = 0;
                foreach ($data as $item) {
                    $i++;

                    $calcDebitWarnInMinutes = $paramLimit->debit_warn;
                    $calcDebitWarnMinInMinutes = $paramLimit->debit_warn_min;
                    $calcDebitMutuMinInMinutes = $paramLimit->debit_mutu_min;
                    $calcDebitMutuInMinutes = $paramLimit->debit_mutu;

                    $nilai = 0;
                    $statusNilai = '';
                    if ($request->input('parameterId') == 'pH') {
                        $nilai = $item->ph;
                        if (($item->ph > $paramLimit->ph_mutu_min && $item->ph <= $paramLimit->ph_warn_min) ||
                            ($item->ph >= $paramLimit->ph_warn_max && $item->ph < $paramLimit->ph_mutu_max)) {
                            $statusNilai = 'Warning';
                        } else if ($item->ph >= $paramLimit->ph_mutu_max || ($item->ph <= $paramLimit->ph_mutu_min && $paramLimit->ph_intermit === 0)) {
                            $statusNilai = 'Danger';
                        } else {
                            $statusNilai = 'Normal';
                        }
                    } else if ($request->input('parameterId') == 'Debit') {
                        $nilai = $item->debit;
                        if ($item->debit > $calcDebitWarnInMinutes && $item->debit <= $calcDebitWarnMinInMinutes || $item->debit >= $calcDebitMutuMinInMinutes && $item->debit <= $calcDebitMutuInMinutes) {
                            $statusNilai = 'Warning';
                        } else if ($item->debit >= $calcDebitMutuInMinutes || ($item->debit <= $calcDebitWarnInMinutes && $paramLimit->debit_intermit === 0)) {
                            $statusNilai = 'Danger';
                        } else {
                            $statusNilai = 'Normal';
                        }
                    } else if ($request->input('parameterId') == 'COD') {
                        $nilai = $item->cod;
                        if ($item->cod >= $paramLimit->cod_warn && $item->cod <= $paramLimit->cod_mutu) {
                            $statusNilai = 'Warning';
                        } else if ($item->cod > $paramLimit->cod_mutu || ($item->cod <= 0 && $paramLimit->cod_intermit === 0)) {
                            $statusNilai = 'Danger';
                        } else {
                            $statusNilai = 'Normal';
                        }
                    } else if ($request->input('parameterId') == 'TSS') {
                        $nilai = floor($item->tss);
                        if ($item->tss > $paramLimit->tss_warn && $item->tss <= $paramLimit->tss_warn_min || $item->tss >= $paramLimit->tss_mutu_min && $item->tss < $paramLimit->tss_mutu) {
                            $statusNilai = 'Warning';
                        } else if ($item->tss > $paramLimit->tss_mutu || ($item->tss <= $paramLimit->tss_warn && $paramLimit->tss_intermit === 0)) {
                            $statusNilai = 'Danger';
                        } else {
                            $statusNilai = 'Normal';
                        }
                    } else if ($request->input('parameterId') == 'NH3N') {
                        $nilai = $item->nh3n;
                        if ($item->nh3n >= $paramLimit->nh3n_warn && $item->nh3n <= $paramLimit->nh3n_mutu) {
                            $statusNilai = 'Warning';
                        } else if ($item->nh3n > $paramLimit->nh3n_mutu || ($item->nh3n <= 0 && $paramLimit->nh3n_intermit === 0)) {
                            $statusNilai = 'Danger';
                        } else {
                            $statusNilai = 'Normal';
                        }
                    }

                    $data_row[] = [
                        $i,
                        $item->datetime_formatted,
                        number_format($nilai, 2),
                        $statusNilai
                    ];
                }
            }

            $head = [
                'No' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 12,
                    ]
                ],
                'Date & Time' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 22,
                    ]
                ],
                'Nilai ' . $request->input('parameterId') => [
                    'props' => [
                        'align' => 'right',
                        'width' => 'auto',
                    ]
                ],
                'Status Platform' => [
                    'props' => [
                        'align' => 'left',
                        'width' => 22,
                    ]
                ]
            ];

            $excel = Excel::create(['Sheet1']);
            $sheet = $excel->getSheet();

            $parseMinDate = Carbon::parse($request->input('minDate'));
            $parseMaxDate = Carbon::parse($request->input('maxDate'));
            $minDate = $parseMinDate->format('Y-m-d');
            $maxDate = $parseMaxDate->format('Y-m-d');

            $filenamePeriode = $parseMinDate->translatedFormat('Ymd_Hi');
            $titlePeriode = $parseMinDate->translatedFormat('d/M/Y H:i');
            if ($minDate != $maxDate) {
                $filenamePeriode = $parseMinDate->translatedFormat('Ymd_Hi') . '-' . $parseMaxDate->translatedFormat('Ymd_Hi');
                $titlePeriode = $parseMinDate->translatedFormat('d/M/Y H:i') . ' s/d ' . $parseMaxDate->translatedFormat('d/M/Y H:i');
            }

            $highColumn = Common::numToExcelAlpha(count($head));
            $sheet->mergeCells('A1:' . $highColumn . '1');
            $sheet->writeCell('Water Quality - ' . $request->input('platformUid'), [
                'text-align' => 'center'
            ]);
            $sheet->nextRow();
            $sheet->mergeCells('A2:' . $highColumn . '2');
            $sheet->writeCell('Periode ' . $titlePeriode, [
                'text-align' => 'center'
            ]);
            $sheet->nextRow();

            $headIndex = 0;
            $colsStyle = [];
            foreach ($head as $item => $value) {
                $headIndex++;
                $highColumn = Common::numToExcelAlpha($headIndex);

                $header_prop_align = 'left';
                $header_prop_width = 'auto';
                if (isset($value['props'])) {
                    $header_prop = $value['props'];
                    $header_prop_align = $header_prop['align'] ?? 'left';
                    $header_prop_width = $header_prop['width'] ?? 'auto';
                }

                $colsStyle[] = [
                    $highColumn => [
                        'text-align' => $header_prop_align,
                        'width' => $header_prop_width,
                        'vertical-align' => 'center',
                        'border' => [
                            Style::BORDER_BOTTOM => Style::BORDER_THIN
                        ]
                    ]
                ];
            }

            $sheet->setColOptions(array_merge([], ...$colsStyle));
            $sheet->writeRow(array_keys($head), [
                'font' => [
                    'style' => 'bold'
                ],
                'border' => [
                    Style::BORDER_TOP => Style::BORDER_THIN,
                    Style::BORDER_BOTTOM => Style::BORDER_DOUBLE
                ],
                'height' => 24,
            ]);
            $sheet->nextRow();

            foreach ($data_row as $rowData) {
                $sheet->writeRow($rowData);
            }

            $excel->output('WaterQuality-' . $request->input('platformUid') . '-' . $request->input('parameterId') . '-' . $filenamePeriode . '.xlsx');
        }
        //endregion
    }
