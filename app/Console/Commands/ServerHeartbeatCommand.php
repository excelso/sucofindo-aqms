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
            $servers = Platforms::whereNotNull('ssh_host')->get();
            foreach ($servers as $server) {
                $this->checkServer($server);
            }
        }

        private function checkServer(Platforms $server): void {
            try {
                $ssh = new SSH2($server->ssh_host, $server->ssh_port ?? 22);

                // Login ke server
                if (!$ssh->login($server->ssh_username, $server->ssh_password)) {
                    throw new Exception('Authentication failed');
                }

                $output = $ssh->exec('echo "heartbeat"');

                if (trim($output) === 'heartbeat') {
                    PlatformsHeartbeat::create([
                        'uid' => $server->uid,
                        'heartbeat_status' => 'Online',
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                    $this->info("✅ {$server->uid} is online");
                } else {
                    throw new Exception('Unexpected output');
                }

            } catch (Exception $e) {
                PlatformsHeartbeat::create([
                    'uid' => $server->uid,
                    'heartbeat_status' => 'Offline',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                $this->error("❌ {$server->uid} is offline: " . $e->getMessage());
            }
        }
    }
