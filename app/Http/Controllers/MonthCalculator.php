<?php

    namespace App\Http\Controllers;

    use Carbon\Carbon;

    class MonthCalculator {
        /**
         * Hitung jumlah hari (inklusif) pakai objek Carbon langsung.
         */
        private function countDaysInRange(Carbon $start, Carbon $until): int {
            if ($until->lessThan($start)) {
                [$start, $until] = [$until, $start];
            }
            return $start->diffInDays($until) + 1;
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
         * Week 1..N di-reset setiap bulan:
         * Week 1 = tanggal 1-7
         * Week 2 = 8-14
         * Week 3 = 15-21
         * Week 4 = 22-28
         * Week 5 = 29-endOfMonth (jika ada)
         */
        public function getMonthGroupings(int $year, int $month): array {
            $firstDayOfMonth = Carbon::createFromDate($year, $month, 1)->startOfDay();
            $lastDayOfMonth = $firstDayOfMonth->copy()->endOfMonth()->startOfDay();

            $weekGroups = [];
            $weekNumber = 1;

            $currentStart = $firstDayOfMonth->copy();

            while ($currentStart <= $lastDayOfMonth) {
                // 1-7, 8-14, 15-21, dst => startDay = 1 + (weekNumber-1)*7
                // endDay = startDay + 6, tapi dipotong sampai endOfMonth
                $weekStart = $currentStart->copy();
                $weekEnd = $weekStart->copy()->addDays(6);
                if ($weekEnd->greaterThan($lastDayOfMonth)) {
                    $weekEnd = $lastDayOfMonth->copy();
                }

                $totalDays = $this->countDaysInRange($weekStart, $weekEnd);

                $weekGroups["Week {$weekNumber}"] = [
                    'startDate' => $weekStart->format('Y-m-d'),
                    'untilDate' => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays' => $totalDays,
                    'daysInMonth' => $this->getDaysInMonthCount($weekStart, $weekEnd, $month), // sama dengan totalDays karena sudah dalam bulan tsb
                ];

                $currentStart = $weekEnd->copy()->addDay(); // lanjut ke hari setelah weekEnd
                $weekNumber++;
            }

            return $weekGroups;
        }

        /**
         * Info week dalam bulan untuk sebuah tanggal (weekNumber reset per bulan).
         */
        public function getWeekInfoForDate(string $date): array {
            $targetDate = Carbon::parse($date)->startOfDay();
            $year = (int)$targetDate->year;
            $month = (int)$targetDate->month;

            $firstDayOfMonth = Carbon::createFromDate($year, $month, 1)->startOfDay();
            $lastDayOfMonth = $firstDayOfMonth->copy()->endOfMonth()->startOfDay();

            $daysFromMonthStart = $firstDayOfMonth->diffInDays($targetDate);
            $weekNumber = intdiv($daysFromMonthStart, 7) + 1;

            $weekStart = $firstDayOfMonth->copy()->addDays(($weekNumber - 1) * 7);
            $weekEnd = $weekStart->copy()->addDays(6);
            if ($weekEnd->greaterThan($lastDayOfMonth)) {
                $weekEnd = $lastDayOfMonth->copy();
            }

            $totalDays = $this->countDaysInRange($weekStart, $weekEnd);

            return [
                'weekNumber' => "Week {$weekNumber}",
                'weekInfo' => [
                    'startDate' => $weekStart->format('Y-m-d'),
                    'untilDate' => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays' => $totalDays,
                    'daysInMonth' => $this->getDaysInMonthCount($weekStart, $weekEnd, $month),
                ],
            ];
        }
    }
