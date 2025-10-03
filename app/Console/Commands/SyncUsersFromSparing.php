<?php

    namespace App\Console\Commands;

    use App\Models\Users\User;
    use Exception;
    use Illuminate\Console\Command;
    use App\Models\BeAqms\User as AqmsUser;
    use App\Models\BeSparing\User as SparingUser;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Str;
    use Symfony\Component\Console\Command\Command as CommandAlias;

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
                // Cek apakah kolom id_sparing ada
                if (!$this->checkIdSparingColumn()) {
                    $this->error('Column id_sparing does not exist in AQMS t_users table!');
                    $this->error('Please run: ALTER TABLE t_users ADD COLUMN id_sparing INT NULL AFTER id;');
                    return CommandAlias::FAILURE;
                }

                DB::connection('aqms-mysql')->beginTransaction();

                // Ambil semua user dari Sparing
                $sparingUsers = SparingUser::whereNotNull('user_uniq_id')
                    ->where('user_uniq_id', '!=', '')
                    ->where('deleted_at', null)
                    ->get();

                $this->info("Found {$sparingUsers->count()} users in Sparing database");

                $created = 0;
                $updated = 0;
                $skipped = 0;
                $linkedByEmail = 0;

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
                        // UUID sama
                        if ($onlyNew) {
                            $skipped++;
                            $progressBar->advance();
                            continue;
                        }

                        if ($force) {
                            // Update existing user
                            $aqmsUser->update(array_merge(
                                ['id_sparing' => $sparingUser->id],
                                $this->mapUserData($sparingUser)
                            ));
                            $updated++;
                        } else {
                            // Update hanya id_sparing tanpa mengubah data lain
                            $aqmsUser->update(['id_sparing' => $sparingUser->id]);
                            $skipped++;
                        }
                    } else {
                        // UUID tidak sama, cek berdasarkan email
                        $existingUserByEmail = AqmsUser::where('email', $sparingUser->email)
                            ->whereNotNull('email')
                            ->first();

                        if ($existingUserByEmail) {
                            // Email sama tapi UUID berbeda - update id_sparing saja
                            $existingUserByEmail->update([
                                'id_sparing' => $sparingUser->id
                            ]);
                            $linkedByEmail++;
                            $this->info("\nLinked user by email: {$sparingUser->email} (AQMS UUID: {$existingUserByEmail->id}) -> id_sparing: {$sparingUser->id}");
                        } else {
                            // User baru, belum ada di AQMS
                            User::create(array_merge(
                                [
                                    'id' => $sparingUser->user_uniq_id,
                                    'id_sparing' => $sparingUser->id,
                                ],
                                $this->mapUserData($sparingUser)
                            ));
                            $created++;
                        }
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
                        ['Linked by Email', $linkedByEmail],
                        ['Skipped', $skipped],
                        ['Total', $sparingUsers->count()],
                    ]
                );

            } catch (Exception $e) {
                DB::connection('aqms-mysql')->rollBack();
                $this->error('Error: ' . $e->getMessage());
                $this->error($e->getTraceAsString());
                return CommandAlias::FAILURE;
            }

            return CommandAlias::SUCCESS;
        }

        /**
         * Cek apakah kolom id_sparing ada di tabel
         */
        private function checkIdSparingColumn(): bool {
            try {
                $columns = DB::connection('aqms-mysql')
                    ->select("SHOW COLUMNS FROM t_users LIKE 'id_sparing'");
                return !empty($columns);
            } catch (Exception $e) {
                return false;
            }
        }

        /**
         * Map data dari Sparing ke format AQMS
         */
        private function mapUserData($sparingUser): array {
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
