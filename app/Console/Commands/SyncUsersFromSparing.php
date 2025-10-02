<?php

    namespace App\Console\Commands;

    use Illuminate\Console\Command;
    use App\Models\BeAqms\User as AqmsUser;
    use App\Models\BeSparing\User as SparingUser;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Str;

    class SyncUsersFromSparing extends Command {
        protected $signature = 'sync:users-from-sparing
                            {--force : Force update existing users}
                            {--only-new : Only sync new users}';

        protected $description = 'Sync users from Sparing database to AQMS database';

        public function handle() {
            $this->info('Starting user synchronization from Sparing to AQMS...');

            $force = $this->option('force');
            $onlyNew = $this->option('only-new');

            try {
                DB::connection('aqms-mysql')->beginTransaction();

                // Ambil semua user dari Sparing
                $sparingUsers = SparingUser::whereNotNull('user_uniq_id')
                    ->where('deleted_at', null)
                    ->get();

                $this->info("Found {$sparingUsers->count()} users in Sparing database");

                $created = 0;
                $updated = 0;
                $skipped = 0;

                $progressBar = $this->output->createProgressBar($sparingUsers->count());
                $progressBar->start();

                foreach ($sparingUsers as $sparingUser) {
                    // Cek apakah user_uniq_id valid UUID
                    if (empty($sparingUser->user_uniq_id)) {

                        $this->warn("\nSkipping user {$sparingUser->id} - Invalid UUID: {$sparingUser->user_uniq_id}");
                        $skipped++;
                        $progressBar->advance();
                        continue;
                    }

                    // Cari user di AQMS berdasarkan UUID
                    $aqmsUser = AqmsUser::find($sparingUser->user_uniq_id);

                    if ($aqmsUser) {
                        if ($onlyNew) {
                            $skipped++;
                            $progressBar->advance();
                            continue;
                        }

                        if ($force) {
                            // Update existing user
                            $aqmsUser->update($this->mapUserData($sparingUser));
                            $updated++;
                        } else {
                            $skipped++;
                        }
                    } else {
                        // Create new user
                        AqmsUser::create(array_merge(
                            ['id' => $sparingUser->user_uniq_id],
                            $this->mapUserData($sparingUser)
                        ));
                        $created++;
                    }

                    $progressBar->advance();
                }

                $progressBar->finish();
                $this->newLine(2);

                DB::connection('aqms-mysql')->commit();

                $this->info("✓ Synchronization completed!");
                $this->table(
                    ['Action', 'Count'],
                    [
                        ['Created', $created],
                        ['Updated', $updated],
                        ['Skipped', $skipped],
                        ['Total', $sparingUsers->count()],
                    ]
                );

            } catch (\Exception $e) {
                DB::connection('aqms-mysql')->rollBack();
                $this->error('Error: ' . $e->getMessage());
                $this->error($e->getTraceAsString());
                return Command::FAILURE;
            }

            return Command::SUCCESS;
        }

        /**
         * Map data dari Sparing ke format AQMS
         */
        private function mapUserData($sparingUser) {
            return [
                'tipe_user' => $sparingUser->tipe_user,
                'sid_code' => $sparingUser->sid_code,
                'nama_lengkap' => $sparingUser->nama_lengkap,
                'email' => $sparingUser->email,
                'password' => $sparingUser->password,
                'user_level' => $sparingUser->user_level,
                'is_customer' => $sparingUser->is_customer ?? 0,
                'company_id' => null, // Sesuaikan mapping jika ada
                'status_user' => $sparingUser->status_user,
                'init_master' => $sparingUser->init_master ?? 0,
                'is_showing' => $sparingUser->is_showing ?? 1,
                'last_login' => $sparingUser->last_login,
                'remember_token' => $sparingUser->remember_token,
                'current_fcm_token' => $sparingUser->current_fcm_token,
            ];
        }
    }
