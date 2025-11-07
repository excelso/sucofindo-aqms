<?php

    namespace App\Console\Commands;

    use App\Http\Controllers\WeekCalculator;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\BeSparing\Master\PlatformWeeklySummary;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Console\Command;
    use Log;

    class SparingWeeklySummaryInit extends Command {
        protected $signature = 'app:sparing-weekly-summary-init
                            {--start-date= : Tanggal mulai (Y-m-d), default: awal tahun}
                            {--end-date= : Tanggal akhir (Y-m-d), default: hari ini}
                            {--current : Generate hanya untuk week sekarang}
                            {--force : Force regenerate existing data}';

        protected $description = 'Generate weekly summary untuk compliance data';

        public function handle() {
            try {
                $weekCalculator = new WeekCalculator();
                $current = $this->option('current');
                $force = $this->option('force');

                // Jika --current, hanya generate week sekarang
                if ($current) {
                    return $this->generateCurrentWeek($weekCalculator);
                }

                // Get date range
                $startDate = $this->option('start-date')
                    ? Carbon::parse($this->option('start-date'))
                    : Carbon::now()->startOfYear();

                $endDate = $this->option('end-date')
                    ? Carbon::parse($this->option('end-date'))
                    : Carbon::now();

                $this->info("Generating weekly summary from {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");
                $this->newLine();

                $successCount = 0;
                $errorCount = 0;
                $skippedCount = 0;
                $processedWeeks = [];

                // Iterate tanggal per minggu
                $currentDate = $startDate->copy();

                while ($currentDate->lte($endDate)) {
                    try {
                        // Get week info untuk tanggal ini
                        $week = $weekCalculator->getWeekInfoForDate($currentDate);
                        $weekInfo = $week['weekInfo'];
                        $weekNumb = $week['weekNumber'];

                        $weekStart = $weekInfo['startDate'];
                        $weekUntil = $weekInfo['untilDate'];

                        // Skip kalau week ini sudah diproses
                        $weekKey = "{$weekStart}_{$weekUntil}";
                        if (in_array($weekKey, $processedWeeks)) {
                            $currentDate->addDay();
                            continue;
                        }

                        $processedWeeks[] = $weekKey;

                        $this->info("Processing Week {$weekNumb}: {$weekStart} to {$weekUntil}");

                        // Check if already exists
                        $existingCount = PlatformWeeklySummary::where('week_start', $weekStart)
                            ->where('week_until', $weekUntil)
                            ->count();

                        if ($existingCount > 0 && !$force) {
                            $this->line("  → Already exists ({$existingCount} records), skipping...");
                            $skippedCount++;
                            $currentDate->addWeek(); // Skip ke week berikutnya
                            continue;
                        }

                        // Get data from Platform
                        $dataParam = Platform::platformWeeklySummary($weekStart, $weekUntil, 'Asia/Makassar')->get();

                        if ($dataParam->isEmpty()) {
                            $this->warn("  ⚠ No data found for week {$weekNumb}");
                            $currentDate->addWeek(); // Skip ke week berikutnya
                            continue;
                        }

                        $recordCount = 0;
                        foreach ($dataParam as $item) {
                            PlatformWeeklySummary::updateOrCreate([
                                'uid' => $item->uid,
                                'tipe_logger' => $item->tipe_logger,
                                'week_start' => $weekStart,
                                'week_until' => $weekUntil,
                            ], [
                                'week_number' => $weekNumb,
                                'data_entry' => $item->persen ?? 0,
                                'ph_comply' => $item->percentagePh ?? 0,
                                'tss_comply' => $item->percentageTss ?? 0,
                                'debit_comply' => $item->percentageDebit ?? 0,
                            ]);
                            $recordCount++;
                        }

                        $this->info("  ✓ Generated {$recordCount} records for week {$weekNumb}");
                        $successCount++;

                        // Jump ke week berikutnya
                        $currentDate->addWeek();

                    } catch (Exception $e) {
                        $this->error("  ✗ Error processing date {$currentDate->format('Y-m-d')}: " . $e->getMessage());
                        Log::error("Weekly Summary Error", [
                            'date' => $currentDate->format('Y-m-d'),
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        $errorCount++;
                        $currentDate->addDay(); // Coba tanggal berikutnya
                    }
                }

                // Summary
                $this->newLine();
                $this->info("=== Generation Complete ===");
                $this->info("Success: {$successCount} weeks");
                $this->info("Skipped: {$skippedCount} weeks");
                $this->info("Errors: {$errorCount} weeks");

                Log::info('Weekly Summary Generation Completed', [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'success' => $successCount,
                    'skipped' => $skippedCount,
                    'errors' => $errorCount,
                ]);

                return $errorCount > 0 ? Command::FAILURE : Command::SUCCESS;

            } catch (Exception $exception) {
                $this->error('Fatal Error: ' . $exception->getMessage());
                Log::error('Weekly Summary Fatal Error', [
                    'error' => $exception->getMessage(),
                    'trace' => $exception->getTraceAsString()
                ]);
                return Command::FAILURE;
            }
        }

        /**
         * Generate untuk week sekarang saja
         */
        private function generateCurrentWeek(WeekCalculator $weekCalculator): int {
            try {
                $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
                $weekInfo = $week['weekInfo'];
                $weekNumb = $week['weekNumber'];

                $startDate = $weekInfo['startDate'];
                $untilDate = $weekInfo['untilDate'];

                $this->info("Generating current week: Week {$weekNumb} ({$startDate} to {$untilDate})");

                $dataParam = Platform::platformWeeklySummary($startDate, $untilDate, 'Asia/Makassar')->get();

                if ($dataParam->isEmpty()) {
                    $this->warn('No data found for current week');
                    return Command::SUCCESS;
                }

                $recordCount = 0;
                foreach ($dataParam as $item) {
                    PlatformWeeklySummary::updateOrCreate([
                        'uid' => $item->uid,
                        'tipe_logger' => $item->tipe_logger,
                        'week_start' => $startDate,
                        'week_until' => $untilDate,
                    ], [
                        'week_number' => $weekNumb,
                        'data_entry' => $item->persen ?? 0,
                        'ph_comply' => $item->percentagePh ?? 0,
                        'tss_comply' => $item->percentageTss ?? 0,
                        'debit_comply' => $item->percentageDebit ?? 0,
                    ]);
                    $recordCount++;
                }

                $this->info("✓ Generated {$recordCount} records for current week");
                Log::info('Current Weekly Summary Generated Successfully', [
                    'week_number' => $weekNumb,
                    'record_count' => $recordCount
                ]);

                return Command::SUCCESS;

            } catch (Exception $exception) {
                $this->error($exception->getMessage());
                Log::error('Current Weekly Summary Error', [
                    'error' => $exception->getMessage()
                ]);
                return Command::FAILURE;
            }
        }
    }
