<?php

namespace App\Jobs;

use App\Mail\NotificationMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\Recruitment\EmailStatus;
class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $data;
    protected $email;
    protected $view;
    protected $jobId;

    /**
     * Create a new job instance.
     */
    public function __construct($data, $email, $view, $jobId)
    {
        $this->email = $email;
        $this->data = $data;
        $this->jobId = $jobId;
        $this->view = $view;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        Mail::to($this->email)->send(new NotificationMail($this->data, $this->view));

        EmailStatus::where('job_id', $this->jobId)->update(['status' => 'sent']);
    }

    /**
     * Handle job failure.
     */
    public function failed(\Throwable $exception)
    {
        EmailStatus::where('job_id', $this->jobId)->update(['status' => 'failed']);
        Log::error('Email failed to send: ' . $exception->getMessage());
    }
}
