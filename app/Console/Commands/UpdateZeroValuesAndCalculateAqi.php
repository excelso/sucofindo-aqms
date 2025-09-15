<?php

    namespace App\Console\Commands;

    use Carbon\Carbon;
    use Exception;
    use Illuminate\Console\Command;
    use Illuminate\Support\Collection;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;

    class UpdateZeroValuesAndCalculateAqi extends Command {
        /**
         * The name and signature of the console command.
         *
         * @var string
         */
        protected $signature = 'aqi:update-zero-values
                           {--uid= : Specific UID to process}
                           {--date1= : Specific date to process (Y-m-d format)}
                           {--date2= : Specific date to process (Y-m-d format)}
                           {--limit=100 : Limit number of records to process}';

        /**
         * The console command description.
         *
         * @var string
         */
        protected $description = 'Update zero values for pm_25, pm_10, tsp and calculate AQI indexes';

        /**
         * Execute the console command.
         */
        public function handle() {
            $this->info('Starting AQI update process...');

            $uid = $this->option('uid');
            $date1 = $this->option('date1') ?? Carbon::now()->subDays(30)->format('Y-m-d');
            $date2 = $this->option('date2') ?? Carbon::now()->format('Y-m-d');
            $limit = $this->option('limit');

            try {
                // Get records with zero values
                $zeroValueRecords = $this->getZeroValueRecords($uid, $date1, $date2, $limit);

                if ($zeroValueRecords->isEmpty()) {
                    $this->info('No records with zero values found.');
                    return;
                }

                $this->info("Found {$zeroValueRecords->count()} records to process.");

                $progressBar = $this->output->createProgressBar($zeroValueRecords->count());
                $progressBar->start();

                $processed = 0;
                $failed = 0;

                foreach ($zeroValueRecords as $record) {
                    try {
                        $this->processRecord($record);
                        $processed++;
                    } catch (Exception $e) {
                        $failed++;
                        Log::error("Failed to process record {$record->id}: " . $e->getMessage());
                    }
                    $progressBar->advance();
                }

                $progressBar->finish();
                $this->newLine(2);

                $this->info("Process completed!");
                $this->info("Successfully processed: {$processed} records");
                if ($failed > 0) {
                    $this->warn("Failed to process: {$failed} records");
                }

            } catch (Exception $e) {
                $this->error("Error: " . $e->getMessage());
                Log::error("AQI Update Command Error: " . $e->getMessage());
            }
        }

        /**
         * Get records with zero values
         */
        private function getZeroValueRecords($uid = null, $date1 = null, $date2 = null, $limit = 100): Collection {
            $query = DB::table('t_loggers')
                ->where(function ($q) {
                    $q->where('pm_25', '=', 0)
                        ->orWhere('pm_10', '=', 0)
                        ->orWhere('tsp', '=', 0);
                });

            if ($uid) {
                $query->where('uid', $uid);
            }

            $query->whereDate(DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix), "UTC", "Asia/Makassar")'), '>=',  $date1);
            $query->whereDate(DB::raw('CONVERT_TZ(FROM_UNIXTIME(datetime_unix), "UTC", "Asia/Makassar")'), '<=',  $date2);

            return $query->get();
        }

        /**
         * Process individual record
         * @throws Exception
         */
        private function processRecord($record): void {
            // Get "good" values for this UID
            $goodValues = $this->getGoodValues($record->uid);

            // Update zero values with good values
            $updatedData = [
                'pm_25' => $record->pm_25 == 0 ? $goodValues['pm_25'] : $record->pm_25,
                'pm_10' => $record->pm_10 == 0 ? $goodValues['pm_10'] : $record->pm_10,
                'tsp' => $record->tsp == 0 ? $goodValues['tsp'] : $record->tsp,
            ];

            // Calculate AQI indexes
            $aqiIndexes = $this->calculateAqiIndexes($updatedData);

            // Determine main AQI index and source
            $mainAqi = $this->determineMainAqi($aqiIndexes);

            // Prepare final update data
            $finalData = array_merge($updatedData, $aqiIndexes, $mainAqi);

            // Update the record
            DB::table('t_loggers')
                ->where('id', $record->id)
                ->update($finalData);
        }

        /**
         * Get "good" values based on min_buffer criteria
         * @throws Exception
         */
        private function getGoodValues($uid): array {
            // Get limits for this UID
            $limits = DB::table('t_loggers_limit')
                ->where('uid', $uid)
                ->first();

            if (!$limits) {
                throw new Exception("No limits found for UID: {$uid}");
            }

            // Find good values (below min_buffer)
            $goodRecord = DB::table('t_loggers')
                ->where('uid', $uid)
                ->where('tsp', '<', $limits->tsp_max_buffer ?? 999)
                ->orderBy('datetime_unix')
                ->first();

            if (!$goodRecord) {
                // If no good record found, use default minimal values
                return [
                    'pm_25' => 1.0,
                    'pm_10' => 1.0,
                    'tsp' => 1.0
                ];
            }

            return [
                'pm_25' => $goodRecord->pm_25,
                'pm_10' => $goodRecord->pm_10,
                'tsp' => $goodRecord->tsp
            ];
        }

        /**
         * Calculate AQI indexes based on t_aqi_categories
         */
        private function calculateAqiIndexes($data): array {
            return [
                'aqi_index_pm25' => $this->calculateSingleAqi($data['pm_25'], 'pm25'),
                'aqi_index_pm10' => $this->calculateSingleAqi($data['pm_10'], 'pm10'),
                'aqi_index_tsp' => $this->calculateSingleAqi($data['tsp'], 'tsp'),
            ];
        }

        /**
         * Calculate AQI for a single pollutant
         */
        private function calculateSingleAqi($value, $pollutant) {
            $columnMap = [
                'pm25' => ['min' => 'pm25_min', 'max' => 'pm25_max'],
                'pm10' => ['min' => 'pm10_min', 'max' => 'pm10_max'],
                'tsp' => ['min' => 'tsp_min', 'max' => 'tsp_max']
            ];

            if (!isset($columnMap[$pollutant])) {
                return 0;
            }

            $category = DB::table('t_aqi_categories')
                ->where($columnMap[$pollutant]['min'], '<=', $value)
                ->where($columnMap[$pollutant]['max'], '>=', $value)
                ->first();

            if (!$category) {
                // If value exceeds maximum category, use the highest category
                $category = DB::table('t_aqi_categories')
                    ->orderBy('aqi_max', 'desc')
                    ->first();
            }

            if (!$category) {
                return 0;
            }

            // Linear interpolation formula for AQI calculation
            $cLow = $category->{$columnMap[$pollutant]['min']};
            $cHigh = $category->{$columnMap[$pollutant]['max']};
            $iLow = $category->aqi_min;
            $iHigh = $category->aqi_max;

            if ($cHigh == $cLow) {
                return $iHigh;
            }

            $aqi = (($iHigh - $iLow) / ($cHigh - $cLow)) * ($value - $cLow) + $iLow;

            return round($aqi, 2);
        }

        /**
         * Determine main AQI index and source
         */
        private function determineMainAqi($aqiIndexes) {
            $pm25Aqi = $aqiIndexes['aqi_index_pm25'];
            $pm10Aqi = $aqiIndexes['aqi_index_pm10'];

            if ($pm25Aqi >= $pm10Aqi) {
                return [
                    'aqi_index' => $pm25Aqi,
                    'aqi_from' => 'pm_25'
                ];
            } else {
                return [
                    'aqi_index' => $pm10Aqi,
                    'aqi_from' => 'pm_10'
                ];
            }
        }
    }
