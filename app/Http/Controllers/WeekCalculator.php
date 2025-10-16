<?php

    namespace App\Http\Controllers;

    use Carbon\Carbon;

    class WeekCalculator {
        /**
         * Hitung jumlah hari (inklusif) pakai objek Carbon langsung.
         */
        private function countDaysInRange(Carbon $start, Carbon $until): int {
            // pastikan urutan benar (start <= until)
            if ($until->lessThan($start)) {
                [$start, $until] = [$until, $start];
            }
            return $start->diffInDays($until) + 1;
        }

        /**
         * Minggu 1 dimulai 1 Januari tahun bersangkutan
         */
        public function getWeekGroupings(int $year, int $month): array {
            // Pakai 1 Jan tahun yang diminta (sesuai komentar)
            $firstDayOfYear  = Carbon::createFromDate(2024, 12, 30);

            // Batas bulan
            $firstDayOfMonth = Carbon::createFromDate($year, $month, 1);
            $lastDayOfMonth  = $firstDayOfMonth->copy()->endOfMonth();

            $daysSinceYearStart = $firstDayOfYear->diffInDays($firstDayOfMonth); // >= 0
            $startWeekNumber    = intdiv($daysSinceYearStart, 7) + 1;

            $weekGroups         = [];
            $currentWeekNumber  = $startWeekNumber;

            // Tanggal awal minggu pertama yang memotong bulan tsb
            $currentDate = $firstDayOfYear->copy()->addWeeks($startWeekNumber - 1);

            while ($currentDate <= $lastDayOfMonth) {
                $weekStart   = $currentDate->copy();
                $weekEnd     = $currentDate->copy()->addDays(6);

                // Hitung hari dalam minggu (selalu 7 secara teori)
                $totalDays   = $this->countDaysInRange($weekStart, $weekEnd);

                // Hitung hanya hari yang jatuh dalam bulan target
                $daysInMonth = $this->getDaysInMonthCount($weekStart, $weekEnd, $month);

                $weekGroups["Week {$currentWeekNumber}"] = [
                    'startDate'          => $weekStart->format('Y-m-d'),
                    'untilDate'          => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays'          => $totalDays,      // seharusnya 7
                    'daysInMonth'        => $daysInMonth,    // 0..7 tergantung overlap
                ];

                $currentDate->addDays(7);
                $currentWeekNumber++;
            }

            return $weekGroups;
        }

        /**
         * Hitung berapa hari dalam rentang yang jatuh di bulan target
         */
        private function getDaysInMonthCount(Carbon $startDate, Carbon $endDate, int $targetMonth): int {
            $days = 0;
            $d = $startDate->copy();
            while ($d <= $endDate) {
                if ((int)$d->month === $targetMonth) {
                    $days++;
                }
                $d->addDay();
            }
            return $days;
        }

        /**
         * Info minggu untuk sebuah tanggal dengan anchor 1 Januari
         */
        public function getWeekInfoForDate(string $date): array {
            $targetDate     = Carbon::parse($date);
            $firstDayOfYear = Carbon::createFromDate($targetDate->year, 1, 1);

            $daysSinceYearStart = $firstDayOfYear->diffInDays($targetDate);
            $weekNumber         = intdiv($daysSinceYearStart, 7) + 1;

            $weekStart = $firstDayOfYear->copy()->addWeeks($weekNumber - 1);
            $weekEnd   = $weekStart->copy()->addDays(6);

            return [
                'weekNumber' => "Week {$weekNumber}",
                'weekInfo'   => [
                    'startDate'          => $weekStart->format('Y-m-d'),
                    'untilDate'          => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays'          => $this->countDaysInRange($weekStart, $weekEnd),
                    'daysInMonth'        => $this->getDaysInMonthCount(
                        $weekStart->copy(),
                        $weekEnd->copy(),
                        (int)$targetDate->month
                    ),
                ],
            ];
        }
    }
