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
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Storage;
    use Illuminate\View\View;

    class BeSparingControllerLogsParameter extends Controller {
        protected string $viewPath;

        public function __construct() {
            ini_set('memory_limit', '2048M');
            $this->viewPath = 'main.be-sparing.reports.logs-parameter';
        }

        public function index(Request $request): View {

            $dataPlatforms = Platform::platformComboByLimit(request()->user()->id_sparing)->with('site')->get();
            $platformUid = $request->input('platformUid') ?? $dataPlatforms[0]->uid;
            $tipeLogger = $request->input('tipeLogger') ?? $dataPlatforms[0]->tipe_logger;

            $paramLimit = (new ParameterLimit)
                ->where('uid', $platformUid)
                ->where('tipe_logger', $tipeLogger)
                ->get()->first();

            $dataParamAvailable = Platform::parameterAvailable($platformUid, $tipeLogger)->get()->first();
            $dataPlatform = (new Platform)
                ->where('uid', $platformUid)
                ->where('tipe_logger', $tipeLogger)
                ->get()->first();

            $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');
            $dataLogsParameter = Parameter::dataLogsParameter([
                'platformUid' => $platformUid,
                'tipeLogger' => $tipeLogger,
                'interval' => $request->input('interval') ?? '',
                'tanggal' => $request->input('tanggal') ?? Carbon::now()->format('Y-m-d'),
                'minDate' => $request->input('minDate') ?? Carbon::now()->format('Y-m-d') . ' 00:00',
                'maxDate' => $request->input('maxDate') ?? Carbon::now()->format('Y-m-d') . ' 23:59',
                'bulan' => $request->input('bulan') ?? '',
                'tahun' => $request->input('tahun') ?? '',
                'statusPlatform' => $request->input('statusPlatform') ?? '',
                'timezone' => $timezone
            ]);

            return view($this->viewPath . '.index', [
                'items' => $dataLogsParameter->paginate(20)->onEachSide(0),
                'dataPlatform' => $dataPlatforms,
                'paramLimit' => $paramLimit,
                'timezone' => $timezone,
                'paramAvailable' => $dataParamAvailable->site->customer->jenisIndustri
            ]);
        }

        //region Handle Export Excel
        public function handleExportExcel(Request $request): void {
            $dataUserSite = UserSite::where('user_id', request()->user()->id)->where('status_site', 1)->get();
            $site_ids = [];
            foreach ($dataUserSite as $item) {
                $site_ids[] = $item->site_id;
            }

            $dataPlatforms = Platform::platformByLimit($site_ids)->with('site')->get();
            $platformUid = $request->input('platformUid') ?? $dataPlatforms[0]->uid;
            $tipeLogger = $request->input('tipeLogger') ?? $dataPlatforms[0]->tipe_logger;

            $paramLimit = (new ParameterLimit)
                ->where('uid', $platformUid)
                ->where('tipe_logger', $tipeLogger)
                ->get()->first();

            $dataParamAvailable = Platform::parameterAvailable($platformUid, $tipeLogger)->get()->first();
            $paramAvailable = $dataParamAvailable->site->customer->jenisIndustri;
            $dataPlatform = (new Platform)
                ->where('uid', $platformUid)
                ->where('tipe_logger', $tipeLogger)
                ->get()->first();

            $timezone = Common::getNearestTimezone($dataPlatform->lat, $dataPlatform->lng, 'ID');
            $data = Parameter::dataLogsParameter([
                'platformUid' => $platformUid,
                'tipeLogger' => $tipeLogger,
                'interval' => $request->input('interval') ?? '',
                'tanggal' => $request->input('tanggal') ?? Carbon::now()->format('Y-m-d'),
                'minDate' => $request->input('minDate') ?? Carbon::now()->format('Y-m-d') . ' 00:00',
                'maxDate' => $request->input('maxDate') ?? Carbon::now()->format('Y-m-d') . ' 23:59',
                'bulan' => $request->input('bulan') ?? '',
                'tahun' => $request->input('tahun') ?? '',
                'statusPlatform' => $request->input('statusPlatform') ?? '',
                'timezone' => $timezone
            ])->get();

            //region Parsing Data
            $data_row = [];
            if (isset($data)) {
                $i = 0;
                foreach ($data as $item) {
                    $i++;

                    $calcDebitWarnInMinutes = $paramLimit->debit_warn;
                    $calcDebitWarnMinInMinutes = $paramLimit->debit_warn_min;
                    $calcDebitMutuMinInMinutes = $paramLimit->debit_mutu_min;
                    $calcDebitMutuInMinutes = $paramLimit->debit_mutu;

                    $nilaiPh = 0;
                    $nilaiDebit = 0;
                    $nilaiCod = 0;
                    $nilaiTss = 0;
                    $nilaiNh3n = 0;
                    $dataParamStatus = [];
                    if ($paramAvailable->paramPh == 1) {
                        $nilaiPh = $item->ph;
                        if (($item->ph > $paramLimit->ph_mutu_min && $item->ph <= $paramLimit->ph_warn_min) ||
                            ($item->ph >= $paramLimit->ph_warn_max && $item->ph < $paramLimit->ph_mutu_max)) {
                            $dataParamStatus[] = ['val' => 2];
                        } else if ($item->ph >= $paramLimit->ph_mutu_max || ($item->ph <= $paramLimit->ph_mutu_min && $paramLimit->ph_intermit === 0)) {
                            $dataParamStatus[] = ['val' => 3];
                        } else {
                            $dataParamStatus[] = ['val' => 1];
                        }
                    }

                    if ($paramAvailable->paramDebit == 1) {
                        $nilaiDebit = $item->debit;
                        if ($item->debit > $calcDebitWarnInMinutes && $item->debit <= $calcDebitWarnMinInMinutes || $item->debit >= $calcDebitMutuMinInMinutes && $item->debit < $calcDebitMutuInMinutes) {
                            $dataParamStatus[] = ['val' => 2];
                        } else if ($item->debit >= $calcDebitMutuInMinutes || ($item->debit <= $calcDebitWarnInMinutes && $paramLimit->debit_intermit === 0)) {
                            $dataParamStatus[] = ['val' => 3];
                        } else {
                            $dataParamStatus[] = ['val' => 1];
                        }
                    }

                    if ($paramAvailable->paramCod == 1) {
                        $nilaiCod = $item->cod;
                        if ($item->cod >= $paramLimit->cod_warn && $item->cod <= $paramLimit->cod_mutu) {
                            $dataParamStatus[] = ['val' => 2];
                        } else if ($item->cod > $paramLimit->cod_mutu || ($item->cod <= 0 && $paramLimit->cod_intermit === 0)) {
                            $dataParamStatus[] = ['val' => 3];
                        } else {
                            $dataParamStatus[] = ['val' => 1];
                        }
                    }

                    if ($paramAvailable->paramTss == 1) {
                        $nilaiTss = $item->tss;
                        if ($item->tss > $paramLimit->tss_warn && $item->tss <= $paramLimit->tss_warn_min || $item->tss >= $paramLimit->tss_mutu_min && $item->tss < $paramLimit->tss_mutu) {
                            $dataParamStatus[] = ['val' => 2];
                        } else if ($item->tss >= $paramLimit->tss_mutu || ($item->tss <= $paramLimit->tss_warn && $paramLimit->tss_intermit === 0)) {
                            $dataParamStatus[] = ['val' => 3];
                        } else {
                            $dataParamStatus[] = ['val' => 1];
                        }
                    }

                    if ($paramAvailable->paramNh3n == 1) {
                        $nilaiNh3n = $item->nh3n;
                        if ($item->nh3n >= $paramLimit->nh3n_warn && $item->nh3n <= $paramLimit->nh3n_mutu) {
                            $dataParamStatus[] = ['val' => 2];
                        } else if ($item->nh3n > $paramLimit->nh3n_mutu || ($item->nh3n <= 0 && $paramLimit->nh3n_intermit === 0)) {
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

                    $statusNilai = 'Normal';
                    if ($maxStatus == 2) {
                        $statusNilai = 'Warning';
                    } else if ($maxStatus == 3) {
                        $statusNilai = 'Danger';
                    }

                    $tanggal = Carbon::parse($item->datetime_formatted)->translatedFormat('Y-m-d H:i');
                    if ($request->input('interval') == '2') {
                        $tanggal = Carbon::parse($item->datetime_formatted)->translatedFormat('Y-m-d');
                    }

                    $data_params = [
                        $i,
                        $item->uid,
                        $item->platform->site->nama_site,
                        $tanggal,
                    ];

                    if ($paramAvailable->paramPh == 1)
                        $data_params = array_merge($data_params, [number_format($nilaiPh, 2)]);

                    if ($paramAvailable->paramCod == 1)
                        $data_params = array_merge($data_params, [number_format($nilaiCod, 2)]);

                    if ($paramAvailable->paramTss == 1)
                        $data_params = array_merge($data_params, [number_format($nilaiTss)]);

                    if ($paramAvailable->paramNh3n == 1)
                        $data_params = array_merge($data_params, [number_format($nilaiNh3n, 2)]);

                    if ($paramAvailable->paramDebit == 1)
                        $data_params = array_merge($data_params, [number_format($nilaiDebit, 2)]);

                    $data_row[] = array_merge($data_params, [
                        $item->platform->site->customer->nama_perusahaan,
                        $statusNilai
                    ]);
                }
            }
            //endregion

            //region Handle Head
            //region Head Master
            $head = [
                'No' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 8,
                    ]
                ],
                'UID' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 'auto',
                    ]
                ],
                'Site' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 'auto',
                    ]
                ],
                'Date & Time' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 'auto',
                    ]
                ],
            ];
            //endregion
            //region Head pH
            if ($paramAvailable->paramPh == 1) {
                $head = array_merge($head, [
                    'pH' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 12
                        ]
                    ]
                ]);
            }
            //endregion
            //region Head COD
            if ($paramAvailable->paramCod == 1) {
                $head = array_merge($head, [
                    'COD (mg/L)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 12
                        ]
                    ]
                ]);
            }
            //endregion
            //region Head TSS
            if ($paramAvailable->paramTss == 1) {
                $head = array_merge($head, [
                    'TSS (mg/L)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 12
                        ]
                    ]
                ]);
            }
            //endregion
            //region Head NH3N
            if ($paramAvailable->paramNh3n == 1) {
                $head = array_merge($head, [
                    'NH3N (mg/L)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 12
                        ]
                    ]
                ]);
            }
            //endregion
            //region Head Debit
            if ($paramAvailable->paramDebit == 1) {
                $head = array_merge($head, [
                    'Debit (m3)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 12
                        ]
                    ]
                ]);
            }
            //endregion
            $head = array_merge($head, [
                'Perusahaan' => [
                    'props' => [
                        'align' => 'left',
                        'width' => 'auto'
                    ]
                ],
                'Status' => [
                    'props' => [
                        'align' => 'center',
                        'width' => 'auto'
                    ]
                ]
            ]);
            //endregion

            $excel = Excel::create(['Sheet1']);
            $sheet = $excel->getSheet();


            $platformUid = $request->input('platformUid') ?? $dataPlatform->uid;
            $tipeLogger = $request->input('tipeLogger') == 1 ? 'Internal' : 'KLHK';
            $parseMinDate = Carbon::parse($request->input('minDate'));
            $parseMaxDate = Carbon::parse($request->input('maxDate'));

            $filenamePeriode = $parseMinDate->translatedFormat('Ymd_Hi') . '-' . $parseMaxDate->translatedFormat('Ymd_Hi');
            $titlePeriode = 'Periode ' . $parseMinDate->translatedFormat('d/M/Y H:i') . ' s/d ' . $parseMaxDate->translatedFormat('d/M/Y H:i');

            if ($request->input('interval') == '1') {
                $parseTanggal = Carbon::parse($request->input('tanggal'));
                $filenamePeriode = $parseTanggal->translatedFormat('Ymd');
                $titlePeriode = 'Tanggal ' . $parseTanggal->translatedFormat('d/M/Y') . ' - Average 1 Hari';
            } else if ($request->input('interval') == '2') {
                $parseBulan = Carbon::parse($request->input('tahun') . '-' . $request->input('bulan') . '-01');
                $filenamePeriode = $parseBulan->translatedFormat('F-Y');
                $titlePeriode = 'Periode ' . $parseBulan->translatedFormat('F Y') . ' - Average 1 Bulan';
            }

            $highColumn = Common::numToExcelAlpha(count($head));
            $sheet->mergeCells('A1:' . $highColumn . '1');
            $sheet->writeCell('Logs Parameter - ' . $platformUid . ' / ' . $tipeLogger, [
                'text-align' => 'center'
            ]);
            $sheet->nextRow();
            $sheet->mergeCells('A2:' . $highColumn . '2');
            $sheet->writeCell($titlePeriode, [
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

            $excel->output('LogsParameter-' . $platformUid . '-' . str_replace(' ', '', $tipeLogger) . '-' . $filenamePeriode . '.xlsx');
        }
        //endregion

    }
