<?php

    namespace App\Jobs;

    use App\Models\BeSparing\JobsMonitor;
    use App\Models\BeSparing\Notifikasi;
    use App\Models\BeSparing\NotifikasiRead;
    use App\Models\BeSparing\User;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Foundation\Bus\Dispatchable;
    use Illuminate\Queue\InteractsWithQueue;
    use Illuminate\Queue\SerializesModels;
    use Illuminate\Support\Facades\Log;
    use Throwable;

    class BeSparingNotificationRead implements ShouldQueue {
        use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

        public int $tries = 1;
        public int $timeout = 7200;

        protected string $jobKey;
        protected string $userUniqId;

        /**
         * Create a new job instance.
         *
         * @return void
         */
        public function __construct($jobKey, $userUniqId) {
            $this->jobKey = $jobKey;
            $this->userUniqId = $userUniqId;
        }

        /**
         * @throws Exception
         */
        public function handle(): void {
            $jobsMonitor = JobsMonitor::where('job_key', $this->jobKey)->first();
            if (!$jobsMonitor) {
                throw new Exception("Job dengan key {$this->jobKey} tidak ditemukan");
            }

            try {

                $user = User::where('user_uniq_id', $this->userUniqId)->first();
                $notifikasiToRead = Notifikasi::dataCountNotifikasi($this->userUniqId)->get();
                $total = $notifikasiToRead->count();

                $jobsMonitor->update([
                    'total_rows' => $total,
                    'processed_rows' => 0,
                    'progress_percent' => 0,
                    'message' => "Memproses {$total} data Notifikasi {$user->nama_lengkap} untuk dibaca semua...",
                    'last_heartbeat_at' => Carbon::now(),
                ]);

                if ($total === 0) {
                    $jobsMonitor->update([
                        'status' => 'done',
                        'finished_at' => Carbon::now(),
                        'message' => 'Tidak ada data Notifikasi untuk diproses',
                        'progress_percent' => 100,
                        'last_heartbeat_at' => Carbon::now(),
                    ]);
                    return;
                }

                $processed = 0;
                foreach ($notifikasiToRead as $item) {
                    $jobsMonitor->refresh();
                    if ($jobsMonitor->cancel_requested == 1) {
                        $jobsMonitor->update([
                            'status' => 'cancelled',
                            'finished_at' => now(),
                            'message' => 'Proses dibatalkan oleh user',
                        ]);
                        return;
                    }

                    $processed++;

                    if ($processed % 10 === 0 || $processed === $total) {
                        $progress = round(($processed / $total) * 100, 2);

                        $jobsMonitor->update([
                            'processed_rows' => $processed,
                            'progress_percent' => $progress,
                            'message' => "Memproses data Notifikasi {$processed} dari {$total} - Notif ID: {$item->id}",
                            'last_heartbeat_at' => now(),
                        ]);
                    }

                    NotifikasiRead::updateOrCreate([
                        'notifikasi_id' => $item->id,
                        'user_uniq_id' => $this->userUniqId,
                    ],[
                        'readed' => 1
                    ]);

                    $jobsMonitor->update([
                        'status' => 'done',
                        'finished_at' => now(),
                        'message' => "Selesai! Total {$total} data Notifikasi telah dibaca",
                        'progress_percent' => 100,
                        'last_heartbeat_at' => now(),
                    ]);
                }

            } catch (Exception $e) {
                $jobsMonitor->update([
                    'status' => 'failed',
                    'finished_at' => now(),
                    'message' => $e->getMessage() . ' (Line: ' . $e->getLine() . ')',
                    'last_heartbeat_at' => now(),
                ]);

                throw $e;
            }
        }

        public function failed(Throwable $exception): void {
            Log::error('Job failed method called', [
                'job_key' => $this->jobKey,
                'exception_type' => get_class($exception),
                'error' => $exception->getMessage(),
                'line' => $exception->getLine()
            ]);

            $jobsMonitor = JobsMonitor::where('job_key', $this->jobKey)->first();

            $jobsMonitor?->update([
                'status' => 'failed',
                'finished_at' => now(),
                'message' => 'Error: ' . $exception->getMessage() . ' (Line: ' . $exception->getLine() . ')',
                'last_heartbeat_at' => now(),
            ]);
        }
    }
