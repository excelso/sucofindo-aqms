<?php

    namespace App\Http\Helper;

    use avadim\FastExcelWriter\Excel;
    use avadim\FastExcelWriter\Style;
    use Illuminate\Support\Facades\File;
    use Illuminate\Support\Str;

    class ExportExcel {

        protected Excel $excel;
        protected array $head;
        protected array $dataRows;
        protected string $filename;

        public function __construct(array $head, array $dataRows, string $filename = null) {
            $this->excel = Excel::create(['Sheet1']);
            $this->head = $head;
            $this->dataRows = $dataRows;
            $this->filename = $filename ?? Str::random(10);
        }

        public function exportExcel(): void {
            $sheet = $this->excel->getSheet();

            //region Aktifkan Jika mau Pakai Header Judul
            // $highColumn = Helper::numToExcelAlpha(count($this->head));
            // $sheet->mergeCells('A1:' . $highColumn . '1');
            // $sheet->writeCell('Data Pra Rekonsil Eksternal', [
            //     'text-align' => 'center'
            // ]);
            // $sheet->nextRow();
            //
            // $sheet->mergeCells('A2:' . $highColumn . '2');
            // $sheet->writeCell('Semua Gudang | Semua Kabinet', [
            //     'text-align' => 'center'
            // ]);
            // $sheet->nextRow();
            //endregion

            $headIndex = 0;
            $colsStyle = [];
            foreach ($this->head as $item => $value) {
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

                $colsStyle[] = [
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
            }

            $sheet->setColOptions(array_merge([], ...$colsStyle));
            $sheet->writeRow(array_keys($this->head), [
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

            foreach ($this->dataRows as $rowData) {
                $sheet->writeRow($rowData);
            }

            $filePath = public_path('tempExcel');
            File::ensureDirectoryExists($filePath);
            $fileTemp = $filePath . '/' . $this->filename . '.xlsx';
            $this->excel->save($fileTemp);

            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename=' . basename($fileTemp));
            header('Content-Transfer-Encoding: binary');
            header('Expires: 0');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');
            header('Content-Length: ' . filesize($fileTemp));
            ob_clean();
            flush();
            readfile($fileTemp);
            unlink($fileTemp);
        }

        public static function numToExcelAlpha($n): int|string {
            $r = 'A';
            while ($n-- > 1) {
                $r++;
            }
            return $r;
        }
    }
