<?php

    namespace App\Http\Controllers\BeSparing\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Controllers\WeekCalculator;
    use App\Http\Helper\Common;
    use App\Models\BeSparing\Karyawan\UserSite;
    use App\Models\BeSparing\Master\Customer;
    use App\Models\BeSparing\Master\Parameter;
    use App\Models\BeSparing\Master\ParameterLimit;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\BeSparing\Master\PlatformWeeklySummary;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class BeSparingControllerWeeklySummary extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main.be-sparing.reports.weekly-summary';
        }

        public function index(Request $request): View {

            $dataCustomer = Customer::with('jenisIndustri')->get();
            $dataPlatforms = Platform::platformComboByLimit(request()->user()->id_sparing)->with('site')->get();
            $weekCalculator = new WeekCalculator();
            $weekAllYear = $weekCalculator->getAllWeeksInYear(2025);
            $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
            $weekInfo = $week['weekInfo'];
            $weekNumb = $week['weekNumber'];

            $uid = $request->input('platformUid') ?? null;
            $tipeLogger = $request->input('tipe_logger') ?? 2;
            $siteLokasiId = $request->input('customer_lokasi_id') ?? null;
            $startDate = $weekInfo['startDate'];
            $untilDate = $weekInfo['untilDate'];
            if ($request->input('date') && $request->input('date') != '') {
                $weekExplode = explode('_', $request->input('date'));
                $week = $weekCalculator->getWeekInfoForDate($weekExplode[0]);
                $weekInfo = $week['weekInfo'];
                $weekNumb = $week['weekNumber'];

                $startDate = $weekExplode[0];
                $untilDate = $weekExplode[1];
            }

            $dataParam = PlatformWeeklySummary::dataWeekly($startDate, $untilDate, request()->user()->id_sparing, $siteLokasiId, $tipeLogger)
                ->with('platform.site.customerLokasi');

            return view($this->viewPath . '.index', [
                'customer' => $dataCustomer,
                'items' => $dataParam->paginate(20)->onEachSide(1),
                'dataPlatform' => $dataPlatforms,
                'weeks' => $weekAllYear,
                'weekInfo' => $weekInfo,
                'weekNumb' => $weekNumb,
            ]);
        }

        public function handleExportExcel(Request $request) {
            try {

                $weekCalculator = new WeekCalculator();
                $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
                $weekInfo = $week['weekInfo'];
                $weekNumb = $week['weekNumber'];

                $uid = $request->input('platformUid') ?? null;
                $tipeLogger = $request->input('tipe_logger') ?? 2;
                $siteLokasiId = $request->input('customer_lokasi_id') ?? null;
                $startDate = $weekInfo['startDate'];
                $untilDate = $weekInfo['untilDate'];
                if ($request->input('date') && $request->input('date') != '') {
                    $weekExplode = explode('_', $request->input('date'));
                    $week = $weekCalculator->getWeekInfoForDate($weekExplode[0]);
                    $weekInfo = $week['weekInfo'];
                    $weekNumb = $week['weekNumber'];

                    $startDate = $weekExplode[0];
                    $untilDate = $weekExplode[1];
                }

                $dataParam = PlatformWeeklySummary::dataWeekly($startDate, $untilDate, request()->user()->id_sparing, $siteLokasiId, $tipeLogger)
                    ->with('platform.site.customerLokasi')->get();

                $data_row = [];
                if (isset($dataParam)) {
                    $i = 0;
                    foreach ($dataParam as $item) {
                        $i++;

                        $tipeLogger = 'Internal';
                        if ($item->tipe_logger == 2)
                            $tipeLogger = 'KLHK';

                        $data_row[] = [
                            $i,
                            $item->platform->site->customerLokasi->nama_lokasi ?? '-',
                            $item->uid,
                            $tipeLogger,
                            round($item->data_entry, 2),
                            round($item->ph_comply, 2),
                            round($item->tss_comply, 2),
                            round($item->debit_comply, 2)
                        ];
                    }
                }

                $head = [
                    'No' => [
                        'props' => [
                            'align' => 'center',
                            'width' => 8,
                        ]
                    ],
                    'Site / Lokasi' => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                        ]
                    ],
                    'UID' => [
                        'props' => [
                            'align' => 'center',
                            'width' => 'auto',
                        ]
                    ],
                    'Tipe Logger' => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                        ]
                    ],
                    'Data Entry (%)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'pH (%)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'TSS (%)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'Debit (%)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                ];

                $excel = Excel::create(['Sheet1']);
                $sheet = $excel->getSheet();

                $highColumn = Common::numToExcelAlpha(count($head));
                $sheet->mergeCells('A1:' . $highColumn . '1');
                $sheet->writeCell('Week Summary', [
                    'text-align' => 'center'
                ]);
                $sheet->nextRow();
                $sheet->mergeCells('A2:' . $highColumn . '2');
                $sheet->writeCell($weekNumb . ' - ' . $weekInfo['startDateFormatted'] . ' - ' . $weekInfo['untilDateFormatted'], [
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

                $excel->output('WeeklySummary-' . $weekNumb . '.xlsx');

            } catch (Exception $exception) {
                abort(500, $exception->getMessage());
            }
        }

    }
