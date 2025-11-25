<?php

    namespace App\Http\Controllers\BeAqms\Reports;

    use App\Http\Controllers\Controller;
    use App\Models\BeAqms\Master\AqiCategories;
    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\Users\UserPlatforms;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\File;
    use Illuminate\View\View;

    class ControllerReportLogParameter extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/reports/data-log-parameter';
        }

        public function index(Request $request): View {
            $dataCompanies = Companies::all();

            $userPlatformId = null;
            $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->get();
            foreach ($userPlatformIds as $platformId) {
                $userPlatformId[] = $platformId->platform_id;
            }

            $dataAllPlatform = Platforms::dataPlatformByUserPlatform($userPlatformId)
                ->with('sites')->get();

            $dataAqiCat = AqiCategories::all();

            $dataPlatform = Platforms::dataPlatformByUserPlatform($userPlatformId)->first();
            $minDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 00:00';
            $maxDate = Carbon::now()->timezone($dataPlatform->timezone)->format('Y-m-d') . ' 23:59';
            if ($request->input('startDate')) {
                $minDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 00:00';
                $maxDate = Carbon::parse($request->input('startDate'))->format('Y-m-d') . ' 23:59';
            }

            if ($request->input('intervalData') != null) {
                if ($request->input('intervalData') == '600') {
                    $dataLogger = Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                        'search' => $request->input()
                    ])->with('limit');
                } else {
                    $dataLogger = Loggers::reportLoggerPerMenitData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                        'search' => $request->input()
                    ])->with('limit');
                }
            } else {
                $dataLogger = Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                    'search' => $request->input()
                ])->with('limit');
            }


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

                if ($request->input('intervalData') != null) {
                    if ($request->input('intervalData') == '600') {
                        $dataLogger = Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                            'search' => $request->input()
                        ])->with('limit');
                    } else {
                        $dataLogger = Loggers::reportLoggerPerMenitData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                            'search' => $request->input()
                        ])->with('limit');
                    }
                } else {
                    $dataLogger = Loggers::reportLoggerData($dataPlatform->uid, $minDate, $maxDate, $dataPlatform->timezone, [
                        'search' => $request->input()
                    ])->with('limit');
                }

                $dataLogger->chunk(50, function ($loggers) use ($sheet, $dataPlatform) {

                    static $globalRowNumber = 0;
                    $rows = [];
                    foreach ($loggers as $item) {
                        $globalRowNumber++;

                        $aqiCat = mb_convert_encoding($item->emoji, 'UTF-8', 'HTML-ENTITIES') . ' ' . $item->category_name_en;

                        $tsp = $item->max_tsp ?? $item->tsp;
                        if ($tsp > $item->limit->tsp_max_buffer && $tsp < $item->limit->tsp_max) {
                            $status = 'Moderate';
                        } else if ($tsp > $item->limit->tsp_max) {
                            $status = 'Not Good';
                        } else {
                            $status = 'Good';
                        }

                        $rows[] = [
                            $globalRowNumber,
                            $item->uid,
                            Carbon::parse($item->datetime_unix)->setTimezone($dataPlatform->timezone)->format('Y-m-d H:i:s') ?? '',
                            $item->max_pm_25 ?? $item->pm_25,
                            $item->max_tsp ? $item->max_tsp * 0.4 : $item->tsp,
                            $item->max_tsp ?? $item->tsp,
                            $item->noise_leq ?? $item->noise,
                            $item->max_aqi_index ?? $item->aqi_index,
                            $item->max_aqi_index_tsp ?? $item->aqi_index_tsp,
                            $status,
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
