<?php

    namespace App\Console\Commands;

    use App\Models\Master\Platforms;
    use App\Models\Master\PlatformsHeartbeat;
    use Carbon\Carbon;
    use Exception;
    use Illuminate\Console\Command;
    use Illuminate\Support\Str;
    use phpseclib3\Net\SSH2;

    class ServerHeartbeatCommand extends Command {
        protected $signature = 'server:heartbeat';
        protected $description = 'Check server status via SSH';

        public function handle(): void {
            // Tunggu sampai detik 00 jika belum
            $this->waitForExactSecond();

            // Ambil timestamp yang akan digunakan untuk semua record
            $timestamp = Carbon::now()->startOfMinute();
            $timestamp_unix = Carbon::now()->unix();

            $servers = Platforms::whereNotNull('ssh_host')->get();

            foreach ($servers as $server) {
                $this->checkServer($server, $timestamp, $timestamp_unix);
            }

            $this->info("Heartbeat check completed at: " . $timestamp->format('Y-m-d H:i:s'));
        }

        private function waitForExactSecond(): void {
            $currentSecond = (int) date('s');

            if ($currentSecond !== 0) {
                $waitTime = 60 - $currentSecond;
                $this->info("Waiting {$waitTime} seconds for exact minute...");
                sleep($waitTime);
            }
        }

        private function checkServer(Platforms $server, Carbon $timestamp, $unix): void {
            try {
                $ssh = new SSH2($server->ssh_host, $server->ssh_port ?? 22);

                // Set timeout untuk koneksi SSH
                $ssh->setTimeout(10);

                // Login ke server
                if (!$ssh->login($server->ssh_username, $server->ssh_password)) {
                    throw new Exception('Authentication failed');
                }

                $output = $ssh->exec('echo "heartbeat"');

                if (trim($output) === 'heartbeat') {
                    PlatformsHeartbeat::create([
                        'uid' => $server->uid,
                        'heartbeat_status' => 'Online',
                        'datetime_unix' => $unix,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ]);
                    $this->info("✅ {$server->uid} is online");
                } else {
                    throw new Exception('Unexpected output: ' . $output);
                }

            } catch (Exception $e) {
                PlatformsHeartbeat::create([
                    'uid' => $server->uid,
                    'heartbeat_status' => 'Offline',
                    'error_message' => $e->getMessage(), // Tambahan kolom untuk error
                    'datetime_unix' => $unix,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);
                $this->error("❌ {$server->uid} is offline: " . $e->getMessage());
            } finally {
                // Pastikan SSH connection ditutup
                if (isset($ssh)) {
                    $ssh->disconnect();
                }
            }
        }
    }
