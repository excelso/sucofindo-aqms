<?php

    namespace App\Http\Controllers;

    use Carbon\Carbon;

    class WeekCalculator {

        /**
         * Anchor date: 30 Des 2024 sebagai Week 1, Day 1 dari sistem ini
         */
        private const string ANCHOR_DATE = '2024-12-30';
        private const int ANCHOR_YEAR = 2025;

        /**
         * Dapatkan first day of year berdasarkan anchor dan tahun target
         */
        private function getFirstDayOfYear(int $year): Carbon {
            $anchorDate = Carbon::parse(self::ANCHOR_DATE);

            // Hitung selisih tahun dari anchor year
            $yearDiff = $year - self::ANCHOR_YEAR;

            // Setiap tahun = 52 minggu = 364 hari
            $daysDiff = $yearDiff * 364;

            return $anchorDate->copy()->addDays($daysDiff);
        }

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
         * Minggu 1 dimulai dari anchor date yang dihitung otomatis
         */
        public function getWeekGroupings(int $year, int $month): array {
            $firstDayOfYear = $this->getFirstDayOfYear($year);

            // Batas bulan
            $firstDayOfMonth = Carbon::createFromDate($year, $month, 1);
            $lastDayOfMonth = $firstDayOfMonth->copy()->endOfMonth();

            $daysSinceYearStart = $firstDayOfYear->diffInDays($firstDayOfMonth);
            $startWeekNumber = intdiv($daysSinceYearStart, 7) + 1;

            $weekGroups = [];
            $currentWeekNumber = $startWeekNumber;
            $currentDate = $firstDayOfYear->copy()->addWeeks($startWeekNumber - 1);

            while ($currentDate <= $lastDayOfMonth) {
                $weekStart = $currentDate->copy();
                $weekEnd = $currentDate->copy()->addDays(6);

                $totalDays = $this->countDaysInRange($weekStart, $weekEnd);
                $daysInMonth = $this->getDaysInMonthCount($weekStart, $weekEnd, $month);

                $weekGroups["Week {$currentWeekNumber}"] = [
                    'startDate' => $weekStart->format('Y-m-d'),
                    'untilDate' => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays' => $totalDays,
                    'daysInMonth' => $daysInMonth,
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
         * Info minggu untuk sebuah tanggal dengan anchor otomatis
         */
        public function getWeekInfoForDate(string $date): array {
            $targetDate = Carbon::parse($date);
            $targetYear = (int)$targetDate->format('Y');
            $firstDayOfYear = $this->getFirstDayOfYear($targetYear);

            $daysSinceYearStart = $firstDayOfYear->diffInDays($targetDate);
            $weekNumber = intdiv($daysSinceYearStart, 7) + 1;

            $weekStart = $firstDayOfYear->copy()->addWeeks($weekNumber - 1);
            $weekEnd = $weekStart->copy()->addDays(6);

            return [
                'weekNumber' => "Week {$weekNumber}",
                'weekInfo' => [
                    'startDate' => $weekStart->format('Y-m-d'),
                    'untilDate' => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays' => $this->countDaysInRange($weekStart, $weekEnd),
                    'daysInMonth' => $this->getDaysInMonthCount(
                        $weekStart->copy(),
                        $weekEnd->copy(),
                        (int)$targetDate->month
                    ),
                ],
            ];
        }

        /**
         * Dapatkan semua minggu dalam setahun (52 minggu)
         */
        public function getAllWeeksInYear(int $year): array {
            $firstDayOfYear = $this->getFirstDayOfYear($year);
            $yearEnd = $firstDayOfYear->copy()->addDays(363); // 52 minggu = 364 hari

            // Ambil tanggal hari ini
            $today = Carbon::today();

            $weekGroups = [];
            $currentWeekNumber = 1;
            $currentDate = $firstDayOfYear->copy();

            while ($currentWeekNumber <= 52) {
                $weekStart = $currentDate->copy();
                $weekEnd = $currentDate->copy()->addDays(6);

                // Check apakah hari ini ada dalam range minggu ini
                $isInRange = $today->between($weekStart, $weekEnd);

                $weekGroups[] = [
                    'weekNumber' => $currentWeekNumber,
                    'weekLabel' => "Week {$currentWeekNumber}",
                    'startDate' => $weekStart->format('Y-m-d'),
                    'untilDate' => $weekEnd->format('Y-m-d'),
                    'startDateFormatted' => $weekStart->format('d M Y'),
                    'untilDateFormatted' => $weekEnd->format('d M Y'),
                    'totalDays' => 7,
                    'isSelected' => $isInRange ? 'selected' : '',
                ];

                $currentDate->addDays(7);
                $currentWeekNumber++;
            }

            return $weekGroups;
        }
    }
