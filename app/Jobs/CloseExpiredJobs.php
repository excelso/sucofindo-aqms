<?php

namespace App\Jobs;

use App\Models\Recruitment\Job;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CloseExpiredJobs implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $statusClosed = 2;

    /**
     * Execute the job.
     */
    public function handle()
    {
        $now = now();

        // Ambil job yang tanggal expired-nya sudah lewat dan belum ditutup
        $expiredJobs = Job::where('status', '!=', $this->statusClosed)
                          ->where('publication_closing', '<', $now)
                          ->get();

        foreach ($expiredJobs as $job) {
            if($job->auto_close == 1){
                $job->status = $this->statusClosed;
                $job->save();
            }
        }
    }
}