<?php

    namespace App\Console\Commands;

    use App\Models\Master\Loggers;
    use App\Models\Master\Platforms;
    use Illuminate\Console\Command;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;
    use Exception;

    class UpdateAQITSP extends Command {
        /**
         * The name and signature of the console command.
         *
         * @var string
         */
        protected $signature = 'app:update-aqi-tsp
                            {--platform-uid= : Specific platform UID to process}
                            {--date-from= : Start date (Y-m-d format)}
                            {--date-to= : End date (Y-m-d format)}
                            {--batch-size=1000 : Number of records to process per batch}
                            {--dry-run : Preview changes without updating database}';

        /**
         * The console command description.
         *
         * @var string
         */
        protected $description = 'Update AQI Index for TSP (Total Suspended Particles) data with batch processing and error handling';

        /**
         * AQI categories cache
         *
         * @var array
         */
        private $aqiCategories = [];

        /**
         * Statistics tracking
         *
         * @var array
         */
        private $stats = [
            'total_processed' => 0,
            'total_updated' => 0,
            'total_failed' => 0,
            'total_skipped' => 0,
        ];

        /**
         * Execute the console command.
         */
        public function handle() {
            try {
                $this->info('🚀 Starting AQI TSP Update Process...');
                $this->newLine();

                // Load and cache AQI categories
                $this->loadAqiCategories();

                // Get platforms based on options
                $platforms = $this->getPlatforms();

                if ($platforms->isEmpty()) {
                    $this->warn('❌ No platforms found matching the criteria!');
                    return Command::FAILURE;
                }

                $totalPlatforms = $platforms->count();
                $this->info("✅ Found {$totalPlatforms} platform(s) to process");

                // Display configuration
                $this->displayConfiguration();

                if (!$this->confirmExecution()) {
                    $this->info('Operation cancelled by user.');
                    return Command::SUCCESS;
                }

                // Process each platform
                $this->processAllPlatforms($platforms);

                // Display final statistics
                $this->displayFinalStats();

                return Command::SUCCESS;

            } catch (Exception $e) {
                $this->error("❌ Fatal error: {$e->getMessage()}");
                Log::error('UpdateAQITSP Command Error', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return Command::FAILURE;
            }
        }

        /**
         * Load and cache AQI categories for better performance
         */
        private function loadAqiCategories() {
            $this->info('📋 Loading AQI categories...');

            $this->aqiCategories = DB::table('t_aqi_categories')
                ->orderBy('tsp_min')
                ->get()
                ->toArray();

            if (empty($this->aqiCategories)) {
                throw new Exception('No AQI categories found in database. Please check t_aqi_categories table.');
            }

            $this->info("✅ Loaded " . count($this->aqiCategories) . " AQI categories");
        }

        /**
         * Get platforms based on command options
         */
        private function getPlatforms() {
            $query = Platforms::whereNotNull('cctv_link_1');

            if ($this->option('platform-uid')) {
                $query->where('uid', $this->option('platform-uid'));
            }

            return $query->orderBy('uid')->get();
        }

        /**
         * Display current configuration
         */
        private function displayConfiguration() {
            $this->newLine();
            $this->info('📝 Configuration:');

            $config = [
                'Platform UID' => $this->option('platform-uid') ?: 'All platforms',
                'Date From' => $this->option('date-from') ?: 'All dates',
                'Date To' => $this->option('date-to') ?: 'All dates',
                'Batch Size' => $this->option('batch-size'),
                'Dry Run' => $this->option('dry-run') ? 'Yes' : 'No',
            ];

            foreach ($config as $key => $value) {
                $this->line("  • {$key}: {$value}");
            }
            $this->newLine();
        }

        /**
         * Confirm execution unless in dry-run mode
         */
        private function confirmExecution(): bool {
            if ($this->option('dry-run')) {
                $this->info('🔍 Running in DRY-RUN mode - no data will be modified');
                return true;
            }

            return $this->confirm('Do you want to proceed with updating the AQI TSP data?', true);
        }

        /**
         * Process all platforms
         */
        private function processAllPlatforms($platforms) {
            $platformProgress = $this->output->createProgressBar($platforms->count());
            $platformProgress->setFormat('Processing platforms: %current%/%max% [%bar%] %percent:3s%% - %message%');

            foreach ($platforms as $platform) {
                $platformProgress->setMessage("UID: {$platform->uid}");

                try {
                    $this->processPlatform($platform);
                } catch (Exception $e) {
                    $this->error("\n❌ Error processing platform {$platform->uid}: {$e->getMessage()}");
                    Log::error('Platform processing error', [
                        'platform_uid' => $platform->uid,
                        'error' => $e->getMessage()
                    ]);
                }

                $platformProgress->advance();
            }

            $platformProgress->finish();
            $this->newLine(2);
        }

        /**
         * Process a single platform
         */
        private function processPlatform($platform) {
            $query = Loggers::where('uid', $platform->uid);

            // Apply date filters if provided
            if ($this->option('date-from')) {
                $query->whereDate(DB::raw('CONVERT_TZ( FROM_UNIXTIME( datetime_unix, "%Y-%m-%d %H:%i" ), "UTC", "Asia/Makassar" )'), '>=', $this->option('date-from'));
            }
            if ($this->option('date-to')) {
                $query->whereDate(DB::raw('CONVERT_TZ( FROM_UNIXTIME( datetime_unix, "%Y-%m-%d %H:%i" ), "UTC", "Asia/Makassar" )'), '<=', $this->option('date-to'));
            }

            // Only process records that need updating (null or different TSP values)
            $query->where(function ($q) {
                $q->whereNull('aqi_index_tsp')
                    ->orWhereColumn('tsp', '!=', 'aqi_index_tsp')
                    ->orWhere('aqi_index_tsp', 0);
            });

            $totalRecords = $query->count();

            if ($totalRecords == 0) {
                $this->line("\n  ℹ️  Platform {$platform->uid}: No records to update");
                return;
            }

            $this->newLine();
            $this->info("  🔄 Platform {$platform->uid}: Processing {$totalRecords} records");

            // Process in batches for better memory management
            $batchSize = (int)$this->option('batch-size');
            $processed = 0;
            $updated = 0;
            $failed = 0;

            $recordProgress = $this->output->createProgressBar($totalRecords);
            $recordProgress->setFormat('    Progress: %current%/%max% [%bar%] %percent:3s%% - %message%');

            $query->orderBy('id')->chunk($batchSize, function ($loggers) use (&$processed, &$updated, &$failed, $recordProgress) {
                $batchUpdates = [];

                foreach ($loggers as $logger) {
                    try {
                        $processed++;
                        $this->stats['total_processed']++;

                        // Skip if TSP value is null or invalid
                        if (is_null($logger->tsp) || !is_numeric($logger->tsp)) {
                            $this->stats['total_skipped']++;
                            $recordProgress->setMessage("Skipped (invalid TSP)");
                            $recordProgress->advance();
                            continue;
                        }

                        $aqiTsp = $this->calculateAqiTsp($logger->tsp);

                        if (!$this->option('dry-run')) {
                            $batchUpdates[] = [
                                'id' => $logger->id,
                                'aqi_index_tsp' => $aqiTsp
                            ];
                        }

                        $updated++;
                        $this->stats['total_updated']++;
                        $recordProgress->setMessage("Updated (TSP: {$logger->tsp} - AQI: {$aqiTsp})");

                    } catch (Exception $e) {
                        $failed++;
                        $this->stats['total_failed']++;
                        $recordProgress->setMessage("Failed");

                        Log::warning('Logger record processing failed', [
                            'logger_id' => $logger->id,
                            'platform_uid' => $logger->uid,
                            'tsp_value' => $logger->tsp,
                            'error' => $e->getMessage()
                        ]);
                    }

                    $recordProgress->advance();
                }

                // Bulk update for better performance
                if (!empty($batchUpdates) && !$this->option('dry-run')) {
                    $this->performBatchUpdate($batchUpdates);
                }
            });

            $recordProgress->finish();

            // Display platform summary
            $this->newLine();
            $this->info("  ✅ Platform {$platform->uid} completed:");
            $this->line("     • Processed: {$processed}");
            $this->line("     • Updated: {$updated}");
            if ($failed > 0) {
                $this->line("     • Failed: {$failed}");
            }
        }

        /**
         * Perform batch update for better performance
         */
        private function performBatchUpdate($batchUpdates) {
            try {
                DB::transaction(function () use ($batchUpdates) {
                    foreach ($batchUpdates as $update) {
                        Loggers::where('id', $update['id'])
                            ->update(['aqi_index_tsp' => $update['aqi_index_tsp']]);
                    }
                });
            } catch (Exception $e) {
                throw new Exception("Batch update failed: " . $e->getMessage());
            }
        }

        /**
         * Calculate AQI for TSP with improved algorithm and caching
         */
        private function calculateAqiTsp($tspValue) {
            if (!is_numeric($tspValue) || $tspValue < 0) {
                return 0;
            }

            $tspValue = (float)$tspValue;

            // Find appropriate category using cached data
            $category = null;
            foreach ($this->aqiCategories as $cat) {
                if ($tspValue >= $cat->tsp_min && $tspValue <= $cat->tsp_max) {
                    $category = $cat;
                    break;
                }
            }

            // If no category found, use the highest category for values exceeding maximum
            if (!$category) {
                $category = collect($this->aqiCategories)->sortByDesc('aqi_max')->first();

                if (!$category) {
                    throw new Exception('No AQI categories available for calculation');
                }
            }

            // Linear interpolation formula for AQI calculation
            $cLow = $category->tsp_min;
            $cHigh = $category->tsp_max;
            $iLow = $category->aqi_min;
            $iHigh = $category->aqi_max;

            // Handle edge case where concentration range is zero
            if ($cHigh == $cLow) {
                return round($iHigh, 2);
            }

            // AQI formula: I = ((IHi - ILo) / (CHi - CLo)) * (C - CLo) + ILo
            $aqi = (($iHigh - $iLow) / ($cHigh - $cLow)) * ($tspValue - $cLow) + $iLow;

            return round(max(0, $aqi), 2);
        }

        /**
         * Display final statistics
         */
        private function displayFinalStats() {
            $this->newLine();
            $this->info('📊 Final Statistics:');
            $this->line("  • Total Processed: {$this->stats['total_processed']}");
            $this->line("  • Total Updated: {$this->stats['total_updated']}");

            if ($this->stats['total_skipped'] > 0) {
                $this->line("  • Total Skipped: {$this->stats['total_skipped']}");
            }

            if ($this->stats['total_failed'] > 0) {
                $this->line("  • Total Failed: {$this->stats['total_failed']}");
            }

            if ($this->option('dry-run')) {
                $this->newLine();
                $this->info('🔍 DRY-RUN completed - No data was actually modified');
            } else {
                $this->newLine();
                $this->info('✅ AQI TSP update process completed successfully!');
            }

            // Log completion
            Log::info('UpdateAQITSP Command Completed', $this->stats);
        }
    }
