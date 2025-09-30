<?php

    namespace App\Http\Controllers;

    use Carbon\Carbon;
    use Carbon\CarbonInterface;

    class WeekCalculator {
        /**
         * Menghitung jumlah hari antara dua tanggal (inklusif)
         */
        private function countDaysInRange($startDate, $endDate) {
            $start = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);
            return $end->diffInDays($start) + 1;
        }

        /**
         * Mendapatkan pengelompokan minggu berdasarkan tahun
         * dengan minggu 1 dimulai dari tanggal 1 Januari
         */
        public function getWeekGroupings($year, $month) {
            // Inisialisasi tanggal 1 Januari sebagai awal tahun
            $firstDayOfYear = Carbon::createFromDate(2024, 12, 30);

            // Tanggal pertama dan terakhir bulan yang diminta
            $firstDayOfMonth = Carbon::createFromDate($year, $month, 1);
            $lastDayOfMonth = $firstDayOfMonth->copy()->endOfMonth();

            // Hitung jumlah hari sejak 1 Januari sampai awal bulan yang diminta
            $daysSinceYearStart = $firstDayOfYear->diffInDays($firstDayOfMonth);

            // Hitung minggu pertama yang masuk dalam bulan yang diminta
            $startWeekNumber = floor($daysSinceYearStart / 7) + 1;

            // Inisialisasi array untuk menyimpan hasil
            $weekGroups = [];
            $currentWeekNumber = $startWeekNumber;

            // Inisialisasi tanggal awal minggu pertama yang masuk dalam bulan
            $currentDate = $firstDayOfYear->copy()->addWeeks($startWeekNumber - 1);

            // Loop sampai melewati akhir bulan
            while ($currentDate <= $lastDayOfMonth) {
                $weekEndDate = $currentDate->copy()->addDays(6);

                $weekGroups["Week {$currentWeekNumber}"] = [
                    'startDate' => $currentDate->format('Y-m-d'),
                    'untilDate' => $weekEndDate->format('Y-m-d'),
                    'startDateFormatted' => $currentDate->format('d M Y'),
                    'untilDateFormatted' => $weekEndDate->format('d M Y'),
                    'totalDays' => $this->countDaysInRange(
                        $currentDate->format('Y-m-d'),
                        $weekEndDate->format('Y-m-d')
                    ),
                    'daysInMonth' => $this->getDaysInMonthCount(
                        $currentDate->copy(),
                        $weekEndDate->copy(),
                        $month
                    )
                ];

                $currentDate->addDays(7);
                $currentWeekNumber++;
            }

            return $weekGroups;
        }

        /**
         * Menghitung jumlah hari dalam rentang yang masuk dalam bulan yang diminta
         */
        private function getDaysInMonthCount($startDate, $endDate, $targetMonth) {
            $days = 0;
            $currentDate = $startDate->copy();

            while ($currentDate <= $endDate) {
                if ($currentDate->month === $targetMonth) {
                    $days++;
                }
                $currentDate->addDay();
            }

            return $days;
        }

        /**
         * Mendapatkan informasi minggu untuk tanggal tertentu
         * berdasarkan perhitungan minggu dari 1 Januari
         */
        public function getWeekInfoForDate($date) {
            $targetDate = Carbon::parse($date);
            $firstDayOfYear = Carbon::createFromDate($targetDate->year, 1, 1);

            // Hitung berapa hari telah berlalu sejak 1 Januari
            $daysSinceYearStart = $firstDayOfYear->diffInDays($targetDate);

            // Hitung minggu keberapa (dimulai dari 1)
            $weekNumber = floor($daysSinceYearStart / 7) + 1;

            // Tanggal awal minggu
            $weekStart = $firstDayOfYear->copy()->addWeeks($weekNumber - 1);
            $weekEnd = $weekStart->copy()->addDays(6);

            $weekInfo = [
                'startDate' => $weekStart->format('Y-m-d'),
                'untilDate' => $weekEnd->format('Y-m-d'),
                'startDateFormatted' => $weekStart->format('d M Y'),
                'untilDateFormatted' => $weekEnd->format('d M Y'),
                'totalDays' => $this->countDaysInRange(
                    $weekStart->format('Y-m-d'),
                    $weekEnd->format('Y-m-d')
                ),
                'daysInMonth' => $this->getDaysInMonthCount(
                    $weekStart->copy(),
                    $weekEnd->copy(),
                    $targetDate->month
                )
            ];

            return [
                'weekNumber' => "Week {$weekNumber}",
                'weekInfo' => $weekInfo
            ];
        }
    }
