<?php

    namespace App\Http\Controllers\Reports;

    use App\Http\Controllers\Controller;
    use App\Models\Master\AqiCategories;
    use App\Models\Master\Companies;
    use App\Models\Master\CompaniesSites;
    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\File;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\View\View;
    use Throwable;

    class ControllerReportLogParameter extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/reports/data-log-parameter';
        }

        public function index(Request $request): View {
            $dataCompanies = Companies::all();

            $dataAllPlatform = Platforms::orderBy('uid', 'ASC')
                ->with('sites')->get();

            $dataAqiCat = AqiCategories::all();

            $dataPlatform = Platforms::orderBy('uid', 'ASC')->first();
            $minDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 00:00';
            $maxDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 23:59';
            if ($request->input('startDate')) {
                $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
            }

            $dataLogger = Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                'search' => $request->input()
            ]);

            return view($this->viewPath . '/index', [
                'items' => $dataLogger->paginate(20)->onEachSide(1),
                'dataAllPlatform' => $dataAllPlatform,
                'dataAqiCat' => $dataAqiCat,
                'platform' => $dataPlatform,
                'companies' => $dataCompanies,
            ]);
        }

        //region Export Excel
        private static function numToExcelAlpha($n): int|string {
            $r = 'A';
            while ($n-- > 1) {
                $r++;
            }
            return $r;
        }

        public function exportExcel(Request $request) {
            try {

                $excel = Excel::create(['Report']);

                //region Handle Head & Style
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
                    'Date & Time' => [
                        'props' => [
                            'align' => 'center',
                            'width' => 'auto',
                        ]
                    ],
                    'PM 2.5' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'PM 10' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'TSP' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'Noise' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'AQI Index (PM 2.5 / PM 10)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'AQI Index (TSP)' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    'AQI Category' => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                        ]
                    ],
                ];

                $sheet = $excel->getSheet(1);

                $headIndex = 0;
                $colsStyle = [];
                foreach ($head as $key => $value) {
                    $headIndex++;
                    $highColumn = $this->numToExcelAlpha($headIndex);

                    $header_prop_align = 'left';
                    $header_prop_width = 'auto';
                    $header_prop_format = '';
                    $header_prop_warp = '';
                    if (isset($value['props'])) {
                        $header_prop = $value['props'];
                        $header_prop_align = $header_prop['align'] ?? 'left';
                        $header_prop_width = $header_prop['width'] ?? 'auto';
                        $header_prop_format = $header_prop['format'] ?? '';
                        $header_prop_warp = $header_prop['warp'] ?? '';
                    }

                    $styles = [
                        $highColumn => [
                            'text-align' => $header_prop_align,
                            'width' => $header_prop_width,
                            'format' => $header_prop_format,
                            'text-wrap' => $header_prop_warp,
                            'vertical-align' => 'center',
                            'border' => [
                                Style::BORDER_BOTTOM => Style::BORDER_THIN
                            ]
                        ]
                    ];

                    $colsStyle[] = $styles;
                    $sheet->writeTo($highColumn . '1', $key, [
                        'text-align' => $header_prop_align,
                        'width' => $header_prop_width,
                        'vertical-align' => 'center',
                        'font' => [
                            'style' => 'bold'
                        ],
                        'border' => [
                            Style::BORDER_TOP => Style::BORDER_THIN,
                            Style::BORDER_BOTTOM => Style::BORDER_DOUBLE
                        ],
                        'height' => 24,
                    ]);
                }
                //endregion

                $sheet->nextRow();
                $sheet->setColOptions(array_merge([], ...$colsStyle));

                $dataPlatform = Platforms::orderBy('uid', 'ASC')->first();
                $minDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 23:59';
                if ($request->input('startDate')) {
                    $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                    $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
                }

                Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                    'search' => $request->input()
                ])->chunk(50, function ($loggers) use ($sheet, $dataPlatform) {

                    static $globalRowNumber = 0;
                    $rows = [];
                    foreach ($loggers as $item) {
                        $globalRowNumber++;

                        $aqiCat = mb_convert_encoding($item->emoji, 'UTF-8', 'HTML-ENTITIES') . ' ' . $item->category_name_en;
                        $rows[] = [
                            $globalRowNumber,
                            $item->uid,
                            Carbon::parse($item->datetime_unix)->setTimezone($dataPlatform->timezone)->format('Y-m-d H:i:s') ?? '',
                            $item->max_pm_25 ?? 0,
                            $item->max_pm_10 ?? 0,
                            $item->max_tsp ?? 0,
                            $item->noise_leq,
                            $item->max_aqi_index ?? 0,
                            $item->max_aqi_index_tsp ?? 0,
                            $aqiCat,
                        ];
                    }

                    foreach ($rows as $row) {
                        $sheet->writeRow($row);
                    }
                });

                $filename = 'detailed_report_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
                $directory = storage_path('app/public/platforms');

                if (!File::exists($directory)) {
                    File::makeDirectory($directory, 0755, true);
                }

                $filePath = $directory . '/' . $filename;
                $excel->save($filePath);

                return response()->download($filePath, $filename)
                    ->deleteFileAfterSend();

            } catch (Exception $exception) {
                return response()->json([
                    'message' => $exception->getMessage() . ' on line ' . $exception->getLine(),
                    'file' => $exception->getFile(),
                    'responseTime' => Carbon::now()
                ], 500);
            }
        }
        //endregion
    }
