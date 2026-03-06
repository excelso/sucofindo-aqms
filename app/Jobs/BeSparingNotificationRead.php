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
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Log;
    use Throwable;

    class BeSparingNotificationRead implements ShouldQueue {
        use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

        public int $tries = 1;
        public int $timeout = 7200;

        protected string $jobKey;
        protected string $userId;

        /**
         * Create a new job instance.
         *
         * @return void
         */
        public function __construct($jobKey, $userId) {
            $this->jobKey = $jobKey;
            $this->userId = $userId;
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
                $user = User::where('id', $this->userId)->first();
                $userUniqId = $user->user_uniq_id;

                // ── Hitung total unread tanpa memuat data ke PHP ─────────────────
                $total = (int) DB::connection('sparing-mysql')
                    ->table('t_notifikasi')
                    ->leftJoin(
                        DB::raw('(SELECT notifikasi_id, user_uniq_id FROM t_notifikasi_read WHERE user_uniq_id = ?) as nr'),
                        'nr.notifikasi_id', '=', 't_notifikasi.id'
                    )
                    ->whereNull('nr.user_uniq_id')
                    ->where('t_notifikasi.status_kirim', 'terkirim')
                    ->where(function ($q) use ($userUniqId) {
                        $q->where('t_notifikasi.user_uniq_id', $userUniqId)
                            ->orWhereNull('t_notifikasi.user_uniq_id');
                    })
                    ->addBinding($userUniqId, 'join')
                    ->count();

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

                // ── INSERT ... SELECT langsung di DB — zero PHP memory ────────────
                // Semua pemrosesan terjadi di sisi database, tidak ada data yang
                // dimuat ke PHP. PK auto-increment, tidak perlu UUID().
                DB::connection('sparing-mysql')->statement("
                    INSERT INTO t_notifikasi_read
                        (notifikasi_id, user_uniq_id, readed, created_at, updated_at)
                    SELECT
                        t_notifikasi.id,
                        ?,
                        1,
                        NOW(),
                        NOW()
                    FROM t_notifikasi
                    LEFT JOIN t_notifikasi_read AS nr
                        ON  nr.notifikasi_id  = t_notifikasi.id
                        AND nr.user_uniq_id   = ?
                    WHERE nr.notifikasi_id IS NULL
                      AND t_notifikasi.status_kirim = 'terkirim'
                      AND (
                            t_notifikasi.user_uniq_id = ?
                            OR t_notifikasi.user_uniq_id IS NULL
                          )
                ", [$userUniqId, $userUniqId, $userUniqId]);

                $processed = $total;

                $jobsMonitor->update([
                    'status' => 'done',
                    'finished_at' => now(),
                    'message' => "Selesai! Total {$processed} data Notifikasi telah dibaca",
                    'processed_rows' => $processed,
                    'progress_percent' => 100,
                    'last_heartbeat_at' => now(),
                ]);

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
