<?php

    namespace App\Models\BeSparing;

    use Illuminate\Database\Eloquent\Model;

    class JobsMonitor extends Model {

        protected $connection = 'sparing-mysql';
        protected $table = 't_jobs_monitor';

        // Konstanta untuk step names
        const array STEP_NAMES = [
            1 => 'Snapshot Oracle (Pra Rekon)',
            2 => 'Snapshot Oracle (Billing BK)',
            3 => 'Matching Internal vs Oracle',
            4 => 'Deteksi BK Tanpa Billing Pungutan',
        ];

        protected $fillable = [
            'job_key',
            'job_type',
            'start_date',
            'end_date',
            'status',
            'total_rows',
            'processed_rows',
            'progress_percent',
            'batch_size',
            'current_step',
            'step_details',
            'message',
            'cancel_requested',
            'retry_count',
            'last_heartbeat_at',
            'started_at',
            'finished_at',
            'created_at',
            'updated_at',
        ];

        protected $casts = [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'step_details' => 'array',
            'last_heartbeat_at' => 'datetime',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];

        /**
         * Scope untuk job aktif (pending atau running)
         */
        public function scopeActive($query) {
            return $query->whereIn('status', ['pending', 'running']);
        }

        /**
         * Scope untuk filter berdasarkan jenis rekon
         */
        public function scopeType($query, string $type) {
            return $query->where('job_type', $type);
        }

        /**
         * Scope untuk mencari job berdasarkan periode
         */
        public function scopeForPeriod($query, string $start, string $end) {
            return $query->where('start_date', $start)
                ->where('end_date', $end);
        }

        /**
         * Hitung persentase progres (backup untuk validasi)
         */
        public function calculateProgress(): float {
            if ($this->total_rows <= 0) return 0.0;
            return round(($this->processed_rows / $this->total_rows) * 100, 2);
        }

        /**
         * Initialize step details untuk rekon eksternal (4 steps)
         */
        public function initializeSteps(): void {
            $steps = [];

            foreach (self::STEP_NAMES as $stepNumber => $stepName) {
                $steps[$stepNumber] = [
                    'step_name' => $stepName,
                    'status' => 'pending',
                    'started_at' => null,
                    'finished_at' => null,
                    'message' => null,
                    'error' => null,
                ];
            }

            $this->update([
                'step_details' => $steps,
                'current_step' => 1,
            ]);
        }

        /**
         * Update status step tertentu
         */
        public function updateStepStatus(
            int     $stepNumber,
            string  $status,
            ?string $message = null,
            ?array  $error = null
        ): void {
            $steps = $this->step_details ?? [];

            if (!isset($steps[$stepNumber])) {
                $steps[$stepNumber] = [
                    'step_name' => self::STEP_NAMES[$stepNumber] ?? "Step {$stepNumber}",
                    'status' => 'pending',
                    'started_at' => null,
                    'finished_at' => null,
                    'message' => null,
                    'error' => null,
                ];
            }

            // Update status
            $steps[$stepNumber]['status'] = $status;

            // Set started_at jika status running dan belum ada
            if ($status === 'running' && empty($steps[$stepNumber]['started_at'])) {
                $steps[$stepNumber]['started_at'] = now()->toDateTimeString();
            }

            // Set finished_at jika status done atau failed
            if (in_array($status, ['done', 'failed'])) {
                $steps[$stepNumber]['finished_at'] = now()->toDateTimeString();
            }

            // Update message jika ada
            if ($message !== null) {
                $steps[$stepNumber]['message'] = $message;
            }

            // Update error jika ada (untuk opsi C: structured error)
            if ($error !== null) {
                $steps[$stepNumber]['error'] = $error;
            }

            $this->update([
                'step_details' => $steps,
                'last_heartbeat_at' => now(),
            ]);
        }

        /**
         * Tandai step sebagai running
         */
        public function startStep(int $stepNumber, ?string $message = null): void {
            $this->updateStepStatus($stepNumber, 'running', $message);
            $this->update(['current_step' => $stepNumber]);
        }

        /**
         * Tandai step sebagai done
         */
        public function completeStep(int $stepNumber, ?string $message = null): void {
            $this->updateStepStatus($stepNumber, 'done', $message);
        }

        /**
         * Tandai step sebagai failed dengan error detail
         */
        public function failStep(
            int         $stepNumber,
            string      $errorMessage,
            ?\Throwable $exception = null
        ): void {
            $error = [
                'error_code' => $exception ? get_class($exception) : 'UNKNOWN_ERROR',
                'error_message' => $errorMessage,
                'timestamp' => now()->toDateTimeString(),
                'step_context' => [
                    'step_number' => $stepNumber,
                    'step_name' => self::STEP_NAMES[$stepNumber] ?? "Step {$stepNumber}",
                ],
            ];

            // Tambahkan trace jika ada exception
            if ($exception) {
                $error['trace'] = collect(explode("\n", $exception->getTraceAsString()))
                    ->take(5)
                    ->toArray();
            }

            $this->updateStepStatus($stepNumber, 'failed', $errorMessage, $error);
        }

        /**
         * Get status step tertentu
         */
        public function getStepStatus(int $stepNumber): ?string {
            $steps = $this->step_details ?? [];
            return $steps[$stepNumber]['status'] ?? null;
        }

        /**
         * Get detail step tertentu
         */
        public function getStepDetail(int $stepNumber): ?array {
            $steps = $this->step_details ?? [];
            return $steps[$stepNumber] ?? null;
        }

        /**
         * Check apakah step sudah selesai
         */
        public function isStepCompleted(int $stepNumber): bool {
            return $this->getStepStatus($stepNumber) === 'done';
        }

        /**
         * Check apakah step gagal
         */
        public function isStepFailed(int $stepNumber): bool {
            return $this->getStepStatus($stepNumber) === 'failed';
        }

        /**
         * Get progress berdasarkan step (25% per step untuk eksternal)
         */
        public function calculateStepProgress(): float {
            if ($this->job_type !== 'eksternal') {
                return $this->calculateProgress();
            }

            $completedSteps = 0;
            $steps = $this->step_details ?? [];

            foreach ($steps as $stepNumber => $stepDetail) {
                if (($stepDetail['status'] ?? 'pending') === 'done') {
                    $completedSteps++;
                }
            }

            return round(($completedSteps / 4) * 100, 2);
        }

        /**
         * Get current step name
         */
        public function getCurrentStepName(): string {
            return self::STEP_NAMES[$this->current_step] ?? "Step {$this->current_step}";
        }

        /**
         * Reset steps untuk retry (cleanup step yang gagal)
         */
        public function resetFromStep(int $fromStep): void {
            $steps = $this->step_details ?? [];

            // Reset semua step >= fromStep
            for ($i = $fromStep; $i <= 4; $i++) {
                if (isset($steps[$i])) {
                    $steps[$i]['status'] = 'pending';
                    $steps[$i]['started_at'] = null;
                    $steps[$i]['finished_at'] = null;
                    $steps[$i]['message'] = null;
                    $steps[$i]['error'] = null;
                }
            }

            $this->update([
                'step_details' => $steps,
                'current_step' => $fromStep,
                'status' => 'pending',
                'message' => "Reset dari step {$fromStep}: " . self::STEP_NAMES[$fromStep],
            ]);
        }
    }
