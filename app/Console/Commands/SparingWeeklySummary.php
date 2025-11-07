<?php

    namespace App\Console\Commands;

    use App\Http\Controllers\WeekCalculator;
    use App\Models\BeSparing\Master\Platform;
    use App\Models\BeSparing\Master\PlatformWeeklySummary;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Console\Command;
    use Log;

    class SparingWeeklySummary extends Command {
        /**
         * The name and signature of the console command.
         *
         * @var string
         */
        protected $signature = 'app:sparing-weekly-summary';

        /**
         * The console command description.
         *
         * @var string
         */
        protected $description = 'Command description';

        /**
         * Execute the console command.
         */
        public function handle() {
            try {
                $weekCalculator = new WeekCalculator();
                $week = $weekCalculator->getWeekInfoForDate(Carbon::now());
                $weekInfo = $week['weekInfo'];
                $weekNumb = $week['weekNumber'];

                $startDate = $weekInfo['startDate'];
                $untilDate = $weekInfo['untilDate'];

                $dataParam = Platform::platformWeeklySummary($startDate, $untilDate, 'Asia/Makassar')->get();

                if (isset($dataParam)) {
                    foreach ($dataParam as $item) {
                        PlatformWeeklySummary::updateOrCreate([
                            'uid' => $item->uid,
                            'tipe_logger' => $item->tipe_logger,
                            'week_start' => $startDate,
                            'week_until' => $untilDate,
                        ], [
                            'uid' => $item->uid,
                            'tipe_logger' => $item->tipe_logger,
                            'week_start' => $startDate,
                            'week_until' => $untilDate,
                            'week_number' => $weekNumb,
                            'data_entry' => $item->persen,
                            'ph_comply' => $item->percentagePh,
                            'tss_comply' => $item->percentageTss,
                            'debit_comply' => $item->percentageDebit,
                        ]);
                    }
                }

                $this->info('Insert Weekly Summary Successfully');
                Log::info('Insert Weekly Summary Successfully');
            } catch (Exception $exception) {
                $this->error($exception->getMessage());
                Log::error($exception->getMessage());
            }
        }
    }
