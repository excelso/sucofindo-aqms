<?php

    namespace App\Console\Commands;

    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use App\Models\Master\PlatformsHeartbeat;
    use Carbon\Carbon;
    use DB;
    use Exception;
    use Illuminate\Console\Command;
    use Illuminate\Support\Collection;
    use Illuminate\Support\Str;
    use phpseclib3\Net\SSH2;

    class GapCommand extends Command {
        protected $signature = 'handle:gap
                    {--date1= : Date to process (Y-m-d format)}
                    {--date2= : Date to process (Y-m-d format)}';

        protected $description = 'Handle Gap Data with Progress Tracking';

        public function handle(): void {
            $date1 = $this->option('date1') ?? Carbon::now()->subDays(30)->format('Y-m-d');
            $date2 = $this->option('date2') ?? Carbon::now()->subDays(1)->format('Y-m-d');

            // Validate date format
            if (!$this->isValidDate($date1)) {
                $this->error('Invalid date format. Please use Y-m-d format (e.g., 2025-09-02)');
                return;
            }
            if (!$this->isValidDate($date2)) {
                $this->error('Invalid date format. Please use Y-m-d format (e.g., 2025-09-02)');
                return;
            }

            $this->info("Starting Gap Handler for date: {$date1} to {$date2}");
            $this->newLine();

            // Get platforms
            $platforms = Platforms::whereNotNull('cctv_link_1')
                ->orderBy('uid')->get();

            $totalPlatforms = $platforms->count();

            if ($totalPlatforms == 0) {
                $this->warn('No platforms found with cctv_link_1!');
                return;
            }

            $this->info("Found {$totalPlatforms} platforms to process");
            $this->newLine();

            // Create progress bar
            $progressBar = $this->output->createProgressBar($totalPlatforms);
            $progressBar->setFormat('verbose');

            $currentIndex = 0;
            $totalGapsCreated = 0;
            $processedUIDs = [];

            foreach ($platforms as $platform) {
                $currentIndex++;

                // Update progress bar
                $progressBar->setMessage("Processing UID: {$platform->uid} ({$currentIndex}/{$totalPlatforms})", 'message');

                try {
                    $handleGap = $this->handleGap($platform->uid, $date1, $date2);
                    $gapCount = $handleGap->count();

                    if ($gapCount > 0) {
                        $this->newLine();
                        $this->info("  └─ UID: {$platform->uid} - Found {$gapCount} gaps to fill");

                        foreach ($handleGap as $gap) {
                            Loggers::create([
                                'uid' => $gap['uid'],
                                'pm_25' => $gap['pm_25'],
                                'pm_10' => $gap['pm_10'],
                                'tsp' => $gap['tsp'],
                                'noise' => $gap['noise'],
                                'aqi_index_pm25' => $gap['aqi_index_pm25'],
                                'aqi_index_pm10' => $gap['aqi_index_pm10'],
                                'aqi_index_tsp' => $gap['aqi_index_tsp'],
                                'aqi_index' => $gap['aqi_index'],
                                'aqi_from' => $gap['aqi_from'],
                                'datetime_unix' => $gap['prev_datetime_unix'],
                            ]);
                        }

                        $totalGapsCreated += $gapCount;
                        $this->info("  └─ Successfully created {$gapCount} gap records");
                    } else {
                        $this->newLine();
                        $this->comment("  └─ UID: {$platform->uid} - No gaps found");
                    }

                    $processedUIDs[] = [
                        'uid' => $platform->uid,
                        'gaps_found' => $gapCount,
                        'status' => 'success'
                    ];

                } catch (Exception $e) {
                    $this->newLine();
                    $this->error("  └─ Error processing UID: {$platform->uid} - {$e->getMessage()}");

                    $processedUIDs[] = [
                        'uid' => $platform->uid,
                        'gaps_found' => 0,
                        'status' => 'error',
                        'error' => $e->getMessage()
                    ];
                }

                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            // Summary
            $this->displaySummary($processedUIDs, $totalGapsCreated, $date1, $date2);
        }

        protected function handleGap($uid, $date1, $date2): Collection {
            $baseData = DB::select("
                SELECT
                    `uid`,
                    `pm_25`,
                    `pm_10`,
                    `tsp`,
                    `noise`,
                    `aqi_index_pm25`,
                    `aqi_index_pm10`,
                    `aqi_index_tsp`,
                    `aqi_index`,
                    `aqi_from`,
                    `datetime_unix`,
                    `tipe_logger`,
                    @prev_time AS prev_datetime_unix,
                    ROUND(IF(@prev_time IS NOT NULL, (datetime_unix - @prev_time) / 60, 0)) AS gap_minutes,
                    @prev_time := datetime_unix
                FROM t_loggers, (SELECT @prev_time := NULL) vars
                WHERE `uid` = ?
                  AND CONVERT_TZ(FROM_UNIXTIME(t_loggers.datetime_unix, '%Y-%m-%d %H:%i'), 'UTC', 'Asia/Makassar')
                      BETWEEN ? AND ?
                ORDER BY `datetime_unix`
            ", [$uid, $date1 . ' 00:00', $date2 . ' 23:59']);

            $result = collect();

            foreach ($baseData as $record) {
                if ($record->gap_minutes > 1) {
                    // Generate intervals for the gap
                    for ($minute = 1; $minute < $record->gap_minutes; $minute++) {
                        $newTimestamp = $record->prev_datetime_unix + ($minute * 60);

                        $result->push([
                            'uid' => $record->uid,
                            'pm_25' => $record->pm_25,
                            'pm_10' => $record->pm_10,
                            'tsp' => $record->tsp,
                            'noise' => $record->noise,
                            'aqi_index_pm25' => $record->aqi_index_pm25,
                            'aqi_index_pm10' => $record->aqi_index_pm10,
                            'aqi_index_tsp' => $record->aqi_index_tsp,
                            'aqi_index' => $record->aqi_index,
                            'aqi_from' => $record->aqi_from,
                            'datetime_unix' => $record->datetime_unix,
                            'tipe_logger' => $record->tipe_logger,
                            'prev_datetime_unix' => $newTimestamp, // Use new timestamp for gap filling
                            'gap_minutes' => $record->gap_minutes,
                            'minute_number' => $minute,
                            'datetime_format' => Carbon::createFromTimestamp($newTimestamp)
                                ->setTimezone('Asia/Makassar')
                                ->format('Y-m-d H:i:s')
                        ]);
                    }
                }
            }

            return $result->sortBy('datetime_unix');
        }

        /**
         * Display processing summary
         */
        protected function displaySummary(array $processedUIDs, int $totalGapsCreated, string $date1, string $date2): void {
            $this->info('=== PROCESSING SUMMARY ===');
            $this->info("Date processed: {$date1} to {$date2}");
            $this->info("Total platforms: " . count($processedUIDs));

            $successCount = collect($processedUIDs)->where('status', 'success')->count();
            $errorCount = collect($processedUIDs)->where('status', 'error')->count();

            $this->info("Successful: {$successCount}");
            if ($errorCount > 0) {
                $this->error("Failed: {$errorCount}");
            }

            $this->info("Total gaps created: {$totalGapsCreated}");
            $this->newLine();

            // Show top UIDs with most gaps
            $topGapUIDs = collect($processedUIDs)
                ->where('status', 'success')
                ->where('gaps_found', '>', 0)
                ->sortByDesc('gaps_found')
                ->take(5);

            if ($topGapUIDs->count() > 0) {
                $this->info('Top 5 UIDs with most gaps:');
                foreach ($topGapUIDs as $uid) {
                    $this->line("  • {$uid['uid']}: {$uid['gaps_found']} gaps");
                }
                $this->newLine();
            }

            // Show errors if any
            $errorUIDs = collect($processedUIDs)->where('status', 'error');
            if ($errorUIDs->count() > 0) {
                $this->error('UIDs with errors:');
                foreach ($errorUIDs as $uid) {
                    $this->line("  • {$uid['uid']}: {$uid['error']}");
                }
            }
        }

        /**
         * Validate date format
         */
        protected function isValidDate(string $date): bool {
            try {
                Carbon::createFromFormat('Y-m-d', $date);
                return true;
            } catch (Exception $e) {
                return false;
            }
        }
    }
