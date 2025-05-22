<?php

    namespace App\Http\Helper;

    use App\Models\Employee\Employee;
    use App\Models\TimeManagement\TimeManagementHoliday;
    use DateTime;

    class ExAttendanceService {

        /**
         * @throws \Exception
         */
        public function validateAndRecordAttendance(Employee $employee, DateTime $attendanceDate) {
            $shift = $this->getEmployeeShiftForDate($employee, $attendanceDate);

            if (!$shift) {
                throw new \Exception("Tidak ada jadwal shift untuk tanggal ini.");
            }

            if ($shift['is_dayoff']) {
                throw new \Exception("Anda tidak dapat absen pada hari libur.");
            }

            // Jika sudah melewati validasi, catat absensi
            return $this->recordAttendance($employee, $attendanceDate, $shift);
        }

        /**
         * @throws \DateMalformedStringException
         */
        private function getEmployeeShiftForDate(Employee $employee, DateTime $date): ?array {
            // Ambil jadwal karyawan
            $schedule = $employee->timeManagementSchedule;
            if (!$schedule) {
                return null;
            }

            // Periksa apakah tanggal adalah hari libur
            $holiday = TimeManagementHoliday::where('holiday_date', $date->format('Y-m-d'))->first();

            if ($holiday && !$this->shouldIgnoreHoliday($schedule, $holiday)) {
                return [
                    'shift_name' => "Holiday: " . $holiday->holiday_name,
                    'working_hour_start' => '00:00',
                    'working_hour_until' => '00:00',
                    'is_dayoff' => true
                ];
            }

            // Hitung hari dalam siklus
            $scheduleEffectiveDate = new DateTime($schedule->effective_date);
            $daysSinceEffective = $date->diff($scheduleEffectiveDate)->days;
            $totalCycleDays = $schedule->schedulePattern->sum('repeat_until');
            $cycleDay = $daysSinceEffective % $totalCycleDays;

            // Temukan shift yang sesuai
            $accumulatedDays = 0;
            foreach ($schedule->schedulePattern as $pattern) {
                if ($cycleDay < ($accumulatedDays + $pattern->repeat_until)) {
                    return [
                        'shift_name' => $pattern->timeShift->shift_name,
                        'working_hour_start' => $pattern->timeShift->working_hour_start,
                        'working_hour_until' => $pattern->timeShift->working_hour_until,
                        'is_dayoff' => $pattern->timeShift->is_dayoff
                    ];
                }
                $accumulatedDays += $pattern->repeat_until;
            }

            return null;
        }

        private function shouldIgnoreHoliday($schedule, $holiday) {
            switch ($holiday->holiday_type) {
                case 'national':
                    return $schedule->ignore_national_holiday;
                case 'special':
                    return $schedule->ignore_special_holiday;
                case 'company':
                    return $schedule->ignore_company_holiday;
                default:
                    return false;
            }
        }

        private function recordAttendance(Employee $employee, DateTime $date, array $shift) {
            return Attendance::create([
                'employee_id' => $employee->id,
                'date' => $date->format('Y-m-d'),
                'shift_name' => $shift['shift_name'],
                'check_in_time' => now(),
                // ... tambahkan field lain yang diperlukan
            ]);
        }
    }
