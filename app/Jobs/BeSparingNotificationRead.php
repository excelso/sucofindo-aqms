<?php

namespace App\Jobs;

use App\Models\BeSparing\Notifikasi;
use App\Models\BeSparing\NotifikasiRead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BeSparingNotificationRead implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    protected string $user_uniq_id;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($user_uniq_id) {
        $this->user_uniq_id = $user_uniq_id;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(): void {
        $dataNotifikasiUnread = Notifikasi::dataCountNotifikasi($this->user_uniq_id)->get();
        if ($dataNotifikasiUnread->count() != 0) {
            foreach ($dataNotifikasiUnread as $item) {
                NotifikasiRead::create([
                    'notifikasi_id' => $item->id,
                    'user_uniq_id' => $this->user_uniq_id,
                    'readed' => 1
                ]);
            }
        }
    }
}
