<?php

    namespace App\Http\Controllers\BeAqms\Reports;

    use App\Http\Controllers\Controller;
    use App\Http\Controllers\WeekCalculator;
    use App\Http\Helper\Common;
    use App\Models\BeAqms\Master\Companies;
    use App\Models\BeAqms\Master\Loggers;
    use App\Models\BeAqms\Master\Platforms;
    use App\Models\BeAqms\Master\PlatformsHeartbeat;
    use App\Models\Users\UserPlatforms;
    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Http\Request;
    use Illuminate\View\View;

    class ControllerReportWeeklySummary extends Controller {
        protected string $viewPath;

        public function __construct() {
            $this->viewPath = 'main/be-aqms/reports/data-weekly-summary';
        }

        public function index(Request $request): View {
            $dataCompanies = Companies::all();
            $weekCalculator = new WeekCalculator();
            $weekAllYear = $weekCalculator->getAllWeeksInYear(date('Y'));
            $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
            $weekInfo = $week['weekInfo'];
            $weekNumb = $week['weekNumber'];

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

            $userPlatformId = null;
            $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->get();
            foreach ($userPlatformIds as $platformId) {
                $userPlatformId[] = $platformId->platform_id;
            }

            $data = Platforms::dataWeeklySummary($startDate, $untilDate, 'Asia/Makassar', 10080, $userPlatformId, $request->input('site_id') ?? null);

            return view($this->viewPath . '.index', [
                'companies' => $dataCompanies,
                'items' => $data->paginate(20)->onEachSide(1),
                'weeks' => $weekAllYear,
                'weekInfo' => $weekInfo,
                'weekNumb' => $weekNumb,
            ]);
        }

        public function handleExportExcel(Request $request) {
            try {

                $weekCalculator = new WeekCalculator();
                $weekAllYear = $weekCalculator->getAllWeeksInYear(date('Y'));
                $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
                $weekInfo = $week['weekInfo'];
                $weekNumb = $week['weekNumber'];

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

                $userPlatformId = null;
                $userPlatformIds = UserPlatforms::userPlatforms(request()->user()->id)->get();
                foreach ($userPlatformIds as $platformId) {
                    $userPlatformId[] = $platformId->platform_id;
                }

                $data = Platforms::dataWeeklySummary($startDate, $untilDate, 'Asia/Makassar', 10080, $userPlatformId, $request->input('site_id') ?? null)
                    ->get();

                $data_row = [];
                if (isset($data)) {
                    $i = 0;
                    foreach ($data as $item) {
                        $i++;

                        $data_row[] = [
                            $i,
                            $item->uid,
                            $item->sitesLocation->sites->site_name ?? '-',
                            $item->sitesLocation->location_name ?? '-',
                            round($item->data_entry, 2),
                            round($item->data_connectivity, 2),
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
                    'UID' => [
                        'props' => [
                            'align' => 'center',
                            'width' => 'auto',
                        ]
                    ],
                    'Site' => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                        ]
                    ],
                    'Location Name' => [
                        'props' => [
                            'align' => 'left',
                            'width' => 'auto',
                        ]
                    ],
                    '% Data Masuk' => [
                        'props' => [
                            'align' => 'right',
                            'width' => 'auto',
                        ]
                    ],
                    '% Connectivity' => [
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

                $excel->output('AQMS-WeeklySummary-' . $weekNumb . '.xlsx');

            } catch (Exception $exception) {
                abort(500, $exception->getMessage());
            }
        }
    }
