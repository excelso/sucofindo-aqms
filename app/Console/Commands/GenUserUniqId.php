<?php

    namespace App\Console\Commands;

    use Illuminate\Console\Command;
    use Illuminate\Support\Str;

    class GenUserUniqId extends Command {
        protected $signature = 'app:gen-user-uniq-id';
        protected $description = 'Command description';
        public function handle(): void {
            $this->info(Str::random(10));
        }
    }
